"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, useRef, memo } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

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

// Memoized badge component to prevent unnecessary re-renders
const CollectionBadge = memo(
  ({
    collection,
    isActive,
    onClick,
    videoCount,
  }: {
    collection?: Collection;
    isActive: boolean;
    onClick: () => void;
    videoCount: number;
  }) => (
    <motion.div
      variants={badgeVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      layout
    >
      <Badge
        variant="outline"
        className={`focus-visible:ring-ring cursor-pointer rounded-full border-0 px-4 py-2 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isActive
            ? "bg-secondary text-foreground hover:bg-secondary/80 font-semibold"
            : "text-muted-foreground hover:bg-secondary/50 bg-transparent font-normal"
        }`}
        onClick={onClick}
      >
        {collection ? `${collection.title} (${collection.videoCount})` : `All Videos (${videoCount})`}
      </Badge>
    </motion.div>
  ),
);

CollectionBadge.displayName = "CollectionBadge";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  // Refs for performance optimization
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
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

  // Memoized computed values with dependency optimization
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);

  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  // Optimized collection navigation with debouncing
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      // Prevent unnecessary navigation if same collection
      if (collectionId === previousCollectionRef.current) return;

      previousCollectionRef.current = collectionId;

      // Use startTransition for smooth navigation
      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path);
      });
    },
    [router],
  );

  // Optimized data loading with better error handling
  const loadCollections = useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await CollectionsRBACService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
      // Could add toast notification here
    }
  }, [user]);

  const loadVideos = useCallback(async () => {
    if (!user) return;

    // Clear previous timeout to prevent race conditions
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setLoadingVideos(true);

    try {
      const collectionVideos = await CollectionsRBACService.getCollectionVideos(
        user.uid,
        selectedCollectionId ?? undefined,
      );

      // Optimize video object creation
      const optimizedVideos = collectionVideos.map((video) => ({
        ...video,
        isPlaying: false,
      }));

      setVideos(optimizedVideos);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      // Delayed loading state update for smoother transitions
      loadingTimeoutRef.current = setTimeout(() => {
        setLoadingVideos(false);
      }, 100);
    }
  }, [user, selectedCollectionId]);

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

      setLoading(true);

      try {
        // Load collections and videos in parallel for better performance
        await Promise.all([loadCollections(), loadVideos()]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, selectedCollectionId, loadCollections, loadVideos]);

  // Optimized video management functions
  const handleVideoAdded = useCallback(() => {
    // Refresh data after video is added
    loadCollections();
    loadVideos();
  }, [loadCollections, loadVideos]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;

      setDeletingVideos((prev) => new Set([...prev, videoId]));

      try {
        await CollectionsService.deleteVideo(user.uid, videoId);

        // Optimistic update for better UX
        setVideos((prev) => prev.filter((video) => video.id !== videoId));
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting video:", error);

        // Revert optimistic update on error
        await loadVideos();
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [user, loadVideos],
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
      setVideos((prev) => prev.filter((video) => !videoIds.includes(video.id!)));
      setSelectedVideos(new Set());
      setDeletingVideos(new Set());
    } catch (error) {
      console.error("Error deleting videos:", error);

      // Revert on error
      await loadVideos();
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        videoIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  }, [user, selectedVideos, loadVideos]);

  const handleExitManageMode = useCallback(() => {
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  if (loading) {
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
              />
            </motion.div>
          </div>
        </motion.section>

        {/* Collection Filter Section - Optimized with layout animations */}
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
            />
            <AnimatePresence mode="popLayout">
              {collections.map((collection) => (
                <CollectionBadge
                  key={collection.id}
                  collection={collection}
                  isActive={selectedCollectionId === collection.id}
                  onClick={() => handleCollectionChange(collection.id!)}
                  videoCount={collection.videoCount || 0}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Videos Content Section - Optimized grid rendering */}
        <VideoGrid
          videos={videos}
          collections={collections}
          selectedCollectionId={selectedCollectionId}
          loadingVideos={loadingVideos}
          isPending={isPending}
          manageMode={manageMode}
          selectedVideos={selectedVideos}
          deletingVideos={deletingVideos}
          onToggleVideoSelection={toggleVideoSelection}
          onDeleteVideo={handleDeleteVideo}
          onVideoAdded={handleVideoAdded}
        />
      </div>
    </motion.div>
  );
}
