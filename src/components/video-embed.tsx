"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from "react";

import { useVideoPlayback } from "@/contexts/video-playback-context";

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
const createIframeSrc = (url: string, shouldAutoplay: boolean): string => {
  return shouldAutoplay ? `${url}${url.includes("?") ? "&" : "?"}autoplay=true` : url;
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
    const finalSrc = createIframeSrc(url, shouldAutoplay);
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

// Memoize the component to prevent unnecessary re-renders
const VideoEmbed = memo(function VideoEmbed({
  url,
  platform,
  thumbnailUrl,
  videoData,
  className = "",
}: VideoEmbedProps) {
  // Local state
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Refs for stable references
  const iframeSrcRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Global playback state
  const { currentlyPlayingId, setCurrentlyPlaying, pauseAllOtherVideos } = useVideoPlayback();

  // Memoize video ID to prevent recalculation
  const videoId = React.useMemo(() => url, [url]);

  // Memoize playing state calculation
  const isPlaying = React.useMemo(() => currentlyPlayingId === videoId, [currentlyPlayingId, videoId]);

  // Determine if video is hosted on CDN
  const hostedOnCDN = url.includes("iframe.mediadelivery.net");

  console.log("🎥 [VideoEmbed] Render:", {
    url: url.substring(0, 50) + "...",
    platform,
    shouldLoad,
    isLoading,
    contentLoaded,
    isPlaying,
    thumbnailUrl: thumbnailUrl ? thumbnailUrl.substring(0, 50) + "..." : "none",
    currentlyPlayingId: (currentlyPlayingId ?? "null").substring(0, 50) + "...",
    hasError,
  });

  // Enhanced click handler with immediate pause of other videos
  const handleClick = useCallback(() => {
    if (hasError || shouldLoad) return;

    console.log("🔥 [VideoEmbed] Click detected - pausing others first:", {
      url: url.substring(0, 50) + "...",
      platform,
      currentShouldLoad: shouldLoad,
      hostedOnCDN,
      hasVideoData: !!videoData,
    });

    // IMMEDIATELY pause all other videos before starting this one
    pauseAllOtherVideos(videoId);

    // Update global state (this also triggers DOM-level pause in context)
    setCurrentlyPlaying(videoId);

    // Then proceed with loading this video
    setShouldLoad(true);
    setIsLoading(true);
  }, [hasError, shouldLoad, url, platform, hostedOnCDN, videoData, videoId, setCurrentlyPlaying, pauseAllOtherVideos]);

  // Handle content load events
  const handleContentLoad = useCallback(() => {
    console.log("✅ [VideoEmbed] Content loaded!");
    setIsLoading(false);
    setContentLoaded(true);

    if (currentlyPlayingId !== videoId) {
      console.log(
        "⏸️ [VideoEmbed] Content loaded but not starting - another video is playing:",
        (currentlyPlayingId ?? "none").substring(0, 50) + "...",
      );
      return;
    }

    // For HTML5 videos, start playback
    if (videoRef.current && !hostedOnCDN) {
      videoRef.current.play().catch((err) => {
        console.error("🚫 [VideoEmbed] Video play failed:", err);
        setHasError(true);
      });
    }
  }, [currentlyPlayingId, videoId, hostedOnCDN]);

  // Effect to stop videos when another video starts playing (backup to context)
  useEffect(() => {
    if (currentlyPlayingId && currentlyPlayingId !== videoId && shouldLoad) {
      console.log("🛑 [VideoEmbed] Stopping video (another video started):", {
        thisVideo: videoId.substring(0, 50) + "...",
        currentlyPlaying: currentlyPlayingId.substring(0, 50) + "...",
      });

      // Stop video element if it exists and is playing
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  }, [currentlyPlayingId, videoId, shouldLoad]);

  // Add event listener to HTML5 video for play events (additional safeguard)
  useEffect(() => {
    if (!shouldLoad || hostedOnCDN || !videoRef.current) return;

    const videoElement = videoRef.current;

    const handlePlay = () => {
      console.log("▶️ [VideoEmbed] HTML5 video play event detected - ensuring global state sync");
      if (currentlyPlayingId !== videoId) {
        // This video started playing but isn't tracked globally - fix it
        setCurrentlyPlaying(videoId);
        pauseAllOtherVideos(videoId);
      }
    };

    const handlePause = () => {
      console.log("⏸️ [VideoEmbed] HTML5 video pause event detected");
      if (currentlyPlayingId === videoId) {
        // This was the active video and it paused - clear global state
        setCurrentlyPlaying(null);
      }
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
    };
  }, [shouldLoad, hostedOnCDN, videoId, currentlyPlayingId, setCurrentlyPlaying, pauseAllOtherVideos]);

  // Effect to clean up when component unmounts
  useEffect(() => {
    return () => {
      if (currentlyPlayingId === videoId) {
        console.log("🧹 [VideoEmbed] Cleanup - stopping video on unmount:", videoId.substring(0, 50) + "...");
        setCurrentlyPlaying(null);
      }
    };
  }, [currentlyPlayingId, videoId, setCurrentlyPlaying]);

  // Set iframe src only once when needed
  useEffect(() => {
    if (shouldLoad && hostedOnCDN && !iframeSrcRef.current) {
      const shouldAutoplay = isPlaying && currentlyPlayingId === videoId;
      const finalSrc = createIframeSrc(url, shouldAutoplay);
      iframeSrcRef.current = finalSrc;

      console.log("🎬 [VideoEmbed] Setting iframe src for", videoId.substring(0, 50) + "...:", {
        shouldAutoplay,
        finalSrc: finalSrc.substring(0, 100) + "...",
      });
    }
  }, [shouldLoad, hostedOnCDN, url, isPlaying, currentlyPlayingId, videoId]);

  // Error state
  if (hasError) return renderErrorState(className);

  // Thumbnail state (not loaded yet)
  if (!shouldLoad) return renderThumbnailState(className, platform, thumbnailUrl, handleClick, true);

  // CDN iframe rendering
  if (hostedOnCDN) {
    return renderCDNIframe(
      className,
      iframeSrcRef,
      isPlaying,
      currentlyPlayingId,
      videoId,
      url,
      isLoading,
      platform,
      thumbnailUrl,
      handleContentLoad,
      setHasError,
    );
  }

  // Direct video rendering
  if (contentLoaded) {
    return renderDirectVideo(className, url, handleContentLoad, setHasError);
  }

  // Fallback loading state
  return renderThumbnailState(className, platform, thumbnailUrl, handleClick, true);
});

export { VideoEmbed };
