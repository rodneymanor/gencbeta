"use client";

import React, { useState, useCallback, useEffect, memo } from "react";

import { Play } from "lucide-react";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";

interface VideoEmbedProps {
  url: string;
  className?: string;
}

// BUNNY.NET ONLY VIDEO EMBED - Rejects all non-Bunny URLs
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [iframeKey, setIframeKey] = useState(0); // Force iframe recreation

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    const videoId = url;

    // Handle video play
    const handlePlay = useCallback(() => {
      if (!isPlaying && videoId) {
        console.log("🎬 [VideoEmbed] Starting Bunny video:", videoId.substring(0, 50) + "...");
        setIsLoading(true);
        setIsPlaying(true);
        void setCurrentlyPlaying(videoId);
        setTimeout(() => setIsLoading(false), 500);
      }
    }, [isPlaying, videoId, setCurrentlyPlaying]);

    // PRODUCTION SOLUTION: Force iframe recreation when pausing
    useEffect(() => {
      if (currentlyPlayingId !== videoId && isPlaying) {
        console.log("⏸️ [VideoEmbed] Force stopping Bunny video by recreating iframe");
        setIsPlaying(false);
        setIsLoading(false);
        // Force iframe to be completely destroyed and recreated
        setIframeKey((prev) => prev + 1);
      }
    }, [currentlyPlayingId, videoId, isPlaying]);

    // CRITICAL: Only allow Bunny.net iframe URLs - REJECT EVERYTHING ELSE
    const isBunnyUrl =
      url && (url.includes("iframe.mediadelivery.net") || url.includes("bunnycdn.com") || url.includes("b-cdn.net"));

    if (!isBunnyUrl) {
      console.warn("🚫 [VideoEmbed] Rejected non-Bunny URL:", url);
      return (
        <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
          <div className="p-4 text-center">
            <div className="text-sm font-medium">Video Processing Required</div>
            <div className="mt-1 text-xs text-gray-400">Only Bunny.net CDN videos supported</div>
          </div>
        </div>
      );
    }

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative h-0 w-full pb-[177.78%]">
          {/* PRODUCTION SOLUTION: Conditional iframe rendering */}
          {isPlaying ? (
            // Playing iframe with autoplay
            <iframe
              key={`playing-${iframeKey}`}
              src={`${url}${url.includes("?") ? "&" : "?"}autoplay=true&metrics=false`}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            // Thumbnail iframe without autoplay
            <iframe
              key={`thumbnail-${iframeKey}`}
              src={`${url}${url.includes("?") ? "&" : "?"}metrics=false`}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Click overlay for play button */}
          {!isPlaying && (
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
              onClick={handlePlay}
            >
              <div className="rounded-full bg-black/60 p-6 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.url === nextProps.url,
);

VideoEmbed.displayName = "VideoEmbed";
