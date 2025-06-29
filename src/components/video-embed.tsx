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

// Helper function to create iframe src with autoplay
const createIframeSrc = (url: string, currentlyPlayingId: string | null, videoId: string) => {
  const shouldAutoplay = currentlyPlayingId === videoId;

  if (!shouldAutoplay) {
    return url;
  }

  // Properly add query parameters for active playback
  const separator = url.includes('?') ? '&' : '?';
  const autoplayParam = `autoplay=true&muted=false&controls=true`;
  const finalSrc = `${url}${separator}${autoplayParam}`;

  console.log("🎬 [VideoEmbed] Setting iframe src immediately for " + url.substring(0, 50) + "...:", {
    shouldAutoplay,
    originalUrl: url,
    separator,
    finalSrc: finalSrc.substring(0, 100) + "...",
  });

  return finalSrc;
};

// Helper function to render error state
// Removed all unused helper functions that contained duplicate VideoThumbnail instances

// Helper functions to reduce component complexity
const createVideoEventHandlers = (
  videoId: string,
  currentlyPlayingId: string | null,
  setCurrentlyPlaying: (id: string | null) => Promise<void>,
) => {
  const handlePlay = async () => {
    if (currentlyPlayingId !== videoId) {
      console.log("🎵 [VideoEmbed] HTML5 video started, updating context");
      await setCurrentlyPlaying(videoId);
    }
  };

  const handlePause = async () => {
    if (currentlyPlayingId === videoId) {
      console.log("⏸️ [VideoEmbed] HTML5 video paused, clearing context");
      await setCurrentlyPlaying(null);
    }
  };

  return { handlePlay, handlePause };
};

const setupVideoEventListeners = (
  videoElement: HTMLVideoElement,
  handlePlay: () => Promise<void>,
  handlePause: () => Promise<void>,
) => {
  videoElement.addEventListener("play", handlePlay);
  videoElement.addEventListener("pause", handlePause);

  return () => {
    videoElement.removeEventListener("play", handlePlay);
    videoElement.removeEventListener("pause", handlePause);
  };
};

// Memoize the component to prevent unnecessary re-renders
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, platform, thumbnailUrl, videoData, className = "" }) => {
    const [shouldLoad] = useState(true); // Start loading immediately
    const [isLoading, setIsLoading] = useState(false);
    const [contentLoaded, setContentLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // Controls visibility instead of loading
    const [iframeKey, setIframeKey] = useState(0); // Force iframe re-render when needed

    // Use split contexts to minimize re-renders
    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying, pauseAllOtherVideos } = useVideoPlaybackAPI();

    const iframeSrcRef = useRef<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const videoId = url;
    const hostedOnCDN = url.includes("iframe.mediadelivery.net");

    console.log("🎥 [VideoEmbed] Render:", {
      url: url.substring(0, 50) + "...",
      platform,
      shouldLoad,
      isLoading,
      contentLoaded,
      isVisible,
      currentlyPlaying: currentlyPlayingId ? currentlyPlayingId.substring(0, 50) + "..." : "none",
      hostedOnCDN,
      hasVideoData: !!videoData,
    });

    // Handle click to start video with much faster response
    const handleClick = useCallback(async () => {
      console.log("🚀 [VideoEmbed] Click detected - starting optimized playback:", {
        url: url.substring(0, 50) + "...",
        contentLoaded,
        isVisible,
      });

      try {
        // Show loading only if content isn't ready yet
        if (!contentLoaded) {
          setIsLoading(true);
        }

        // Pause other videos in parallel (don't wait)
        void pauseAllOtherVideos(videoId);

        // Set this video as playing immediately
        await setCurrentlyPlaying(videoId);

        // Make video visible immediately
        setIsVisible(true);

        // If content is already loaded, remove loading state immediately
        if (contentLoaded) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ [VideoEmbed] Error handling click:", error);
      }
    }, [url, contentLoaded, isVisible, pauseAllOtherVideos, setCurrentlyPlaying, videoId]);

    // Set iframe src immediately on mount for preloading (without autoplay)
    useEffect(() => {
      if (hostedOnCDN && !iframeSrcRef.current) {
        // Start muted and without autoplay for preloading
        const separator = url.includes('?') ? '&' : '?';
        const preloadParams = `muted=true&autoplay=false&controls=false`;
        const preloadUrl = `${url}${separator}${preloadParams}`;
        iframeSrcRef.current = preloadUrl;
        console.log("🔄 [VideoEmbed] Preloading iframe (muted):", url.substring(0, 50) + "...");
      }
    }, [hostedOnCDN, url]);

    // Update iframe src to include autoplay when video becomes active
    useEffect(() => {
      if (hostedOnCDN && isVisible && currentlyPlayingId === videoId) {
        const autoplayUrl = createIframeSrc(url, currentlyPlayingId, videoId);
        if (iframeSrcRef.current !== autoplayUrl) {
          console.log("🎬 [VideoEmbed] Activating autoplay:", {
            from: iframeSrcRef.current?.substring(0, 50) + "...",
            to: autoplayUrl.substring(0, 50) + "...",
          });
          iframeSrcRef.current = autoplayUrl;
        }
      }
    }, [hostedOnCDN, isVisible, currentlyPlayingId, videoId, url]);

    // Enhanced content load detection with multiple events and timeout
    const handleContentLoad = useCallback(() => {
      console.log("✅ [VideoEmbed] Content loaded!");
      setContentLoaded(true);
      
      // If user has clicked and is waiting, remove loading immediately
      if (isVisible) {
        setIsLoading(false);
      }

      // Clear any timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    }, [isVisible]);

    // Fallback timeout for loading state (max 2 seconds instead of 5+)
    useEffect(() => {
      if (isLoading) {
        loadTimeoutRef.current = setTimeout(() => {
          console.log("⏰ [VideoEmbed] Loading timeout - forcing completion");
          setIsLoading(false);
          setContentLoaded(true);
        }, 2000);

        return () => {
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
          }
        };
      }
    }, [isLoading]);

    // Monitor when other videos start playing and hide this one
    useEffect(() => {
      if (currentlyPlayingId && currentlyPlayingId !== videoId && isVisible) {
        console.log("🛑 [VideoEmbed] Hiding video (another video started):", {
          thisVideo: videoId.substring(0, 50) + "...",
          currentlyPlaying: currentlyPlayingId.substring(0, 50) + "...",
        });

        setIsVisible(false);
        setIsLoading(false);
        
        // Reset iframe to muted preload version to stop audio
        if (hostedOnCDN && iframeSrcRef.current) {
          const separator = url.includes('?') ? '&' : '?';
          const preloadParams = `muted=true&autoplay=false&controls=false`;
          const preloadUrl = `${url}${separator}${preloadParams}`;
          iframeSrcRef.current = preloadUrl;
          setIframeKey(prev => prev + 1); // Force iframe to re-render with new src
          console.log("🔇 [VideoEmbed] Reset to muted preload to stop audio");
        }
      }
    }, [currentlyPlayingId, videoId, isVisible, hostedOnCDN, url]);

    // HTML5 video event listeners for play/pause sync
    useEffect(() => {
      const videoElement = videoRef.current;
      if (!videoElement || !shouldLoad || hostedOnCDN) return;

      const { handlePlay, handlePause } = createVideoEventHandlers(videoId, currentlyPlayingId, setCurrentlyPlaying);
      return setupVideoEventListeners(videoElement, handlePlay, handlePause);
    }, [shouldLoad, hostedOnCDN, videoId, currentlyPlayingId, setCurrentlyPlaying]);

    // Cleanup when component unmounts
    useEffect(() => {
      return () => {
        if (currentlyPlayingId === videoId) {
          console.log("🧹 [VideoEmbed] Cleanup - stopping video on unmount:", videoId.substring(0, 50) + "...");
          setCurrentlyPlaying(null);
        }
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
      };
    }, [currentlyPlayingId, videoId, setCurrentlyPlaying]);

    // Sync wrapper for handleClick to match VideoThumbnail interface
    const handleClickSync = useCallback(() => {
      void handleClick();
    }, [handleClick]);

    // Optimized render logic - only one layer at a time
    const showThumbnail = !isVisible && !isLoading;
    const showLoadingOverlay = isLoading; // No thumbnail in loading - just spinner
    const showContent = isVisible; // Only render iframe when actually visible

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className || ""}`}>
        {/* Thumbnail layer - ONLY shows when completely inactive */}
        {showThumbnail && (
          <div className="absolute inset-0 z-10">
            <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClickSync} />
          </div>
        )}

        {/* Content layer - visible iframe when playing, hidden preload when not */}
        <div className="relative h-0 w-full pb-[177.78%]">
          {hostedOnCDN ? (
            <iframe
              key={iframeKey}
              src={iframeSrcRef.current ?? undefined}
              className={`absolute inset-0 h-full w-full ${!isVisible ? 'opacity-0 pointer-events-none -z-10' : ''}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleContentLoad}
              onError={() => {
                console.error("❌ [VideoEmbed] Iframe failed to load");
                setIsLoading(false);
                setHasError(true);
              }}
            />
          ) : (
            showContent && (
              <video
                ref={videoRef}
                src={url}
                className="absolute inset-0 h-full w-full object-cover"
                controls
                playsInline
                onLoadedData={handleContentLoad}
                onError={() => {
                  console.error("❌ [VideoEmbed] Video failed to load");
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            )
          )}
        </div>

        {/* Loading overlay - NO thumbnail, just clean spinner */}
        {showLoadingOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-75">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-sm text-white">Loading...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-75">
            <p className="text-sm text-red-400">Failed to load video</p>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.url === nextProps.url &&
      prevProps.platform === nextProps.platform &&
      prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
      JSON.stringify(prevProps.videoData) === JSON.stringify(nextProps.videoData) &&
      prevProps.className === nextProps.className
    );
  },
);

VideoEmbed.displayName = "VideoEmbed";
