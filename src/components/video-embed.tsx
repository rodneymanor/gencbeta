"use client";

import React, { useState, useCallback, useEffect, memo } from "react";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";

import { VideoThumbnail } from "./video-thumbnail";

interface VideoEmbedProps {
  url: string;
  platform: "tiktok" | "instagram";
  thumbnailUrl?: string;
  className?: string;
}

// FIXED: Proper Bunny.net iframe.mediadelivery.net URL handling
const createVideoSrc = (url: string, shouldAutoplay: boolean = false) => {
  if (!url.includes("iframe.mediadelivery.net")) return url;

  // For Bunny.net iframe.mediadelivery.net, use minimal parameters
  // Bunny.net iframe service has different parameter requirements
  if (shouldAutoplay) {
    // For autoplay, just add autoplay=true (Bunny.net handles the rest)
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}autoplay=true`;
  } else {
    // No parameters needed for non-autoplay iframe
    return url;
  }
};

// OPTIMIZED: Simplified Video Embed Component
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, platform, thumbnailUrl, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    const videoId = url;
    const hostedOnCDN = url.includes("iframe.mediadelivery.net");

    // Minimal debug for critical issues only
    if (!url || url.length < 50) {
      console.warn("⚠️ [VideoEmbed] Incomplete URL:", { url, urlLength: url.length || 0 });
    }

    // CRITICAL: Simple click handler - no complex async operations
    const handlePlay = useCallback(() => {
      setIsLoading(true);
      setIsPlaying(true);

      // Set as currently playing (this will pause others)
      void setCurrentlyPlaying(videoId);

      // Quick loading timeout
      setTimeout(() => setIsLoading(false), 800);
    }, [videoId, setCurrentlyPlaying]);

    // SIMPLIFIED: Auto-pause when another video plays
    useEffect(() => {
      if (currentlyPlayingId !== videoId && isPlaying) {
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, isPlaying, url]);

    // OPTIMIZED: Single render logic - no complex state combinations
    if (!isPlaying) {
      return (
        <div className={`group relative h-full w-full overflow-hidden rounded-lg bg-black ${className}`}>
          <VideoThumbnail
            platform={platform}
            thumbnailUrl={thumbnailUrl}
            onClick={handlePlay}
            title={url.substring(0, 50) + "..."}
          />
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
              onLoad={() => {
                console.log("✅ [VideoEmbed] Iframe loaded successfully");
                setIsLoading(false);
              }}
              onError={(e) => {
                console.error("❌ [VideoEmbed] Iframe failed to load:", e);
                console.error("❌ [VideoEmbed] Failed URL:", createVideoSrc(url, true));
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

        {/* Error state with debugging info */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-4">
            <p className="mb-2 text-sm text-white">Failed to load video</p>
            <p className="text-center text-xs break-all text-gray-400">URL: {url.substring(0, 60)}...</p>
            <button
              onClick={() => {
                setHasError(false);
                setIsPlaying(false);
              }}
              className="mt-2 rounded bg-white/20 px-3 py-1 text-xs text-white hover:bg-white/30"
            >
              Try Again
            </button>
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
