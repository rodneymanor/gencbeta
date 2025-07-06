"use client";

import { Suspense } from "react";

import { VideoCollectionLoading } from "@/components/ui/loading-animations";
import type { Collection } from "@/lib/collections";

import type { VideoWithPlayer } from "./collections-helpers";
import { VideoGrid } from "./video-grid";

interface VideoGridWithSuspenseProps {
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

// Video grid wrapped in Suspense for better loading experience
export const VideoGridWithSuspense = ({
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
}: VideoGridWithSuspenseProps) => (
  <Suspense fallback={<VideoCollectionLoading count={12} />}>
    <VideoGrid
      videos={videos}
      collections={collections}
      selectedCollectionId={selectedCollectionId}
      loadingVideos={loadingVideos}
      isPending={isPending}
      manageMode={manageMode}
      selectedVideos={selectedVideos}
      deletingVideos={deletingVideos}
      onToggleVideoSelection={onToggleVideoSelection}
      onDeleteVideo={onDeleteVideo}
      onVideoAdded={onVideoAdded}
    />
  </Suspense>
);
