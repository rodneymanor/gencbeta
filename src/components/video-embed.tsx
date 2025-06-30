"use client";

import React, { useState, useCallback, useRef, useEffect, memo } from "react";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";

import { VideoThumbnail } from "./video-thumbnail";

interface VideoData {
  buffer: number[];
  size: number;
  mimeType: string;
  filename: string;
}

interface VideoEmbedProps {
  url: string;
  platform: "tiktok" | "instagram";
  thumbnailUrl?: string;
  videoData?: VideoData;
  className?: string;
}

// SIMPLIFIED: Single iframe src creation function
const createVideoSrc = (url: string, shouldAutoplay: boolean = false) => {
  if (!url.includes("iframe.mediadelivery.net")) return url;

  const separator = url.includes("?") ? "&" : "?";
  const params = shouldAutoplay ? "autoplay=1&muted=0&controls=1" : "autoplay=0&muted=1&controls=0&preload=metadata";

  return `${url}${separator}${params}`;
};

// OPTIMIZED: Simplified Video Embed Component
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, platform, thumbnailUrl, videoData, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    const videoId = url;
    const hostedOnCDN = url.includes("iframe.mediadelivery.net");
    const isCurrentlyPlaying = currentlyPlayingId === videoId;

    // CRITICAL: Simple click handler - no complex async operations
    const handlePlay = useCallback(() => {
      console.log("🎬 [VideoEmbed] Starting playback:", url.substring(0, 50) + "...");

      setIsLoading(true);
      setIsPlaying(true);

      // Set as currently playing (this will pause others)
      void setCurrentlyPlaying(videoId);

      // Quick loading timeout
      setTimeout(() => setIsLoading(false), 800);
    }, [url, videoId, setCurrentlyPlaying]);

    // SIMPLIFIED: Auto-pause when another video plays
    useEffect(() => {
      if (currentlyPlayingId !== videoId && isPlaying) {
        console.log("⏸️ [VideoEmbed] Auto-pausing:", url.substring(0, 50) + "...");
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, isPlaying, url]);

    // OPTIMIZED: Single render logic - no complex state combinations
    if (!isPlaying) {
      return (
        <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
          <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handlePlay} />
        </div>
      );
    }

    // SIMPLIFIED: Playing state - single iframe, no switching
    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative h-0 w-full pb-[177.78%]">
          {hostedOnCDN ? (
            <iframe
              src={createVideoSrc(url, true)}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error("❌ [VideoEmbed] Iframe failed to load");
                setHasError(true);
                setIsLoading(false);
              }}
            />
          ) : (
            <video
              src={url}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              autoPlay
              playsInline
              onLoadedData={() => setIsLoading(false)}
              onPlay={() => void setCurrentlyPlaying(videoId)}
              onError={() => {
                console.error("❌ [VideoEmbed] Video failed to load");
                setHasError(true);
                setIsLoading(false);
              }}
            />
          )}
        </div>

        {/* MINIMAL: Simple loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75">
            <p className="text-sm text-white">Failed to load video</p>
          </div>
        )}
      </div>
    );
  },
  // OPTIMIZED: Simple memo comparison
  (prevProps, nextProps) => {
    return (
      prevProps.url === nextProps.url &&
      prevProps.platform === nextProps.platform &&
      prevProps.thumbnailUrl === nextProps.thumbnailUrl
    );
  },
);

VideoEmbed.displayName = "VideoEmbed";
