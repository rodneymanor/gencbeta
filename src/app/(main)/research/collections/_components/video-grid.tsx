"use client";

import { memo, useState, useCallback } from "react";

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
    const [reprocessingVideos, setReprocessingVideos] = useState<Set<string>>(new Set());
    const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);

    const handleReprocessVideo = async () => {
      // TODO: Re-implement video reprocessing. The required properties `url` and `collectionId` are missing from the `VideoWithPlayer` type in this version of the code.
      console.log("Reprocessing is currently disabled.");
    };

    // Handle video play - ensures only one video plays at a time
    const handleVideoPlay = useCallback((videoId: string) => {
      console.log("🎬 [VideoGrid] Playing video:", videoId);
      setCurrentPlayingVideo(videoId);

      // Stop all other videos by sending pause messages to their iframes
      videos.forEach((video) => {
        if (video.id !== videoId) {
          const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ command: 'pause' }, '*');
          }
        }
      });
    }, [videos]);

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

    // Video grid with enhanced styling and single video playback control
    return (
      <div className="space-y-6">
        {/* Playback Status */}
        {currentPlayingVideo && (
          <div className="flex items-center justify-center">
            <div className="bg-primary/10 border-primary/20 text-primary rounded-lg px-4 py-2 text-sm font-medium">
              🎬 Playing: {videos.find(v => v.id === currentPlayingVideo)?.title ?? 'Video'}
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex flex-wrap justify-start gap-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isManageMode={manageMode}
              isSelected={selectedVideos.has(video.id!)}
              isDeleting={deletingVideos.has(video.id!)}
              isReprocessing={reprocessingVideos.has(video.id!)}
              isPlaying={currentPlayingVideo === video.id}
              onToggleSelection={() => onToggleVideoSelection(video.id!)}
              onDelete={() => onDeleteVideo(video.id!)}
              onReprocess={handleReprocessVideo}
              onPlay={handleVideoPlay}
              className="border-border/60 hover:border-border/80 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          ))}
        </div>
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
