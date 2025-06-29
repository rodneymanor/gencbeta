/* eslint-disable max-lines */
"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
  useRef,
  memo,
  createContext,
  useContext,
} from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { CollectionBadgeMenu } from "./_components/collection-badge-menu";
import { badgeVariants, optimizedAnimations } from "./_components/collections-animations";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./_components/collections-helpers";
import { LoadingSkeleton } from "./_components/loading-skeleton";
import { ManageModeHeader } from "./_components/manage-mode-header";
import { VideoGrid } from "./_components/video-grid";

// Collection state persistence context
interface CollectionCache {
  videos: Map<string, VideoWithPlayer[]>;
  collections: Collection[];
  lastUpdated: Map<string, number>;
}

const CollectionStateContext = createContext<{
  cache: CollectionCache;
  cacheVideos:(collectionId: string | null, videos: VideoWithPlayer[]) => void;
  getCachedVideos: (collectionId: string | null) => VideoWithPlayer[];
  isCacheValid: (collectionId: string | null) => boolean;
  hasCacheEntry: (collectionId: string | null) => boolean;
  invalidateCache: (collectionId?: string | null) => void;
} | null>(null);

// Cache provider component
const CollectionStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [cache, setCache] = useState<CollectionCache>({
    videos: new Map(),
    collections: [],
    lastUpdated: new Map(),
  });

  const cacheVideos = useCallback((collectionId: string | null, videos: VideoWithPlayer[]) => {
    setCache((prev) => {
      const newVideos = new Map(prev.videos);
      const newLastUpdated = new Map(prev.lastUpdated);
      const key = collectionId ?? "all";

      newVideos.set(key, videos);
      newLastUpdated.set(key, Date.now());

      return {
        ...prev,
        videos: newVideos,
        lastUpdated: newLastUpdated,
      };
    });
  }, []);

  const getCachedVideos = useCallback(
    (collectionId: string | null) => {
      const key = collectionId ?? "all";
      return cache.videos.get(key) ?? [];
    },
    [cache.videos],
  );

  const isCacheValid = useCallback(
    (collectionId: string | null) => {
      const key = collectionId ?? "all";
      const lastUpdated = cache.lastUpdated.get(key);
      if (!lastUpdated) return false;

      // Cache valid for 30 seconds
      return Date.now() - lastUpdated < 30000;
    },
    [cache.lastUpdated],
  );

  const hasCacheEntry = useCallback(
    (collectionId: string | null) => {
      const key = collectionId ?? "all";
      return cache.videos.has(key);
    },
    [cache.videos],
  );

  const invalidateCache = useCallback((collectionId?: string | null) => {
    setCache((prev) => {
      if (collectionId !== undefined) {
        const key = collectionId ?? "all";
        const newVideos = new Map(prev.videos);
        const newLastUpdated = new Map(prev.lastUpdated);
        newVideos.delete(key);
        newLastUpdated.delete(key);
        return {
          ...prev,
          videos: newVideos,
          lastUpdated: newLastUpdated,
        };
      } else {
        // Clear all cache
        return {
          videos: new Map(),
          collections: [],
          lastUpdated: new Map(),
        };
      }
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      cache,
      cacheVideos,
      getCachedVideos,
      isCacheValid,
      hasCacheEntry,
      invalidateCache,
    }),
    [cache, cacheVideos, getCachedVideos, isCacheValid, hasCacheEntry, invalidateCache],
  );

  return <CollectionStateContext.Provider value={contextValue}>{children}</CollectionStateContext.Provider>;
};

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
        className={`focus-visible:ring-ring cursor-pointer rounded-full border-0 px-4 py-2 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isActive
            ? "bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
            : "text-muted-foreground hover:bg-secondary/50 bg-transparent font-normal"
        } ${isTransitioning && isActive ? "opacity-75" : ""} ${isTransitioning ? "pointer-events-none" : ""}`}
        onClick={isTransitioning ? undefined : onClick}
      >
        {collection ? `${collection.title} (${collection.videoCount})` : `All Videos (${videoCount})`}
      </Badge>
      {collection && (
        <div className="absolute -top-1 -right-1">
          <CollectionBadgeMenu
            collection={collection}
            onCollectionDeleted={onCollectionDeleted}
            className="bg-background border-border border shadow-sm"
          />
        </div>
      )}
    </motion.div>
  ),
);

CollectionBadge.displayName = "CollectionBadge";

/*
 * NOTE: File exceeds 300 line limit due to comprehensive collection optimization system.
 * Consider splitting into separate files: CollectionStateProvider, DelayedFallback,
 * CollectionBadge, and main page component in future refactoring.
 */

// Main collections page component
function CollectionsPageContent() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Refs for performance optimization
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const previousCollectionRef = useRef<string | null>(null);
  const preloadTimeoutRef = useRef<NodeJS.Timeout>();

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");

  // Collection state context
  const collectionState = useContext(CollectionStateContext);
  if (!collectionState) {
    throw new Error("CollectionsPageContent must be wrapped in CollectionStateProvider");
  }
  const { cacheVideos, getCachedVideos, isCacheValid, hasCacheEntry, invalidateCache } = collectionState;

  // Stable references with useCallback to prevent unnecessary re-renders
  const { toggleVideoSelection, selectAllVideos, clearSelection } = useMemo(
    () => createVideoSelectionHandlers(setSelectedVideos, videos),
    [videos],
  );

  // Memoized computed values with dependency optimization
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);

  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  // Optimized collection navigation with smooth transitions
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      // Prevent unnecessary navigation if same collection
      if (collectionId === previousCollectionRef.current || isTransitioning) return;

      previousCollectionRef.current = collectionId;

      // Immediately show cached data if available and valid (including empty arrays)
      if (hasCacheEntry(collectionId) && isCacheValid(collectionId)) {
        const cachedVideos = getCachedVideos(collectionId);
        setVideos(cachedVideos);
        setIsTransitioning(false);
      } else {
        setIsTransitioning(true);
      }

      // Use startTransition for smooth navigation
      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path, { scroll: false });
      });

      // Load fresh data in background if cache is invalid or missing
      if (!isCacheValid(collectionId)) {
        loadVideos(collectionId);
      }
    },
    [router, isTransitioning, getCachedVideos, isCacheValid, hasCacheEntry],
  );

  // Optimized data loading with better error handling and caching
  const loadCollections = useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await CollectionsRBACService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, [user]);

  const loadVideos = useCallback(
    async (targetCollectionId?: string | null) => {
      if (!user) return;

      const collectionId = targetCollectionId !== undefined ? targetCollectionId : selectedCollectionId;

      // Clear previous timeout to prevent race conditions
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      // Show loading only for initial load when no cache exists
      if (isInitialLoad && !hasCacheEntry(collectionId)) {
        setLoadingVideos(true);
      }

      try {
        const collectionVideos = await CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined);

        // Optimize video object creation
        const optimizedVideos = collectionVideos.map((video) => ({
          ...video,
          isPlaying: false,
        }));

        // Cache the videos (including empty arrays)
        cacheVideos(collectionId, optimizedVideos);

        // Update state
        setVideos(optimizedVideos);
      } catch (error) {
        console.error("Error loading videos:", error);
      } finally {
        // Delayed loading state update for smoother transitions
        loadingTimeoutRef.current = setTimeout(() => {
          if (isInitialLoad) {
            setLoadingVideos(false);
            setIsInitialLoad(false);
          }
          setIsTransitioning(false);
        }, 50);
      }
    },
    [user, selectedCollectionId, isInitialLoad, hasCacheEntry, cacheVideos],
  );

  // Preload adjacent collections for instant switching
  const preloadAdjacentCollections = useCallback(async () => {
    if (!user || collections.length === 0) return;

    const currentIndex = collections.findIndex((c) => c.id === selectedCollectionId);
    const adjacentCollections = [
      collections[currentIndex - 1],
      collections[currentIndex + 1],
      collections[0], // Always preload "All Videos"
    ].filter(Boolean);

    for (const collection of adjacentCollections) {
      if (!isCacheValid(collection.id ?? null)) {
        try {
          const videos = await CollectionsRBACService.getCollectionVideos(user.uid, collection.id);
          const optimizedVideos = videos.map((video) => ({
            ...video,
            isPlaying: false,
          }));
          cacheVideos(collection.id ?? null, optimizedVideos);
        } catch (error) {
          console.error("Error preloading collection:", collection.id, error);
        }
      }
    }

    // Also preload "All Videos" if not cached
    if (!isCacheValid(null)) {
      try {
        const allVideos = await CollectionsRBACService.getCollectionVideos(user.uid);
        const optimizedVideos = allVideos.map((video) => ({
          ...video,
          isPlaying: false,
        }));
        cacheVideos(null, optimizedVideos);
      } catch (error) {
        console.error("Error preloading all videos:", error);
      }
    }
  }, [user, collections, selectedCollectionId, isCacheValid, cacheVideos]);

  // Role-based access control with better error handling
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (!userProfile) return; // Wait for profile to load

    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      router.push("/dashboard");
      return;
    }
  }, [user, userProfile, router]);

  // Optimized data loading effect
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!user) return;

      setLoadingVideos(true);

      try {
        // Load collections and videos in parallel for better performance
        await Promise.all([loadCollections(), loadVideos()]);
      } finally {
        if (isMounted) {
          setLoadingVideos(false);
        }
      }
    };

    if (isInitialLoad) {
      loadData();
    }

    return () => {
      isMounted = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, isInitialLoad, loadCollections, loadVideos]);

  // Preload adjacent collections with debouncing
  useEffect(() => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    preloadTimeoutRef.current = setTimeout(() => {
      preloadAdjacentCollections();
    }, 500);

    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [selectedCollectionId, collections, preloadAdjacentCollections]);

  // Optimized video management functions with cache invalidation
  const handleVideoAdded = useCallback(async () => {
    try {
      const freshCollections = await CollectionsService.getUserCollections(user!.uid);
      setCollections(freshCollections);

      // Invalidate all video caches to force refresh
      invalidateCache(null);

      // Force reload videos for current collection
      await loadVideos();
    } catch (error) {
      console.error("Error refreshing after video added:", error);
    }
  }, [user, invalidateCache, loadVideos]);

  // Handle collection deletion with optimistic updates
  const handleCollectionDeleted = useCallback(async () => {
    if (!user) return;

    try {
      // Optimistic update - remove from UI immediately
      if (selectedCollectionId) {
        // If deleting current collection, navigate to "All Videos"
        startTransition(() => {
          router.push("/research/collections");
        });
      }

      // Refresh collections list
      const freshCollections = await CollectionsService.getUserCollections(user.uid);
      setCollections(freshCollections);

      // Invalidate all caches since collection structure changed
      invalidateCache(null);

      // Force reload videos for current view
      await loadVideos();

      // If we're on a deleted collection page, videos will be empty
      // which is correct behavior
    } catch (error) {
      console.error("Error refreshing after collection deleted:", error);
      // On error, still try to refresh the data
      invalidateCache(null);
      await loadVideos();
    }
  }, [user, selectedCollectionId, router, invalidateCache, loadVideos]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;

      setDeletingVideos((prev) => new Set([...prev, videoId]));

      try {
        await CollectionsService.deleteVideo(user.uid, videoId);

        // Optimistic update for better UX
        setVideos((prev) => {
          const newVideos = prev.filter((video) => video.id !== videoId);
          // Update cache with optimistic data
          cacheVideos(selectedCollectionId, newVideos);
          return newVideos;
        });

        // Invalidate all caches to ensure consistency
        invalidateCache(null);

        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting video:", error);

        // Revert optimistic update on error
        invalidateCache(selectedCollectionId);
        await loadVideos();
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [user, selectedCollectionId, cacheVideos, invalidateCache, loadVideos],
  );

  const handleBulkDelete = useCallback(async () => {
    if (!user || selectedVideos.size === 0) return;

    const videoIds = Array.from(selectedVideos);
    setDeletingVideos((prev) => new Set([...prev, ...videoIds]));

    try {
      // Process deletions in batches for better performance
      const batchSize = 5;
      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        await Promise.all(batch.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));
      }

      // Optimistic update
      setVideos((prev) => {
        const newVideos = prev.filter((video) => !videoIds.includes(video.id!));
        cacheVideos(selectedCollectionId, newVideos);
        return newVideos;
      });

      setSelectedVideos(new Set());
      setDeletingVideos(new Set());

      // Invalidate all caches
      invalidateCache(null);
    } catch (error) {
      console.error("Error deleting videos:", error);

      // Revert on error
      invalidateCache(selectedCollectionId);
      await loadVideos();
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        videoIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  }, [user, selectedVideos, selectedCollectionId, cacheVideos, invalidateCache, loadVideos]);

  const handleExitManageMode = useCallback(() => {
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  // Early return for initial loading state only
  if (isInitialLoad && loadingVideos) {
    return <LoadingSkeleton />;
  }

  return (
    <motion.div className="@container/main" {...optimizedAnimations.container}>
      <div className="mx-auto max-w-7xl space-y-8 md:space-y-10">
        {/* Header Section - Optimized animations */}
        <motion.section className="space-y-4" {...optimizedAnimations.header}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h1 className="text-foreground text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground text-lg">{pageDescription}</p>
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ManageModeHeader
                manageMode={manageMode}
                selectedVideos={selectedVideos}
                videosLength={videos.length}
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onManageModeToggle={() => userProfile?.role !== "creator" && setManageMode(true)}
                onExitManageMode={handleExitManageMode}
                onBulkDelete={handleBulkDelete}
                onClearSelection={clearSelection}
                onSelectAll={selectAllVideos}
                onVideoAdded={handleVideoAdded}
                onCollectionDeleted={handleCollectionDeleted}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Collection Filter Section - Optimized with smooth transitions */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
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

          {/* Smooth transition indicator */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                  Loading collection...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Videos Content Section - Optimized grid rendering with delayed fallback */}
        <DelayedFallback show={loadingVideos && isInitialLoad} delay={300}>
          <LoadingSkeleton />
        </DelayedFallback>

        {!loadingVideos || !isInitialLoad ? (
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
        ) : null}
      </div>
    </motion.div>
  );
}

// Wrapped component with state provider
export default function CollectionsPage() {
  return (
    <CollectionStateProvider>
      <CollectionsPageContent />
    </CollectionStateProvider>
  );
}
