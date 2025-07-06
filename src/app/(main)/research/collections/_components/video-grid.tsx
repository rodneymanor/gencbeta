"use client";

import { memo, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

import type { Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import type { VideoWithPlayer } from "./collections-helpers";
import { VideosLoadingSkeleton } from "./loading-skeleton";
import { processAndAddVideo } from "./simple-video-processing";
import { VideoCard } from "./video-card";

// Animation variants for staggered video loading
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1 },
};

// VideoSkeleton with exact same dimensions as real video cards
export const VideoSkeleton = () => (
  <div className="border-border/60 bg-card space-y-3 rounded-lg border p-4 shadow-sm">
    <div className="bg-muted aspect-[9/16] animate-pulse rounded-md" />
    <div className="space-y-2">
      <div className="bg-muted h-4 animate-pulse rounded" />
      <div className="bg-muted/60 h-3 w-3/4 animate-pulse rounded" />
    </div>
    <div className="flex items-center gap-2">
      <div className="bg-muted h-6 w-12 animate-pulse rounded" />
      <div className="bg-muted h-6 w-16 animate-pulse rounded" />
    </div>
  </div>
);

interface VideoGridProps {
  videos: VideoWithPlayer[];
  collections: Collection[];
  selectedCollectionId: string | null;
  loadingVideos: boolean;
  isPending: boolean;
  manageMode: boolean;
  selectedVideos: Set<string>;
  deletingVideos: Set<string>;
  onToggleVideoSelection: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onVideoAdded: () => void;
}

export const VideoGrid = memo<VideoGridProps>(
  ({
    videos,
    collections,
    selectedCollectionId,
    loadingVideos,
    isPending,
    manageMode,
    selectedVideos,
    deletingVideos,
    onToggleVideoSelection,
    onDeleteVideo,
    onVideoAdded,
  }) => {
    const [reprocessingVideos, setReprocessingVideos] = useState<Set<string>>(new Set());

    const handleReprocessVideo = async (video: VideoWithPlayer) => {
      if (!video.url || !video.collectionId) {
        console.error("❌ [REPROCESS] Missing required fields:", { url: video.url, collectionId: video.collectionId });
        return;
      }

      setReprocessingVideos((prev) => new Set(prev).add(video.id!));

      try {
        console.log("🔄 [REPROCESS] Starting reprocess for video:", video.id);

        const result = await processAndAddVideo(video.url, video.collectionId, video.title);

        if (result.success) {
          console.log("✅ [REPROCESS] Video reprocessed successfully:", result);
          // Refresh the video list to show updated data
          onVideoAdded();
        } else {
          console.error("❌ [REPROCESS] Failed:", result.error);
          // TODO: Show error toast to user
        }
      } catch (error) {
        console.error("❌ [REPROCESS] Error:", error);
        // TODO: Show error toast to user
      } finally {
        setReprocessingVideos((prev) => {
          const next = new Set(prev);
          next.delete(video.id!);
          return next;
        });
      }
    };

    // Show loading state ONLY for initial page load
    if (isPending && videos.length === 0) {
      return <VideosLoadingSkeleton />;
    }

    // Empty state with improved styling
    if (videos.length === 0 && !loadingVideos) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center px-6 py-16"
        >
          <div className="bg-secondary/60 mb-6 flex h-16 w-16 items-center justify-center rounded-full shadow-sm">
            <Plus className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground mb-3 text-xl font-semibold">No videos yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md text-center leading-relaxed">
            {selectedCollectionId
              ? "This collection is empty. Add your first video to get started."
              : "Start building your video library by adding videos from TikTok or Instagram."}
          </p>
          <AddVideoDialog
            collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
            selectedCollectionId={selectedCollectionId ?? undefined}
            onVideoAdded={onVideoAdded}
          >
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex items-center gap-2 rounded-md px-6 py-3 font-medium shadow-sm transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2">
              <Plus className="h-4 w-4" />
              Add Your First Video
            </button>
          </AddVideoDialog>
        </motion.div>
      );
    }

    // Calculate skeleton count to maintain grid layout
    const targetGridSize = 12; // Minimum grid size
    const skeletonCount = Math.max(0, targetGridSize - videos.length);

    // Video grid with maintained dimensions during transitions
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-4"
        style={{ contentVisibility: "auto" }}
      >
        <AnimatePresence mode="popLayout">
          {/* Render existing videos */}
          {videos.map((video) => (
            <motion.div
              key={video.id}
              variants={itemVariants}
              layout
              layoutId={`video-${video.id}`}
              className="video-item"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <VideoCard
                video={video}
                isManageMode={manageMode}
                isSelected={selectedVideos.has(video.id!)}
                isDeleting={deletingVideos.has(video.id!)}
                isReprocessing={reprocessingVideos.has(video.id!)}
                onToggleSelection={() => onToggleVideoSelection(video.id!)}
                onDelete={() => onDeleteVideo(video.id!)}
                onReprocess={handleReprocessVideo}
                className="border-border/60 hover:border-border/80 shadow-sm transition-all duration-200 hover:shadow-md"
              />
            </motion.div>
          ))}

          {/* Render skeleton cards when loading to maintain grid size */}
          {loadingVideos &&
            skeletonCount > 0 &&
            [...Array(skeletonCount)].map((_, index) => (
              <motion.div
                key={`skeleton-${index}`}
                variants={itemVariants}
                className="video-item"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <VideoSkeleton />
              </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
    );
  },
  // Enhanced memo comparison
  (prevProps, nextProps) => {
    return (
      prevProps.videos.length === nextProps.videos.length &&
      prevProps.loadingVideos === nextProps.loadingVideos &&
      prevProps.isPending === nextProps.isPending &&
      prevProps.manageMode === nextProps.manageMode &&
      prevProps.selectedVideos.size === nextProps.selectedVideos.size &&
      prevProps.deletingVideos.size === nextProps.deletingVideos.size &&
      // Video IDs comparison for proper reprocessing state
      prevProps.videos.every((video, index) => video.id === nextProps.videos[index]?.id)
    );
  },
);

VideoGrid.displayName = "VideoGrid";
