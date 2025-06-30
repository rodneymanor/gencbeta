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

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    const videoId = url;

    // Handle video play - moved before early return
    const handlePlay = useCallback(() => {
      if (!isPlaying && videoId) {
        console.log("🎬 [VideoEmbed] Starting Bunny video:", videoId.substring(0, 50) + "...");
        setIsLoading(true);
        setIsPlaying(true);
        void setCurrentlyPlaying(videoId);
        setTimeout(() => setIsLoading(false), 500);
      }
    }, [isPlaying, videoId, setCurrentlyPlaying]);

    // Auto-pause when another video plays - moved before early return
    useEffect(() => {
      if (currentlyPlayingId !== videoId && isPlaying) {
        console.log("⏸️ [VideoEmbed] Pausing Bunny video");
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, isPlaying]);

    // CRITICAL: Only allow Bunny.net iframe URLs - REJECT EVERYTHING ELSE
    const isBunnyUrl = url && (
      url.includes('iframe.mediadelivery.net') || 
      url.includes('bunnycdn.com') ||
      url.includes('b-cdn.net')
    );
    
    if (!isBunnyUrl) {
      console.warn("🚫 [VideoEmbed] Rejected non-Bunny URL:", url);
      return (
        <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
          <div className="text-center p-4">
            <div className="text-sm font-medium">Video Processing Required</div>
            <div className="text-xs text-gray-400 mt-1">Only Bunny.net CDN videos supported</div>
          </div>
        </div>
      );
    }

    // Create iframe src
    const iframeSrc = isPlaying 
      ? `${url}${url.includes("?") ? "&" : "?"}autoplay=true`
      : url;

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative h-0 w-full pb-[177.78%]">
          {/* Bunny.net iframe ONLY */}
          <iframe
            src={iframeSrc}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />

          {/* Click overlay for play button */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-colors"
              onClick={handlePlay}
            >
              <div className="rounded-full bg-black/60 p-6 backdrop-blur-sm hover:scale-110 hover:bg-black/80 transition-all">
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
  (prevProps, nextProps) => prevProps.url === nextProps.url
);

VideoEmbed.displayName = "VideoEmbed";
