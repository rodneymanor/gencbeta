"use client";

import { memo, useState } from "react";

import { Plus } from "lucide-react";

import type { Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import type { VideoWithPlayer } from "./collections-helpers";
import { VideosLoadingSkeleton } from "./loading-skeleton";
import { processAndAddVideo } from "./simple-video-processing";
import { VideoCard } from "./video-card";

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

    // Show loading state
    if (loadingVideos || isPending) {
      return <VideosLoadingSkeleton />;
    }

    // Empty state with improved styling
    if (videos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center px-6 py-16">
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
        </div>
      );
    }

    // Video grid optimized for two-column layout
    return (
      <div className="grid grid-cols-3 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
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
        ))}
      </div>
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
