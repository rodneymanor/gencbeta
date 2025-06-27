"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

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

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");

  // Create selection handlers
  const { toggleVideoSelection, selectAllVideos, clearSelection } = createVideoSelectionHandlers(
    setSelectedVideos,
    videos,
  );

  // Memoize computed values for performance
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);
  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  // Optimized collection navigation with smooth transitions
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path);
      });
    },
    [router],
  );

  // Role-based access control
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (userProfile && userProfile.role === "creator") {
      return; // Creators can view collections
    }

    if (userProfile && userProfile.role !== "coach" && userProfile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, userProfile, router]);

  const loadCollections = useCallback(async () => {
    if (!user) return;
    try {
      const userCollections = await CollectionsRBACService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, [user]);

  const loadVideos = useCallback(async () => {
    if (!user) return;
    setLoadingVideos(true);
    try {
      const collectionVideos = await CollectionsRBACService.getCollectionVideos(
        user.uid,
        selectedCollectionId ?? undefined,
      );
      setVideos(collectionVideos.map((video) => ({ ...video, isPlaying: false })));
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [user, selectedCollectionId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadCollections(), loadVideos()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, selectedCollectionId, loadCollections, loadVideos]);

  const handleVideoAdded = useCallback(() => {
    loadCollections();
    loadVideos();
  }, [loadCollections, loadVideos]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;
      setDeletingVideos((prev) => new Set([...prev, videoId]));

      try {
        await CollectionsService.deleteVideo(user.uid, videoId);
        // Optimistic update - remove from state immediately for better UX
        setVideos((prev) => prev.filter((video) => video.id !== videoId));
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting video:", error);
        // Revert optimistic update on error
        loadVideos();
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
      await Promise.all(videoIds.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));
      // Optimistic update
      setVideos((prev) => prev.filter((video) => !videoIds.includes(video.id!)));
      setSelectedVideos(new Set());
      setDeletingVideos(new Set());
    } catch (error) {
      console.error("Error deleting videos:", error);
      // Revert on error
      loadVideos();
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
    <div className="@container/main">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:space-y-10 md:p-6">
        {/* Header Section */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
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

        {/* Collection Filter Section */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <motion.div
              variants={badgeVariants}
              initial="inactive"
              animate={!selectedCollectionId ? "active" : "inactive"}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
            >
              <Badge
                variant={!selectedCollectionId ? "default" : "secondary"}
                className={`cursor-pointer transition-all duration-200 ${
                  !selectedCollectionId
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-secondary/50 hover:bg-secondary/80"
                }`}
                onClick={() => handleCollectionChange(null)}
              >
                All Videos ({videos.length})
              </Badge>
            </motion.div>
            <AnimatePresence mode="popLayout">
              {collections.map((collection) => (
                <motion.div
                  key={collection.id}
                  variants={badgeVariants}
                  initial="inactive"
                  animate={selectedCollectionId === collection.id ? "active" : "inactive"}
                  whileHover="hover"
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <Badge
                    variant={selectedCollectionId === collection.id ? "default" : "secondary"}
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedCollectionId === collection.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                        : "bg-secondary/50 hover:bg-secondary/80"
                    }`}
                    onClick={() => handleCollectionChange(collection.id!)}
                  >
                    {collection.title} ({collection.videoCount})
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Videos Content Section */}
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
    </div>
  );
}
