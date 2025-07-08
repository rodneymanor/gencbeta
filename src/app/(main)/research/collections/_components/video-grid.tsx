"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";

import { Plus, Loader2, AlertTriangle } from "lucide-react";

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

// Preload configuration
const INITIAL_VIDEO_COUNT = 6;
const LAZY_LOAD_BATCH_SIZE = 6;

// Helper function to stop all other videos
const stopOtherVideos = (videos: VideoWithPlayer[], currentVideoId: string) => {
  videos.forEach((video) => {
    if (video.id && video.id !== currentVideoId) {
      const iframe = document.querySelector(`iframe[data-video-id="${video.id}"]`) as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ command: 'pause' }, '*');
      }
    }
  });
};

// Helper function to render empty state
const renderEmptyState = (
  selectedCollectionId: string | null,
  collections: Collection[],
  onVideoAdded: () => void
) => (
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
    const [reprocessingVideos] = useState<Set<string>>(new Set());
    const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
    const [visibleVideoCount, setVisibleVideoCount] = useState(INITIAL_VIDEO_COUNT);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastPlayTime, setLastPlayTime] = useState<number>(0);
    const [hlsIssues, setHlsIssues] = useState<Map<string, string>>(new Map()); // Track HLS issues per video
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

    const handleReprocessVideo = async () => {
      // TODO: Re-implement video reprocessing. The required properties `url` and `collectionId` are missing from the `VideoWithPlayer` type in this version of the code.
      console.log("Reprocessing is currently disabled.");
    };

    // Enhanced HLS issue tracking
    const handleHLSIssue = useCallback((videoId: string, issueType: string) => {
      console.warn(`🚨 [VideoGrid] HLS issue detected for video ${videoId}: ${issueType}`);
      setHlsIssues(prev => new Map(prev).set(videoId, issueType));

      // Auto-recovery: If this is the currently playing video, try to recover
      if (currentPlayingVideo === videoId) {
        console.log("🔄 [VideoGrid] Attempting auto-recovery for currently playing video");
        // The VideoEmbed component will handle the actual recovery
      }
    }, [currentPlayingVideo]);

    // Handle video play - ensures only one video plays at a time with dedupe protection
    const handleVideoPlay = useCallback((videoId: string) => {
      const now = Date.now();
      const timeSinceLastPlay = now - lastPlayTime;

      // Prevent rapid clicks (3.5 second cooldown)
      if (timeSinceLastPlay < 3500) {
        console.log("⏸️ [VideoGrid] Video play blocked - too soon since last play");
        return;
      }

      console.log("🎬 [VideoGrid] Playing video:", videoId);
      setCurrentPlayingVideo(videoId);
      setLastPlayTime(now);

      // Clear any previous HLS issues for this video
      setHlsIssues(prev => {
        const newMap = new Map(prev);
        newMap.delete(videoId);
        return newMap;
      });

      // Stop all other videos
      stopOtherVideos(videos, videoId);
    }, [videos, lastPlayTime]);

    // Lazy load more videos when user scrolls near the end
    const loadMoreVideos = useCallback(() => {
      if (isLoadingMore || visibleVideoCount >= videos.length) return;

      setIsLoadingMore(true);
      console.log("🔄 [VideoGrid] Loading more videos...");

      // Simulate loading delay for better UX
      setTimeout(() => {
        const newCount = Math.min(visibleVideoCount + LAZY_LOAD_BATCH_SIZE, videos.length);
        setVisibleVideoCount(newCount);
        setIsLoadingMore(false);
        console.log(`✅ [VideoGrid] Loaded ${newCount} videos out of ${videos.length} total`);
      }, 300);
    }, [isLoadingMore, visibleVideoCount, videos.length]);

    // Set up intersection observer for lazy loading
    useEffect(() => {
      if (!loadMoreTriggerRef.current || visibleVideoCount >= videos.length) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !isLoadingMore) {
            loadMoreVideos();
          }
        },
        {
          rootMargin: '100px', // Start loading when 100px away from trigger
          threshold: 0.1,
        }
      );

      observerRef.current.observe(loadMoreTriggerRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [loadMoreVideos, isLoadingMore, visibleVideoCount, videos.length]);

    // Reset visible count when videos change
    useEffect(() => {
      setVisibleVideoCount(INITIAL_VIDEO_COUNT);
      // Clear HLS issues when videos change
      setHlsIssues(new Map());
    }, [videos]);

    // Get visible videos for rendering
    const visibleVideos = videos.slice(0, visibleVideoCount);
    const hasMoreVideos = visibleVideoCount < videos.length;

    // Show loading state
    if (loadingVideos || isPending) {
      return <VideosLoadingSkeleton />;
    }

    // Empty state with improved styling
    if (videos.length === 0) {
      return renderEmptyState(selectedCollectionId, collections, onVideoAdded);
    }

    // Video grid with enhanced styling, single video playback control, and lazy loading
    return (
      <div className="space-y-6">
        {/* HLS Issues Summary */}
        {hlsIssues.size > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Video playback issues detected ({hlsIssues.size} video{hlsIssues.size > 1 ? 's' : ''})
              </span>
            </div>
            <p className="mt-1 text-xs text-yellow-700">
              Some videos may have buffering issues. The system is automatically attempting recovery.
            </p>
          </div>
        )}

        {/* Video Grid */}
        <div className="flex flex-wrap justify-start gap-4">
          {visibleVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isManageMode={manageMode}
              isSelected={selectedVideos.has(video.id!)}
              isDeleting={deletingVideos.has(video.id!)}
              isReprocessing={reprocessingVideos.has(video.id!)}
              isPlaying={currentPlayingVideo === video.id}
              hasHLSIssue={hlsIssues.has(video.id!)}
              onToggleSelection={() => onToggleVideoSelection(video.id!)}
              onDelete={() => onDeleteVideo(video.id!)}
              onReprocess={handleReprocessVideo}
              onPlay={handleVideoPlay}
              onHLSIssue={(issueType: string) => handleHLSIssue(video.id!, issueType)}
              className="border-border/60 hover:border-border/80 shadow-sm transition-all duration-200 hover:shadow-md"
            />
          ))}
        </div>

        {/* Lazy Load Trigger */}
        {hasMoreVideos && (
          <div
            ref={loadMoreTriggerRef}
            className="flex items-center justify-center py-8"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading more videos...</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Scroll to load more videos
              </div>
            )}
          </div>
        )}

        {/* End of Videos */}
        {!hasMoreVideos && videos.length > 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">
              You&apos;ve reached the end of your videos
            </div>
          </div>
        )}
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
      prevProps.videos.every((video, index) => {
        const nextVideo = nextProps.videos[index];
        return nextVideo && video.id === nextVideo.id;
      })
    );
  },
);

VideoGrid.displayName = "VideoGrid";
