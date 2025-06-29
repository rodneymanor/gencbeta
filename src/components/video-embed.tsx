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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Global playback state
  const { currentlyPlayingId, setCurrentlyPlaying } = useVideoPlayback();

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

  // Handle video click with useCallback to prevent re-creation
  const handleClick = useCallback(() => {
    if (hasError || shouldLoad) return;

    console.log("🔥 [VideoEmbed] Click detected - attempting to load video:", {
      url: url.substring(0, 50) + "...",
      platform,
      currentShouldLoad: shouldLoad,
      hostedOnCDN,
      hasVideoData: !!videoData,
    });

    // Start loading this video
    setShouldLoad(true);
    setIsLoading(true);

    // Set this video as currently playing (stops all others)
    setCurrentlyPlaying(videoId);
  }, [hasError, shouldLoad, url, platform, hostedOnCDN, videoData, videoId, setCurrentlyPlaying]);

  // Handle content load events
  const handleContentLoad = useCallback(() => {
    console.log("✅ [VideoEmbed] Content loaded!");
    setIsLoading(false);
    setContentLoaded(true);

    // Only start playing if this video is currently the active one
    if (currentlyPlayingId !== videoId) {
      console.log(
        "⏸️ [VideoEmbed] Content loaded but not starting - another video is playing:",
        (currentlyPlayingId ?? "none").substring(0, 50) + "...",
      );
      return;
    }

    // Start playback for video elements
    if (videoRef.current && !hostedOnCDN) {
      videoRef.current.play().catch((err) => console.error("🚫 [VideoEmbed] Video play failed:", err));
    }
  }, [currentlyPlayingId, videoId, hostedOnCDN]);

  // Effect to stop videos when another video starts playing
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

      // Note: We DON'T reset iframeSrcRef.current here to prevent reloads
      // The iframe will simply stop autoplaying when it's not the active video
    }
  }, [currentlyPlayingId, videoId, shouldLoad]);

  // Effect to clean up when component unmounts
  useEffect(() => {
    return () => {
      if (currentlyPlayingId === videoId) {
        console.log("🧹 [VideoEmbed] Cleanup - stopping video on unmount:", videoId.substring(0, 50) + "...");
        setCurrentlyPlaying(null);
      }
    };
  }, [currentlyPlayingId, videoId, setCurrentlyPlaying]);

  // Set iframe src only once when needed, never reset it
  useEffect(() => {
    if (shouldLoad && hostedOnCDN && !iframeSrcRef.current) {
      const shouldAutoplay = isPlaying && currentlyPlayingId === videoId;
      const finalSrc = shouldAutoplay ? `${url}${url.includes("?") ? "&" : "?"}autoplay=true` : url;

      iframeSrcRef.current = finalSrc;

      console.log("🎬 [VideoEmbed] Setting iframe src for", videoId.substring(0, 50) + "...:", {
        shouldAutoplay,
        finalSrc: finalSrc.substring(0, 100) + "...",
      });
    }
  }, [shouldLoad, hostedOnCDN, url, isPlaying, currentlyPlayingId, videoId]);

  // Don't render anything if there's an error
  if (hasError) {
    return (
      <div className={`relative flex aspect-[9/16] items-center justify-center rounded-lg bg-gray-100 ${className}`}>
        <p className="text-sm text-gray-500">Failed to load video</p>
      </div>
    );
  }

  // Show thumbnail if not loaded yet
  if (!shouldLoad) {
    return (
      <div className={`relative cursor-pointer ${className}`} onClick={handleClick}>
        <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClick} />
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClick} />
      </div>
    );
  }

  // Render iframe for CDN-hosted videos
  if (hostedOnCDN && iframeSrcRef.current) {
    return (
      <div className={`relative aspect-[9/16] overflow-hidden rounded-lg bg-black ${className}`}>
        <iframe
          ref={iframeRef}
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
      </div>
    );
  }

  // Render video element for direct video URLs
  if (contentLoaded) {
    return (
      <div className={`relative aspect-[9/16] overflow-hidden rounded-lg bg-black ${className}`}>
        <video
          ref={videoRef}
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
  }

  // Fallback loading state
  return (
    <div className={`relative ${className}`}>
      <VideoThumbnail platform={platform} thumbnailUrl={thumbnailUrl} onClick={handleClick} />
    </div>
  );
});

export { VideoEmbed };
