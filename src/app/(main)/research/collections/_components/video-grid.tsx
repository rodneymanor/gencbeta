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

// OPTIMIZED: Simple video grid without heavy animations
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
      return (
        <section className="space-y-6">
          <VideosLoadingSkeleton />
        </section>
      );
    }

    // Show empty state
    if (videos.length === 0) {
      return (
        <section className="space-y-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/50 mb-6 rounded-full p-6">
              <Plus className="text-muted-foreground h-12 w-12" />
            </div>
            <div className="space-y-4">
              <h3 className="text-foreground text-xl font-semibold">No videos yet</h3>
              <p className="text-muted-foreground max-w-md">
                Add your first video to get started with content analysis and research
              </p>
              <div className="pt-4">
                <AddVideoDialog
                  collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
                  selectedCollectionId={selectedCollectionId ?? undefined}
                  onVideoAdded={onVideoAdded}
                />
              </div>
            </div>
          </div>
        </section>
      );
    }

    // SIMPLIFIED: Regular grid with CSS hover effects
    return (
      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((video) => (
            <div
              key={video.id}
              className="transform transition-transform duration-200 hover:-translate-y-1 hover:scale-105"
            >
              <VideoCard
                video={video}
                manageMode={manageMode}
                isSelected={selectedVideos.has(video.id!)}
                isDeleting={deletingVideos.has(video.id!)}
                onToggleSelection={() => onToggleVideoSelection(video.id!)}
                onDelete={() => onDeleteVideo(video.id!)}
              />
            </div>
          ))}
        </div>
      </section>
    );
  },
  // Simple comparison for memoization
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
