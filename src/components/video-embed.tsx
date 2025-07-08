"use client";

import React, { useState, useCallback, useEffect, memo } from "react";

import { Play } from "lucide-react";
import BunnyIframe from "./bunny-iframe";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";

interface VideoEmbedProps {
  url: string;
  className?: string;
  videoId?: string; // Add videoId prop for better control
  isPlaying?: boolean; // Add isPlaying prop for external control
  onPlay?: () => void; // Add onPlay callback for external control
}

// BUNNY.NET ONLY VIDEO EMBED - Rejects all non-Bunny URLs
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, className = "", videoId: externalVideoId, isPlaying: externalIsPlaying, onPlay }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [iframeKey] = useState(0); // stable key, no recreation

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    // Use external videoId if provided, otherwise use URL
    const videoId = externalVideoId || url;
    
    // Use external isPlaying state if provided, otherwise use internal state
    const isCurrentlyPlaying = externalIsPlaying !== undefined ? externalIsPlaying : isPlaying;

    // Handle video play
    const handlePlay = useCallback(async () => {
      if (!isCurrentlyPlaying && videoId) {
        console.log("🎬 [VideoEmbed] Starting smooth transition:", videoId.substring(0, 50) + "...");
        setIsLoading(true);

        // Call external onPlay callback if provided
        if (onPlay) {
          onPlay();
        } else {
          // Fallback to context-based playback
          await setCurrentlyPlaying(videoId);
        }

        // Small delay to allow buffer to build before showing controls
        setTimeout(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }, 800);
      }
    }, [isCurrentlyPlaying, videoId, setCurrentlyPlaying, onPlay]);

    // PRODUCTION SOLUTION: Force iframe recreation when pausing
    useEffect(() => {
      if (externalIsPlaying !== undefined) {
        // External control mode
        setIsPlaying(externalIsPlaying);
        setIsLoading(false);
      } else if (currentlyPlayingId !== videoId && isPlaying) {
        // Context control mode
        console.log("⏸️ [VideoEmbed] Force stopping Bunny video by recreating iframe");
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, isPlaying, externalIsPlaying]);

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
          {isCurrentlyPlaying ? (
            // Playing iframe with autoplay
            <BunnyIframe
              iframeKey={`playing-${iframeKey}`}
              videoId={videoId}
              src={`${url}${url.includes("?") ? "&" : "?"}autoplay=true&preload=true&muted=true&metrics=false`}
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            // Thumbnail iframe without autoplay
            <iframe
              key={`thumbnail-${iframeKey}`}
              src={`${url}${url.includes("?") ? "&" : "?"}metrics=false&preload=true`}
              data-video-id={videoId}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}

          {/* Click overlay for play button */}
          {!isCurrentlyPlaying && (
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
  (prevProps, nextProps) => 
    prevProps.url === nextProps.url && 
    prevProps.videoId === nextProps.videoId && 
    prevProps.isPlaying === nextProps.isPlaying,
);

VideoEmbed.displayName = "VideoEmbed";
