"use client";

import React, { useState, useCallback, useEffect, memo } from "react";
import { Play } from "lucide-react";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";

interface VideoEmbedProps {
  url: string;
  className?: string;
}

// Production-ready video embed for Bunny.net iframes
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, className = "" }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    const videoId = url;

    // Create iframe src based on playing state
    const iframeSrc = isPlaying 
      ? `${url}${url.includes("?") ? "&" : "?"}autoplay=true`
      : url;

    // Handle video play
    const handlePlay = useCallback(() => {
      if (!isPlaying) {
        console.log("🎬 [VideoEmbed] Starting video playback:", videoId.slice(0, 50));
        setIsLoading(true);
        setIsPlaying(true);
        void setCurrentlyPlaying(videoId);
        // Quick loading timeout
        setTimeout(() => setIsLoading(false), 500);
      }
    }, [isPlaying, videoId, setCurrentlyPlaying]);

    // Auto-pause when another video plays
    useEffect(() => {
      if (currentlyPlayingId !== videoId && isPlaying) {
        console.log("⏸️ [VideoEmbed] Pausing video:", videoId.slice(0, 50));
        setIsPlaying(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, isPlaying]);

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative h-0 w-full pb-[177.78%]">
          {/* Bunny.net iframe */}
          <iframe
            src={iframeSrc}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => {
              setIsLoading(false);
            }}
          />

          {/* Click overlay - only show when not playing */}
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
  (prevProps, nextProps) => {
    return (
      prevProps.url === nextProps.url
    );
  },
);

VideoEmbed.displayName = "VideoEmbed";
