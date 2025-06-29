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
  const autoplayParam = shouldAutoplay ? "&autoplay=true&muted=false" : "";
  const finalSrc = `${url}${autoplayParam}`;

  console.log("🎬 [VideoEmbed] Setting iframe src immediately for " + url.substring(0, 50) + "...:", {
    shouldAutoplay,
    finalSrc: finalSrc.substring(0, 100) + "...",
  });

  return finalSrc;
};

// Helper function to render error state
const renderErrorState = (className: string) => (
  <div className={`relative flex aspect-[9/16] items-center justify-center rounded-lg bg-gray-100 ${className}`}>
    <p className="text-sm text-gray-500">Failed to load video</p>
  </div>
);

// Helper function to render thumbnail state
const renderThumbnailState = (
  className: string,
  platform: "tiktok" | "instagram",
  thumbnailUrl: string | undefined,
  handleClick: () => void,
  clickable = true,
) => (
  <div
    className={`relative ${clickable ? "cursor-pointer" : ""} ${className}`}
    onClick={clickable ? handleClick : undefined}
  >
    <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClick} />
  </div>
);

// Helper function to render CDN iframe
const renderCDNIframe = (
  className: string,
  iframeSrcRef: React.MutableRefObject<string | null>,
  isPlaying: boolean,
  currentlyPlayingId: string | null,
  videoId: string,
  url: string,
  isLoading: boolean,
  platform: "tiktok" | "instagram",
  thumbnailUrl: string | undefined,
  handleContentLoad: () => void,
  setHasError: (error: boolean) => void,
) => {
  if (!iframeSrcRef.current) {
    const shouldAutoplay = isPlaying && currentlyPlayingId === videoId;
    const finalSrc = createIframeSrc(url, shouldAutoplay ? currentlyPlayingId : null, videoId);
    iframeSrcRef.current = finalSrc;

    console.log("🎬 [VideoEmbed] Setting iframe src immediately for", videoId.substring(0, 50) + "...:", {
      shouldAutoplay,
      finalSrc: finalSrc.substring(0, 100) + "...",
    });
  }

  return (
    <div className={`relative aspect-[9/16] overflow-hidden rounded-lg bg-black ${className}`}>
      <iframe
        src={iframeSrcRef.current}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleContentLoad}
        onError={() => {
          console.error("🚫 [VideoEmbed] Iframe failed to load");
          setHasError(true);
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 z-10">
          <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={() => {}} />
        </div>
      )}
    </div>
  );
};

// Helper function to render direct video
const renderDirectVideo = (
  className: string,
  url: string,
  handleContentLoad: () => void,
  setHasError: (error: boolean) => void,
) => (
  <div className={`relative aspect-[9/16] overflow-hidden rounded-lg bg-black ${className}`}>
    <video
      src={url}
      className="h-full w-full object-cover"
      controls
      playsInline
      onLoadedData={handleContentLoad}
      onError={() => {
        console.error("🚫 [VideoEmbed] Video failed to load");
        setHasError(true);
      }}
    />
  </div>
);

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
    const [shouldLoad, setShouldLoad] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [contentLoaded, setContentLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Use split contexts to minimize re-renders
    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying, pauseAllOtherVideos } = useVideoPlaybackAPI();

    const iframeSrcRef = useRef<string | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const videoId = url;
    const hostedOnCDN = url.includes("iframe.mediadelivery.net");

    console.log("🎥 [VideoEmbed] Render:", {
      url: url.substring(0, 50) + "...",
      platform,
      shouldLoad,
      isLoading,
      contentLoaded,
      currentlyPlaying: currentlyPlayingId?.substring(0, 50) + "..." || "none",
      hostedOnCDN,
      hasVideoData: !!videoData,
    });

    // Handle click to start video with proper async control
    const handleClick = useCallback(async () => {
      console.log("🔥 [VideoEmbed] Click detected - pausing others first:", {
        url: url.substring(0, 50) + "...",
        platform,
        currentShouldLoad: shouldLoad,
        hostedOnCDN,
        hasVideoData: !!videoData,
      });

      try {
        // First pause all other videos and wait for completion
        await pauseAllOtherVideos(videoId);

        // Then start this video
        await setCurrentlyPlaying(videoId);

        setShouldLoad(true);
        setIsLoading(true);
      } catch (error) {
        console.error("❌ [VideoEmbed] Error handling click:", error);
      }
    }, [url, platform, shouldLoad, hostedOnCDN, videoData, pauseAllOtherVideos, setCurrentlyPlaying, videoId]);

    // Set iframe src immediately when shouldLoad becomes true for CDN videos
    useEffect(() => {
      if (shouldLoad && hostedOnCDN && !iframeSrcRef.current) {
        const shouldAutoplay = currentlyPlayingId === videoId;
        const autoplayParam = shouldAutoplay ? "&autoplay=true&muted=false" : "";
        const finalSrc = `${url}${autoplayParam}`;

        console.log("🎬 [VideoEmbed] Setting iframe src immediately for " + url.substring(0, 50) + "...:", {
          shouldAutoplay,
          finalSrc: finalSrc.substring(0, 100) + "...",
        });

        iframeSrcRef.current = finalSrc;
      }
    }, [shouldLoad, hostedOnCDN, url, currentlyPlayingId, videoId]);

    // Handle content load events
    const handleContentLoad = useCallback(() => {
      console.log("✅ [VideoEmbed] Content loaded!");
      setIsLoading(false);
      setContentLoaded(true);

      // Only start if this video is currently set to be playing
      if (currentlyPlayingId !== videoId) {
        console.log(
          "⏸️ [VideoEmbed] Content loaded but not starting - another video is playing:",
          currentlyPlayingId?.substring(0, 20) + "..." || "none",
        );
      }
    }, [currentlyPlayingId, videoId]);

    // Monitor when other videos start playing and stop this one
    useEffect(() => {
      if (currentlyPlayingId && currentlyPlayingId !== videoId && (shouldLoad || contentLoaded)) {
        console.log("🛑 [VideoEmbed] Stopping video (another video started):", {
          thisVideo: videoId.substring(0, 50) + "...",
          currentlyPlaying: currentlyPlayingId.substring(0, 50) + "...",
        });

        // Reset state but keep content loaded for faster restart
        setShouldLoad(false);
        setIsLoading(false);
      }
    }, [currentlyPlayingId, videoId, shouldLoad, contentLoaded]);

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
      };
    }, [currentlyPlayingId, videoId, setCurrentlyPlaying]);

    // Sync wrapper for handleClick to match VideoThumbnail interface
    const handleClickSync = useCallback(() => {
      void handleClick();
    }, [handleClick]);

    // Render logic
    const showThumbnail = !shouldLoad;
    const showLoadingOverlay = shouldLoad && isLoading;
    const showContent = shouldLoad;

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className || ""}`}>
        {/* Thumbnail layer - shows when video not loaded */}
        {showThumbnail && (
          <div className="absolute inset-0 z-10">
            <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClickSync} />
          </div>
        )}

        {/* Content layer - iframe or video element */}
        {showContent && (
          <div className="relative h-0 w-full pb-[177.78%]">
            {hostedOnCDN ? (
              <iframe
                key={videoId} // Prevent re-renders
                src={iframeSrcRef.current || undefined}
                className="absolute inset-0 h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleContentLoad}
                onError={() => {
                  console.error("❌ [VideoEmbed] Iframe failed to load");
                  setIsLoading(false);
                }}
              />
            ) : (
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
                }}
              />
            )}
          </div>
        )}

        {/* Loading overlay */}
        {showLoadingOverlay && (
          <div className="bg-opacity-75 absolute inset-0 z-20 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-sm text-white">Loading video...</p>
            </div>
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
