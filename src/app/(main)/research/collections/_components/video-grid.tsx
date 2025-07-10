"use client";

import { useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Collection, Video } from "@/lib/collections";

import { VideoCard } from "./video-card";

interface VideoGridProps {
  collectionId?: string;
  collection?: Collection | null;
  videos?: Video[];
  collections?: Collection[];
  selectedCollectionId?: string | null;
  loadingVideos?: boolean;
  isPending?: boolean;
  manageMode?: boolean;
  selectedVideos?: Set<string>;
  deletingVideos?: Set<string>;
  onToggleVideoSelection?: (videoId: string) => void;
  onDeleteVideo?: (videoId: string) => void;
  onVideoAdded?: () => void;
  onLoadMore?: () => Promise<void>;
  hasMoreVideos?: boolean;
  isLoadingMore?: boolean;
}

// Helper function to check for duplicate video IDs
const checkForDuplicates = (videos: Video[]) => {
  const videoIds = videos.map((v) => v.id).filter(Boolean);
  const uniqueVideoIds = new Set(videoIds);
  if (videoIds.length !== uniqueVideoIds.size) {
    console.warn("🚨 [VideoGrid] Duplicate video IDs detected:", {
      totalVideos: videoIds.length,
      uniqueVideos: uniqueVideoIds.size,
      duplicates: videoIds.filter((id, index) => videoIds.indexOf(id) !== index),
    });
  }
};

export const VideoGrid = ({
  videos = [],
  collections = [],
  selectedCollectionId,
  manageMode,
  selectedVideos,
  deletingVideos,
  onToggleVideoSelection,
  onDeleteVideo,
  onVideoAdded,
  onLoadMore,
  hasMoreVideos = false,
  isLoadingMore = false,
}: VideoGridProps) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const handleVideoPlay = (videoId: string) => {
      setCurrentlyPlayingId(videoId);
  };

  // Ensure videos is always an array
  const safeVideos = videos || [];

  // Debug: Check for duplicate video IDs
  checkForDuplicates(safeVideos);

  // Loading state
  if (safeVideos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">No videos found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {safeVideos.map((video) => {
          const videoId = video.id;
          if (!videoId) return null;

          // Create a unique key combining video ID and collection ID to prevent duplicates
          const uniqueKey = `${videoId}-${video.collectionId ?? "no-collection"}`;

        return (
            <div key={uniqueKey} data-video-id={videoId}>
            <VideoCard
              video={video}
                collections={collections}
                currentCollectionId={selectedCollectionId}
                isManageMode={manageMode ?? false}
                isSelected={selectedVideos?.has(videoId) ?? false}
                isDeleting={deletingVideos?.has(videoId) ?? false}
              onToggleSelection={() => {
                  onToggleVideoSelection?.(videoId);
              }}
              onDelete={() => {
                  onDeleteVideo?.(videoId);
              }}
                onVideoUpdated={onVideoAdded}
              isPlaying={currentlyPlayingId === videoId}
              onPlay={handleVideoPlay}
            />
          </div>
        );
      })}
      </div>

      {/* Load More Button */}
      {hasMoreVideos && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button onClick={onLoadMore} disabled={isLoadingMore} variant="outline" className="min-w-[120px]">
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
