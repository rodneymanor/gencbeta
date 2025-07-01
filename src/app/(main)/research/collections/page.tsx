/* eslint-disable max-lines */
"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, useRef, memo } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { CollectionBadgeMenu } from "./_components/collection-badge-menu";
import { badgeVariants } from "./_components/collections-animations";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./_components/collections-helpers";
import { LoadingSkeleton } from "./_components/loading-skeleton";
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
  }: {
    collection?: Collection;
    isActive: boolean;
    onClick: () => void;
    videoCount: number;
    isTransitioning: boolean;
    onCollectionDeleted: () => void;
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

  // Simplified cache
  const cacheRef = useRef<SimpleCache>({ data: new Map() });

  const previousCollectionRef = useRef<string | null>(null);

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");

  // Stable references with useCallback to prevent unnecessary re-renders
  const { toggleVideoSelection, selectAllVideos, clearSelection } = useMemo(
    () => createVideoSelectionHandlers(setSelectedVideos, videos),
    [videos],
  );

  // Memoized computed values
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);
  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  // Cache utilities
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
          CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined),
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

  // Video management functions
  const handleVideoAdded = useCallback(async () => {
    // Clear cache and reload
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

  // Show loading only for initial load
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="@container/main">
      <div className="mx-auto max-w-7xl space-y-8 md:space-y-10">
        {/* Header Section - Simplified animations */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground text-lg">{pageDescription}</p>
            </div>
            <div className="flex items-center gap-2">
              <ManageModeHeader
                manageMode={manageMode}
                selectedVideos={selectedVideos}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onManageModeToggle={() => userProfile?.role !== "creator" && setManageMode(true)}
                onExitManageMode={handleExitManageMode}
                onBulkDelete={handleBulkDelete}
                onClearSelection={clearSelection}
                onSelectAll={selectAllVideos}
                onVideoAdded={handleVideoAdded}
              />
            </div>
          </div>
        </section>

        {/* Collection Filter Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <CollectionBadge
              isActive={!selectedCollectionId}
              onClick={() => handleCollectionChange(null)}
              videoCount={videos.length}
              isTransitioning={isTransitioning && !selectedCollectionId}
              onCollectionDeleted={handleCollectionDeleted}
            />
            <AnimatePresence mode="popLayout">
              {collections.map((collection) => (
                <CollectionBadge
                  key={collection.id}
                  collection={collection}
                  isActive={selectedCollectionId === collection.id}
                  onClick={() => handleCollectionChange(collection.id!)}
                  videoCount={collection.videoCount || 0}
                  isTransitioning={isTransitioning && selectedCollectionId === collection.id}
                  onCollectionDeleted={handleCollectionDeleted}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Transition indicator */}
          {isTransitioning && (
            <div className="flex items-center justify-center py-4">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                Loading collection...
              </div>
            </div>
          )}
        </section>

        {/* Videos Content Section */}
        <VideoGrid
          videos={videos}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          loadingVideos={isTransitioning}
          isPending={isPending}
          manageMode={manageMode}
          selectedVideos={selectedVideos}
          deletingVideos={deletingVideos}
          onToggleVideoSelection={toggleVideoSelection}
          onDeleteVideo={handleDeleteVideo}
          onVideoAdded={handleVideoAdded}
        />
      </div>
    </div>
  );
}

// Main export
export default function CollectionsPage() {
  return <CollectionsPageContent />;
}
