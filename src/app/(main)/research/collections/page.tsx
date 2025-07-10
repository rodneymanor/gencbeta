"use client";

/* eslint-disable max-lines */
// Prevent Next.js from attempting to statically prerender a client-side page
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useTransition, useRef, memo, Suspense } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { VideoCollectionLoading, PageHeaderLoading } from "@/components/ui/loading-animations";
import { useAuth } from "@/contexts/auth-context";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import CategoryChooser from "./_components/category-chooser";
import { CollectionBadgeMenu } from "./_components/collection-badge-menu";
import { badgeVariants } from "./_components/collections-animations";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./_components/collections-helpers";
import { ManageModeHeader } from "./_components/manage-mode-header";
import { VideoGrid } from "./_components/video-grid";

// Simplified cache for better performance
interface SimpleCache {
  data: Map<string, { videos: VideoWithPlayer[]; timestamp: number }>;
}

const CACHE_DURATION = 30000; // 30 seconds

// Delayed fallback component to prevent flash
const DelayedFallback = memo(
  ({ delay = 200, show, children }: { delay?: number; show: boolean; children: React.ReactNode }) => {
    const [shouldShow, setShouldShow] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      if (show) {
        timeoutRef.current = setTimeout(() => setShouldShow(true), delay);
      } else {
        setShouldShow(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [show, delay]);

    return shouldShow ? <>{children}</> : null;
  },
);

DelayedFallback.displayName = "DelayedFallback";

// Optimized collection badge with smooth transitions and management menu
const CollectionBadge = memo(
  ({
    collection,
    isActive,
    onClick,
    videoCount,
    isTransitioning,
    onCollectionDeleted,
    onCollectionUpdated,
  }: {
    collection?: Collection;
    isActive: boolean;
    onClick: () => void;
    videoCount: number;
    isTransitioning: boolean;
    onCollectionDeleted: () => void;
    onCollectionUpdated: () => void;
  }) => (
    <motion.div
      variants={badgeVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      layout
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="group relative"
    >
      <Badge
        variant="outline"
        className={`focus-visible:ring-ring cursor-pointer font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isActive
            ? "bg-secondary text-foreground hover:bg-secondary/80 border-border/60 font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/40 bg-transparent font-normal"
        } ${isTransitioning && isActive ? "opacity-75" : ""} ${isTransitioning ? "pointer-events-none" : ""} min-h-[36px] rounded-md border-0 px-4 py-2.5 text-sm shadow-xs hover:shadow-sm`}
        onClick={isTransitioning ? undefined : onClick}
      >
        {collection ? `${collection.title} (${collection.videoCount})` : `All Videos (${videoCount})`}
      </Badge>
      {collection && (
        <div className="absolute -top-1 -right-1">
          <CollectionBadgeMenu
            collection={collection}
            onCollectionDeleted={onCollectionDeleted}
            onCollectionUpdated={onCollectionUpdated}
            className="bg-background border-border rounded-md border shadow-md transition-shadow duration-200 hover:shadow-lg"
          />
        </div>
      )}
    </motion.div>
  ),
);

CollectionBadge.displayName = "CollectionBadge";

// Main collections page component - simplified and optimized
function CollectionsPageContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDocRef, setLastDocRef] = useState<any>(null);

  // Debug message to verify code deployment
  console.log("🎉 Hello from Collections Page! Code updated with scrolling fixes and pagination - Version 2.0");

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

  const setCachedVideos = useCallback((collectionId: string | null, videos: VideoWithPlayer[]) => {
    const key = collectionId ?? "all";
    cacheRef.current.data.set(key, { videos, timestamp: Date.now() });
  }, []);

  // Helper function to validate collection exists
  const validateCollectionExists = useCallback(
    (collectionId: string | null, collections: Collection[]) => {
      if (!collectionId || collectionId === "all-videos") return true;

      const collectionExists = collections.some((c) => c.id === collectionId);
      if (!collectionExists) {
        console.warn("⚠️ [Collections] Collection not found, redirecting to all videos:", collectionId);
        // Clear cache for clean refresh
        cacheRef.current.data.clear();
        // Redirect to all videos without the invalid collection parameter
        startTransition(() => {
          router.push("/research/collections", { scroll: false });
        });
        return false;
      }
      return true;
    },
    [router],
  );

  // Helper function to handle video loading result
  const handleVideoResult = useCallback(
    (
      videosResult: PromiseSettledResult<{ videos: Video[]; lastDoc?: any }>,
      collectionId: string | null,
      isLoadMore = false,
    ) => {
      if (videosResult.status === "fulfilled") {
        const { videos, lastDoc } = videosResult.value;
        const optimizedVideos = videos.map((video) => ({
          ...video,
          isPlaying: false,
        }));

        if (isLoadMore) {
          setVideos((prev) => [...prev, ...optimizedVideos]);
          // Check if we got fewer videos than requested (indicating no more videos)
          setHasMoreVideos(optimizedVideos.length === 24);
        } else {
          setVideos(optimizedVideos);
          setCachedVideos(collectionId, optimizedVideos);
          setHasMoreVideos(optimizedVideos.length === 24);
        }

        // Update last document reference for pagination
        setLastDocRef(lastDoc);
      } else {
        console.error("Error loading videos:", videosResult.reason);
        // If videos failed to load due to invalid collection, clear videos
        if (videosResult.reason?.message?.includes("Collection not found")) {
          setVideos([]);
        }
      }
    },
    [setCachedVideos],
  );

  // OPTIMIZED: Parallel data loading - this eliminates the 3-second delay
  const loadData = useCallback(
    async (targetCollectionId?: string | null) => {
      if (!user) return;

      const collectionId = targetCollectionId !== undefined ? targetCollectionId : selectedCollectionId;

      // Check cache first
      const cachedVideos = getCachedVideos(collectionId);
      if (cachedVideos) {
        console.log("📦 [Collections] Using cached data");
        setVideos(cachedVideos);
        setIsTransitioning(false);
        return;
      }

      console.log("🚀 [Collections] Loading data in parallel...");

      try {
        // CRITICAL OPTIMIZATION: Load collections and videos in parallel
        const [collectionsResult, videosResult] = await Promise.allSettled([
          CollectionsRBACService.getUserCollections(user.uid),
          CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined, 24), // Load 24 videos initially (6 rows on mobile, 3 rows on tablet, 2 rows on desktop)
        ]);

        // Handle collections result
        if (collectionsResult.status === "fulfilled") {
          setCollections(collectionsResult.value);

          // Validate collection exists and redirect if not
          if (!validateCollectionExists(collectionId, collectionsResult.value)) {
            return;
          }
        } else {
          console.error("Error loading collections:", collectionsResult.reason);
        }

        // Handle videos result
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

  // Optimized collection navigation
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      if (collectionId === previousCollectionRef.current || isTransitioning) return;

      previousCollectionRef.current = collectionId;

      // Reset pagination state
      setLastDocRef(null);
      setHasMoreVideos(true);

      // Check cache first for instant switching
      const cachedVideos = getCachedVideos(collectionId);
      if (cachedVideos) {
        setVideos(cachedVideos);
      } else {
        setIsTransitioning(true);
      }

      // Navigate
      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path, { scroll: false });
      });

      // Load fresh data if not cached
      if (!cachedVideos) {
        loadData(collectionId);
      }
    },
    [router, isTransitioning, getCachedVideos, loadData],
  );

  // Role-based access control
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (!userProfile) return;

    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      router.push("/dashboard");
      return;
    }
  }, [user, userProfile, router]);

  // OPTIMIZED: Single data loading effect
  useEffect(() => {
    if (user && userProfile && isLoading) {
      loadData();
    }
  }, [user, userProfile, isLoading, loadData]);

  useEffect(() => {
    setTopBarConfig({ title: "Collections" });
  }, [setTopBarConfig]);

  // Video management functions
  const handleVideoAdded = useCallback(async () => {
    // Clear cache and reload
    cacheRef.current.data.clear();
    await loadData();
  }, [loadData]);

  const handleCollectionUpdated = useCallback(async () => {
    // Clear cache and reload collections and videos
    cacheRef.current.data.clear();
    await loadData();
  }, [loadData]);

  const handleCollectionDeleted = useCallback(async () => {
    if (!user) return;

    try {
      if (selectedCollectionId) {
        startTransition(() => {
          router.push("/research/collections");
        });
      }

      // Clear cache and reload
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

        // Optimistic update
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
        // Reload on error
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
      // Process deletions in batches
      const batchSize = 5;
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        await Promise.all(batch.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));
      }

      // Optimistic update
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

  const handleLoadMore = useCallback(async () => {
    if (!user || isLoadingMore || !hasMoreVideos || !lastDocRef) return;

    setIsLoadingMore(true);

    try {
      console.log("🔄 [Collections] Loading more videos with cursor");

      const result = await CollectionsRBACService.getCollectionVideos(
        user.uid,
        selectedCollectionId ?? undefined,
        24,
        lastDocRef,
      );

      handleVideoResult({ status: "fulfilled", value: result }, selectedCollectionId, true);
    } catch (error) {
      console.error("❌ [Collections] Error loading more videos:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [user, isLoadingMore, hasMoreVideos, lastDocRef, selectedCollectionId, handleVideoResult]);

  // Don't show anything until collections are loaded and validated
  if (isLoading || (selectedCollectionId && !validateCollectionExists(selectedCollectionId, collections))) {
    return <VideoCollectionLoading />;
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl justify-center gap-8 p-4 md:p-6">
      {/* Left side: Main content (Video Grid) */}
      <div className="flex-1">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground max-w-prose">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <ManageModeHeader
              manageMode={manageMode}
              selectedVideos={selectedVideos}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onManageModeToggle={() => setManageMode(!manageMode)}
              onExitManageMode={handleExitManageMode}
              onBulkDelete={handleBulkDelete}
              onClearSelection={clearSelection}
              onSelectAll={selectAllVideos}
              onVideoAdded={handleVideoAdded}
            />
          </div>
        </header>

        <main>
          <VideoGrid
            videos={videos}
            selectedCollectionId={selectedCollectionId}
            loadingVideos={isTransitioning}
            isPending={isPending}
            manageMode={manageMode}
            selectedVideos={selectedVideos}
            deletingVideos={deletingVideos}
            onToggleVideoSelection={toggleVideoSelection}
            onDeleteVideo={handleDeleteVideo}
            onVideoAdded={handleVideoAdded}
            collections={collections}
            onLoadMore={handleLoadMore}
            hasMoreVideos={hasMoreVideos}
            isLoadingMore={isLoadingMore}
          />
        </main>
      </div>

      {/* Right side: Category Chooser */}
      <div className="w-64">
        <CategoryChooser
          items={categoryItems}
          selectedId={selectedCollectionId ?? "all-videos"}
          onSelectionChange={(item) => handleCollectionChange(item.id === "all-videos" ? null : item.id)}
        />
      </div>
    </div>
  );
}

// Main export
export default function CollectionsPage() {
  return (
    <Suspense fallback={<VideoCollectionLoading />}>
      <CollectionsPageContent />
    </Suspense>
  );
}
