"use client";

import { memo } from "react";
import { Plus } from "lucide-react";

import type { Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import type { VideoWithPlayer } from "./collections-helpers";
import { VideosLoadingSkeleton } from "./loading-skeleton";
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
    // Show loading state
    if (loadingVideos || isPending) {
      return <VideosLoadingSkeleton />;
    }

    // Empty state with improved styling
    if (videos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-16 h-16 bg-secondary/60 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">No videos yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
            {selectedCollectionId
              ? "This collection is empty. Add your first video to get started."
              : "Start building your video library by adding videos from TikTok or Instagram."}
          </p>
          <AddVideoDialog
            collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
            selectedCollectionId={selectedCollectionId ?? undefined}
            onVideoAdded={onVideoAdded}
          >
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Plus className="h-4 w-4" />
              Add Your First Video
            </button>
          </AddVideoDialog>
        </div>
      );
    }

    // Video grid with enhanced styling
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isManageMode={manageMode}
            isSelected={selectedVideos.has(video.id!)}
            isDeleting={deletingVideos.has(video.id!)}
            onToggleSelection={() => onToggleVideoSelection(video.id!)}
            onDelete={() => onDeleteVideo(video.id!)}
            className="shadow-sm hover:shadow-md transition-all duration-200 border-border/60 hover:border-border/80"
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
      prevProps.deletingVideos.size === nextProps.deletingVideos.size
    );
  },
);

VideoGrid.displayName = "VideoGrid";
