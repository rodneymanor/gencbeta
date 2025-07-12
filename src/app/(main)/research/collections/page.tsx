"use client";

/* eslint-disable max-lines, complexity */
// Prevent Next.js from attempting to statically prerender a client-side page
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo, useTransition, useRef, memo, Suspense } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { Edit3, Loader2, Check, Bookmark, Menu } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstagramVideoGrid } from "@/components/ui/instagram-video-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { useAuth } from "@/contexts/auth-context";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { CollectionBadgeMenu } from "./_components/collection-badge-menu";
import { badgeVariants } from "./_components/collections-animations";
import { type VideoWithPlayer, createVideoSelectionHandlers } from "./_components/collections-helpers";
import { CollectionsTabNav } from "./_components/collections-tab-nav";
import { CreateCollectionDialog } from "./_components/create-collection-dialog";
import { FabAction } from "./_components/fab-action";
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

// Optimized collection badge with smooth transitions
const CollectionBadge = memo(
  ({
    collection,
    isActive,
    onClick,
    videoCount,
    isTransitioning,
  }: {
    collection?: Collection;
    isActive: boolean;
    onClick: () => void;
    videoCount: number;
    isTransitioning: boolean;
  }) => {
    const { user } = useAuth();

    return (
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
          className={`focus-visible:ring-ring flex cursor-pointer items-center gap-1 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isActive
              ? "bg-secondary text-foreground hover:bg-secondary/80 border-border/60 font-semibold shadow-sm"
              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/40 bg-transparent font-normal"
          } ${isTransitioning && isActive ? "opacity-75" : ""} ${
            isTransitioning ? "pointer-events-none" : ""
          } min-h-[36px] rounded-md border-0 px-4 py-2.5 text-sm shadow-xs hover:shadow-sm`}
          onClick={isTransitioning ? undefined : onClick}
        >
          {collection?.favorite && <Bookmark className="mr-1 h-4 w-4 text-yellow-400" />}
          {collection
            ? `${collection.title.length > 30 ? collection.title.slice(0, 27) + "…" : collection.title} (${collection.videoCount})`
            : `All Videos (${videoCount})`}
        </Badge>
      </motion.div>
    );
  },
);

CollectionBadge.displayName = "CollectionBadge";

function InlineEditableField({
  value,
  onSave,
  isOwner,
  type = "input",
  label,
  maxLength,
  className = "",
  placeholder,
}: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  isOwner: boolean;
  type?: "input" | "textarea";
  label: string;
  maxLength: number;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSave = async () => {
    if (inputValue.trim() === value.trim()) {
      setEditing(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave(inputValue.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      setEditing(false);
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = () => {
    if (editing) handleSave();
  };

  const isEmpty = !value || value.trim() === "";

  if (!isOwner) {
    return (
      <span className={className}>{isEmpty ? (placeholder ?? "This is the place to add your videos.") : value}</span>
    );
  }

  return (
    <span className={`group relative ${className}`}>
      {editing ? (
        <>
          {type === "input" ? (
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              maxLength={maxLength}
              autoFocus
              disabled={loading}
              className="pr-10"
            />
          ) : (
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleBlur}
              maxLength={maxLength}
              autoFocus
              disabled={loading}
              className="min-h-[80px] pr-10"
              rows={3}
            />
          )}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1 right-1 z-10"
            onClick={handleSave}
            disabled={loading}
            tabIndex={-1}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
          </Button>
        </>
      ) : (
        <span
          className={`group-hover:bg-accent/30 inline-flex cursor-pointer items-center gap-1 rounded px-1 transition`}
          onClick={() => setEditing(true)}
        >
          <span className={isEmpty ? "text-muted-foreground italic" : undefined}>
            {isEmpty ? (placeholder ?? "This is the place to add your videos.") : value}
          </span>
          <Edit3
            className={"text-muted-foreground ml-1 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"}
          />
          {saved && <Check className="ml-1 h-4 w-4 text-green-600" />}
        </span>
      )}
      {error && <span className="text-destructive mt-1 block text-xs">{error}</span>}
    </span>
  );
}

// Main collections page component - simplified and optimized
function CollectionsPageContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  // Lightbox modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDocRef, setLastDocRef] = useState<any>(null);

  // Dialog refs for programmatic triggering
  const createCollectionDialogRef = useRef<HTMLButtonElement>(null);
  const addVideoDialogRef = useRef<HTMLButtonElement>(null);

  // Sentinel ref for infinite scrolling in Instagram grid
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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

      // Handle favorites tab
      if (collectionId === "favorites") {
        // Filter videos to show only favorited ones
        const favoritedVideos = videos.filter((video) => video.favorite);
        setVideos(favoritedVideos);
        return;
      }

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
    [router, isTransitioning, getCachedVideos, loadData, videos],
  );

  // Thumbnail click handler for new grid
  const handleThumbnailClick = useCallback((_video: unknown, index: number) => {
    setCurrentVideoIndex(index);
    setLightboxOpen(true);
  }, []);

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

  // Collection validation effect - moved out of render to prevent infinite loops
  useEffect(() => {
    if (selectedCollectionId && collections.length > 0) {
      const collectionExists = collections.some((c) => c.id === selectedCollectionId);
      if (!collectionExists && selectedCollectionId !== "all-videos") {
        console.warn("⚠️ [Collections] Collection not found, redirecting to all videos:", selectedCollectionId);
        // Clear cache for clean refresh
        cacheRef.current.data.clear();
        // Redirect to all videos without the invalid collection parameter
        startTransition(() => {
          router.push("/research/collections", { scroll: false });
        });
      }
    }
  }, [selectedCollectionId, collections, router]);

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
    if (!user) return;

    // Clear cache and force fresh data fetch
    cacheRef.current.data.clear();

    console.log("🔄 [Collections] Refreshing collections after video/collection added");

    try {
      // Force fresh fetch of both collections and videos
      const [collectionsResult, videosResult] = await Promise.allSettled([
        CollectionsRBACService.getUserCollections(user.uid),
        CollectionsRBACService.getCollectionVideos(user.uid, selectedCollectionId ?? undefined, 24),
      ]);

      if (collectionsResult.status === "fulfilled") {
        setCollections(collectionsResult.value);
        console.log("✅ [Collections] Collections refreshed:", collectionsResult.value.length);
      } else {
        console.error("Error refreshing collections:", collectionsResult.reason);
      }

      if (videosResult.status === "fulfilled") {
        const { videos, lastDoc } = videosResult.value;
        const optimizedVideos = videos.map((video) => ({
          ...video,
          isPlaying: false,
        }));
        setVideos(optimizedVideos);
        setCachedVideos(selectedCollectionId, optimizedVideos);
        setHasMoreVideos(optimizedVideos.length === 24);
        setLastDocRef(lastDoc);
        console.log("✅ [Collections] Videos refreshed:", optimizedVideos.length);
      } else {
        console.error("Error refreshing videos:", videosResult.reason);
      }
    } catch (error) {
      console.error("❌ [Collections] Error refreshing data:", error);
    }
  }, [user, selectedCollectionId, setCachedVideos]);

  const handleCollectionUpdated = useCallback(async () => {
    // Clear cache and reload collections and videos
    cacheRef.current.data.clear();
    await loadData();
  }, [loadData]);

  const handleCollectionDeleted = useCallback(async () => {
    if (!user) return;

    try {
      // If we're viewing the deleted collection, redirect to all videos
      if (selectedCollectionId) {
        startTransition(() => {
          router.push("/research/collections", { scroll: false });
        });
      }

      // Clear cache and reload data
      cacheRef.current.data.clear();
      setIsLoading(true);
    } catch (error) {
      console.error("Error handling collection deletion:", error);
    }
  }, [user, selectedCollectionId, router]);

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

  // IntersectionObserver for load more when not in manage mode
  useEffect(() => {
    if (manageMode) return; // disable in manage mode
    if (!hasMoreVideos) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      },
    );

    const node = loadMoreRef.current;
    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
    };
  }, [manageMode, hasMoreVideos, handleLoadMore]);

  const selectedCollection = useMemo(() => {
    if (!selectedCollectionId) return null;
    return collections.find((c) => c.id === selectedCollectionId) ?? null;
  }, [selectedCollectionId, collections]);
  const isOwner = Boolean(user && selectedCollection && selectedCollection.userId === user?.uid);

  // FAB handlers
  const handleAddCollection = useCallback(() => {
    console.log("🎯 [FAB] Add Collection clicked");
    createCollectionDialogRef.current?.click();
  }, []);

  const handleAddVideo = useCallback(() => {
    console.log("🎯 [FAB] Add Video clicked");
    addVideoDialogRef.current?.click();
  }, []);

  // Video favoriting handler
  const handleVideoFavorite = useCallback(
    async (video: any, index: number) => {
      if (!user || !video.id) return;

      try {
        // Toggle favorite state
        const newFavoriteState = !video.favorite;

        // Update video in state optimistically
        setVideos((prev) => prev.map((v, i) => (i === index ? { ...v, favorite: newFavoriteState } : v)));

        await fetch(`/api/video/${video.id}/favorite`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", authorization: `Bearer ${await user.getIdToken()}` },
          body: JSON.stringify({ favorite: newFavoriteState }),
        });

        toast.success(newFavoriteState ? "Video added to favorites" : "Video removed from favorites");
      } catch (error) {
        console.error("Error toggling video favorite:", error);
        // Revert optimistic update on error
        setVideos((prev) => prev.map((v, i) => (i === index ? { ...v, favorite: !video.favorite } : v)));
        toast.error("Failed to update favorite status");
      }
    },
    [user],
  );

  // Filter, search, and sort videos
  const filteredVideos = useMemo(() => {
    const result = [...videos];
    // Filter
    // Search
    // Sort
    return result;
  }, [videos]);

  // Don't show anything until collections are loaded
  if (isLoading) {
    return (
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center space-y-6 p-4 md:p-6">
        {/* Header skeleton */}
        <div className="flex-1">
          <header className="mb-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 text-center">
                <div className="mb-2 flex items-center justify-center gap-3">
                  <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="mx-auto h-4 w-96" />
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <Skeleton className="h-11 w-11" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </header>

          {/* Tab navigation skeleton */}
          <div className="mb-6 flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>

          {/* Video grid skeleton */}
          <main className="flex-1">
            <div className="mx-auto w-[935px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-3 w-8" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col items-center space-y-6 p-4 md:p-6">
      {/* Left side: Main content (Video Grid) */}
      <div className="flex-1">
        <header className="mb-2 space-y-4">
          {/* Primary Content Area */}
          <div className="flex items-start justify-between gap-4">
            {/* Title and Description */}
            <div className="min-w-0 flex-1 text-center">
              <div className="mb-2 flex items-center justify-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {selectedCollection ? (
                    <InlineEditableField
                      value={selectedCollection.title}
                      onSave={async (newTitle) => {
                        if (!user) return;
                        await CollectionsService.updateCollection(user.uid, selectedCollection.id!, {
                          title: newTitle,
                        });
                        toast.success("Collection name updated");
                        handleCollectionUpdated();
                      }}
                      isOwner={isOwner}
                      type="input"
                      label="Collection Name"
                      maxLength={60}
                      className="inline-block max-w-[240px] truncate"
                    />
                  ) : (
                    pageTitle
                  )}
                </h1>
                {selectedCollection && (
                  <div className="flex items-center gap-2">
                    <CollectionBadgeMenu
                      collection={selectedCollection}
                      onCollectionDeleted={handleCollectionDeleted}
                      onCollectionUpdated={handleCollectionUpdated}
                      className="transition-opacity duration-200"
                    />
                  </div>
                )}
              </div>
              <p
                className="text-muted-foreground mx-auto line-clamp-2 min-h-[48px] max-w-[500px] overflow-hidden"
                title={selectedCollection ? (selectedCollection.description ?? "") : pageDescription}
              >
                {selectedCollection ? (
                  <InlineEditableField
                    value={selectedCollection.description}
                    onSave={async (newDesc) => {
                      if (!user) return;
                      await CollectionsService.updateCollection(user.uid, selectedCollection.id!, {
                        description: newDesc,
                      });
                      toast.success("Collection description updated");
                      handleCollectionUpdated();
                    }}
                    isOwner={isOwner}
                    type="textarea"
                    label="Collection Description"
                    maxLength={500}
                    className="line-clamp-2 block min-h-[48px] max-w-[500px] overflow-hidden"
                    placeholder="This is the place to add your videos."
                  />
                ) : (
                  pageDescription
                )}
              </p>
            </div>

            {/* Action Buttons - Right Side */}
            <div className="flex flex-shrink-0 items-center gap-2">
              {/* Favorite Button - Larger touch target */}
              <Button
                variant="ghost"
                size="icon"
                disabled={!selectedCollection}
                onClick={async () => {
                  if (!user || !selectedCollection?.id) return;
                  await CollectionsService.setFavorite(user.uid, selectedCollection.id, !selectedCollection.favorite);
                  handleCollectionUpdated();
                }}
                className={`h-11 w-11 transition-colors ${
                  selectedCollection?.favorite
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-muted-foreground hover:text-foreground"
                } ${!selectedCollection ? "pointer-events-none opacity-0" : ""}`}
                aria-label={selectedCollection?.favorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Bookmark className={`h-5 w-5 ${selectedCollection?.favorite ? "fill-current" : ""}`} />
              </Button>

              {/* Admin Controls */}
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
          </div>
        </header>

        {/* Collections Tab Navigation */}
        {(() => {
          const favoriteVideosCount = videos.filter((v) => v.favorite).length;
          return (
            <CollectionsTabNav
              collections={collections}
              activeId={selectedCollectionId}
              onSelect={handleCollectionChange}
              allVideosCount={videos.length}
              favoriteVideosCount={favoriteVideosCount}
            />
          );
        })()}

        <main className="flex-1">
          {!manageMode ? (
            <div className="mx-auto w-[935px]">
              <InstagramVideoGrid
                videos={videos}
                onVideoClick={handleThumbnailClick}
                onFavorite={handleVideoFavorite}
                renderBadge={(video, idx) =>
                  (video as any).addedAt &&
                  Date.now() - new Date((video as any).addedAt).getTime() < 1000 * 60 * 60 * 24 ? (
                    <Badge className="ml-2 bg-green-500 text-white">New</Badge>
                  ) : null
                }
              />
              {/* Sentinel */}
              <div ref={loadMoreRef} className="h-8 w-full" />
              {isLoadingMore && (
                <div className="text-muted-foreground flex items-center justify-center py-4 text-sm">Loading…</div>
              )}
            </div>
          ) : (
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
          )}
        </main>
      </div>

      {/* Sidebar */}
      {/* Lightbox Modal */}
      <VideoLightbox
        videos={videos}
        currentIndex={currentVideoIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChangeIndex={setCurrentVideoIndex}
      />

      {/* FAB and Dialogs */}
      <FabAction onAddCollection={handleAddCollection} onAddVideo={handleAddVideo} />

      <CreateCollectionDialog onCollectionCreated={handleCollectionUpdated}>
        <button ref={createCollectionDialogRef} style={{ display: "none" }} />
      </CreateCollectionDialog>

      <AddVideoDialog
        collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
        onVideoAdded={handleVideoAdded}
      >
        <button ref={addVideoDialogRef} style={{ display: "none" }} />
      </AddVideoDialog>
    </div>
  );
}

// Main export
export default function CollectionsPage() {
  return <CollectionsPageContent />;
}
