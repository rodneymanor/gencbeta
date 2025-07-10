import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { createVideoSelectionHandlers, type VideoWithPlayer } from "../_components/collections-helpers";

interface SimpleCache {
  data: Map<string, { videos: VideoWithPlayer[]; timestamp: number }>;
}

const CACHE_DURATION = 30000; // 30 seconds

export function useCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const cacheRef = useRef<SimpleCache>({ data: new Map() });
  const previousCollectionRef = useRef<string | null>(null);

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");
  const setTopBarConfig = useTopBarConfig();

  const { toggleVideoSelection, selectAllVideos, clearSelection } = useMemo(
    () => createVideoSelectionHandlers(setSelectedVideos, videos),
    [videos],
  );

  const pageTitle = useMemo(() => {
    if (!selectedCollectionId) return "All Videos";
    const collection = collections.find((c) => c.id === selectedCollectionId);
    return collection?.title ?? "All Videos";
  }, [selectedCollectionId, collections]);

  const pageDescription = useMemo(() => {
    if (selectedCollectionId) {
      const collection = collections.find((c) => c.id === selectedCollectionId);
      if (collection?.description) return collection.description;
    }
    return "Browse and manage your video collections";
  }, [selectedCollectionId, collections]);

  const categoryItems = useMemo(() => {
    const items = collections.map((c) => ({ id: c.id!, name: c.title }));
    items.unshift({ id: "all-videos", name: "All Videos" });
    return items;
  }, [collections]);

  const getCachedVideos = useCallback((collectionId: string | null): VideoWithPlayer[] | null => {
    const key = collectionId ?? "all";
    const cached = cacheRef.current.data.get(key);
    if (!cached) return null;

    const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
    return isValid ? cached.videos : null;
  }, []);

  const setCachedVideos = useCallback((collectionId: string | null, videosData: VideoWithPlayer[]) => {
    const key = collectionId ?? "all";
    cacheRef.current.data.set(key, { videos: videosData, timestamp: Date.now() });
  }, []);

  const validateCollectionExists = useCallback(
    (collectionId: string | null, currentCollections: Collection[]) => {
      if (!collectionId || collectionId === "all-videos") return true;

      const collectionExists = currentCollections.some((c) => c.id === collectionId);
      if (!collectionExists) {
        console.warn("⚠️ [Collections] Collection not found, redirecting to all videos:", collectionId);
        cacheRef.current.data.clear();
        startTransition(() => {
          router.push("/research/collections", { scroll: false });
        });
        return false;
      }
      return true;
    },
    [router],
  );

  const handleVideoResult = useCallback(
    (videosResult: PromiseSettledResult<Video[]>, collectionId: string | null) => {
      if (videosResult.status === "fulfilled") {
        const optimizedVideos = videosResult.value.map((video) => ({
          ...video,
          isPlaying: false,
        }));

        setVideos(optimizedVideos);
        setCachedVideos(collectionId, optimizedVideos);
      } else {
        console.error("Error loading videos:", videosResult.reason);
        if (videosResult.reason?.message?.includes("Collection not found")) {
          setVideos([]);
        }
      }
    },
    [setCachedVideos],
  );

  const loadData = useCallback(
    async (targetCollectionId?: string | null) => {
      if (!user) return;

      const collectionId = targetCollectionId !== undefined ? targetCollectionId : selectedCollectionId;
      const cachedVideos = getCachedVideos(collectionId);

      if (cachedVideos) {
        console.log("📦 [Collections] Using cached data");
        setVideos(cachedVideos);
        setIsTransitioning(false);
        return;
      }

      console.log("🚀 [Collections] Loading data in parallel...");
      try {
        const [collectionsResult, videosResult] = await Promise.allSettled([
          CollectionsRBACService.getUserCollections(user.uid),
          CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined),
        ]);

        if (collectionsResult.status === "fulfilled") {
          setCollections(collectionsResult.value);
          if (!validateCollectionExists(collectionId, collectionsResult.value)) {
            return;
          }
        } else {
          console.error("Error loading collections:", collectionsResult.reason);
        }

        handleVideoResult(videosResult, collectionId);
        console.log("✅ [Collections] Parallel loading completed");
      } catch (error) {
        console.error("❌ [Collections] Error loading data:", error);
      } finally {
        setIsLoading(false);
        setIsTransitioning(false);
      }
    },
    [user, selectedCollectionId, getCachedVideos, validateCollectionExists, handleVideoResult],
  );

  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      if (collectionId === previousCollectionRef.current || isTransitioning) return;
      previousCollectionRef.current = collectionId;

      const cachedVideos = getCachedVideos(collectionId);
      if (cachedVideos) {
        setVideos(cachedVideos);
      } else {
        setIsTransitioning(true);
      }

      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path, { scroll: false });
      });

      if (!cachedVideos) {
        loadData(collectionId);
      }
    },
    [router, isTransitioning, getCachedVideos, loadData],
  );

  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }
    if (!userProfile) return;
    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      router.push("/dashboard");
    }
  }, [user, userProfile, router]);

  useEffect(() => {
    if (user && userProfile && isLoading) {
      loadData();
    }
  }, [user, userProfile, isLoading, loadData]);

  useEffect(() => {
    setTopBarConfig({ title: "Collections" });
  }, [setTopBarConfig]);

  const handleVideoAdded = useCallback(async () => {
    if (!user) return;
    
    // Clear cache and force fresh data fetch
    cacheRef.current.data.clear();
    
    console.log("🔄 [Collections] Refreshing collections after video/collection added");
    
    try {
      // Force fresh fetch of both collections and videos
      const [collectionsResult, videosResult] = await Promise.allSettled([
        CollectionsRBACService.getUserCollections(user.uid),
        CollectionsRBACService.getCollectionVideos(user.uid, selectedCollectionId ?? undefined),
      ]);

      if (collectionsResult.status === "fulfilled") {
        setCollections(collectionsResult.value);
        console.log("✅ [Collections] Collections refreshed:", collectionsResult.value.length);
      } else {
        console.error("Error refreshing collections:", collectionsResult.reason);
      }

      if (videosResult.status === "fulfilled") {
        const optimizedVideos = videosResult.value.map((video) => ({
          ...video,
          isPlaying: false,
        }));
        setVideos(optimizedVideos);
        setCachedVideos(selectedCollectionId, optimizedVideos);
        console.log("✅ [Collections] Videos refreshed:", optimizedVideos.length);
      } else {
        console.error("Error refreshing videos:", videosResult.reason);
      }
    } catch (error) {
      console.error("❌ [Collections] Error refreshing data:", error);
    }
  }, [user, selectedCollectionId, setCachedVideos]);

  const handleCollectionDeleted = useCallback(async () => {
    if (!user) return;
    try {
      if (selectedCollectionId) {
        startTransition(() => {
          router.push("/research/collections");
        });
      }
      cacheRef.current.data.clear();
      await loadData();
    } catch (error) {
      console.error("Error refreshing after collection deleted:", error);
    }
  }, [user, selectedCollectionId, router, loadData]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;
      setDeletingVideos((prev) => new Set([...prev, videoId]));
      try {
        await CollectionsService.deleteVideo(user.uid, videoId);
        setVideos((prev) => {
          const newVideos = prev.filter((video) => video.id !== videoId);
          setCachedVideos(selectedCollectionId, newVideos);
          return newVideos;
        });
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting video:", error);
        await loadData();
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [user, selectedCollectionId, setCachedVideos, loadData],
  );

  const handleBulkDelete = useCallback(async () => {
    if (!user || selectedVideos.size === 0) return;
    const videoIds = Array.from(selectedVideos);
    setDeletingVideos((prev) => new Set([...prev, ...videoIds]));
    try {
      const batchSize = 5;
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        await Promise.all(batch.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));
      }
      setVideos((prev) => {
        const newVideos = prev.filter((video) => !videoIds.includes(video.id!));
        setCachedVideos(selectedCollectionId, newVideos);
        return newVideos;
      });
      setSelectedVideos(new Set());
      setDeletingVideos(new Set());
    } catch (error) {
      console.error("Error deleting videos:", error);
      await loadData();
      setDeletingVideos(new Set());
    }
  }, [user, selectedVideos, selectedCollectionId, setCachedVideos, loadData]);

  const handleExitManageMode = useCallback(() => {
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  return {
    collections,
    videos,
    isLoading,
    isTransitioning,
    manageMode,
    selectedVideos,
    deletingVideos,
    isPending,
    selectedCollectionId,
    pageTitle,
    pageDescription,
    categoryItems,
    setManageMode,
    handleCollectionChange,
    toggleVideoSelection,
    selectAllVideos,
    clearSelection,
    handleVideoAdded,
    handleCollectionDeleted,
    handleDeleteVideo,
    handleBulkDelete,
    handleExitManageMode,
    shouldShowLoading:
      isLoading || (selectedCollectionId && !validateCollectionExists(selectedCollectionId, collections)),
  };
}
