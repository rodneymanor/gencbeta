"use client";

import { useState, useEffect, memo, useRef } from "react";

import { motion } from "framer-motion";

import { useVideoPlayback } from "@/contexts/video-playback-context";

import { VideoLoadingOverlay } from "./ui/page-loading";
import { getVideoContent, getEmbedUrl, VideoErrorDisplay } from "./video-embed-helpers";
import { VideoThumbnail } from "./video-thumbnail";

const VideoEmbedComponent = ({
  url,
  platform,
  thumbnailUrl,
  hostedOnCDN,
  videoData,
  disableCard = false,
  lazyLoad = true,
  title,
  author,
}: {
  url: string;
  platform: "tiktok" | "instagram";
  thumbnailUrl?: string;
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  disableCard?: boolean;
  lazyLoad?: boolean;
  title?: string;
  author?: string;
}) => {
  // Generate unique video ID based on URL
  const videoId = url;

  // Global video playback management
  const { currentlyPlayingId, setCurrentlyPlaying, isPlaying: isGloballyPlaying } = useVideoPlayback();

  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
  const [isLoading, setIsLoading] = useState(false);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local playing state derived from global state
  const isPlaying = isGloballyPlaying(videoId);

  // Debug logging
  console.log("🎥 [VideoEmbed] Render:", {
    url: url.substring(0, 50) + "...",
    platform,
    shouldLoad,
    isLoading,
    contentLoaded,
    hasError,
    isPlaying,
    currentlyPlayingId: currentlyPlayingId?.substring(0, 30) + "...",
  });

  // Handle click to load video
  const handleLoadVideo = () => {
    console.log("🔥 [VideoEmbed] Click detected - attempting to load video:", {
      url,
      platform,
      currentShouldLoad: shouldLoad,
      hostedOnCDN,
      hasVideoData: Boolean(videoData),
    });
    if (!shouldLoad) {
      setShouldLoad(true);
      setIsLoading(true);
      setCurrentlyPlaying(videoId);
    } else {
      console.log("⚠️ [VideoEmbed] Video already loading or loaded");
    }
  };

  useEffect(() => {
    if (!shouldLoad) return;

    setIsLoading(true);
    setContentLoaded(false);
    setHasError(false);

    if (videoData && !hostedOnCDN) {
      try {
        const uint8Array = new Uint8Array(videoData.buffer);
        const blob = new Blob([uint8Array], { type: videoData.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setVideoObjectUrl(objectUrl);

        return () => {
          if (objectUrl && objectUrl.startsWith("blob:")) {
            URL.revokeObjectURL(objectUrl);
          }
        };
      } catch (error) {
        console.error("❌ [VIDEO_PLAYER] Failed to create video blob:", error);
        setHasError(true);
        setIsLoading(false);
      }
    }
  }, [url, hostedOnCDN, videoData, shouldLoad]);

  const handleContentLoad = () => {
    console.log("✅ [VideoEmbed] Content loaded!");
    setContentLoaded(true);
    setIsLoading(false);

    // Only start playing if this video is still the currently selected one
    if (isPlaying && videoRef.current && currentlyPlayingId === videoId) {
      console.log(`▶️ [VideoEmbed] Starting playback for ${videoId.substring(0, 30)}...`);
      videoRef.current.play().catch((error) => {
        console.warn("⚠️ [VideoEmbed] Autoplay failed (may require user interaction):", error);
      });
    } else if (currentlyPlayingId !== videoId) {
      console.log(
        `⏸️ [VideoEmbed] Content loaded but not starting - another video is playing: ${currentlyPlayingId?.substring(0, 30)}...`,
      );
    }
  };

  const handleContentError = (error: unknown) => {
    console.error("❌ [VIDEO_PLAYER] Content load error:", error);
    setHasError(true);
    setIsLoading(false);
  };

  // Handle when another video starts playing - stop this one
  useEffect(() => {
    if (currentlyPlayingId && currentlyPlayingId !== videoId) {
      console.log(`🛑 [VideoEmbed] Stopping video (another video started):`, {
        thisVideo: videoId.substring(0, 30) + "...",
        currentlyPlaying: currentlyPlayingId.substring(0, 30) + "...",
      });

      // For video elements, stop programmatically and prevent restart
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        console.log(`🛑 [VideoEmbed] Video ${videoId.substring(0, 30)}... successfully stopped`);
      }

      // For iframe videos (TikTok, etc.), they will automatically stop
      // because autoplay will be false when re-rendered
    }
  }, [currentlyPlayingId, videoId]);

  // Cleanup: stop video when component unmounts
  useEffect(() => {
    return () => {
      if (currentlyPlayingId === videoId) {
        console.log(`🧹 [VideoEmbed] Cleanup - stopping video on unmount:`, videoId.substring(0, 30) + "...");
        setCurrentlyPlaying(null);
      }
    };
  }, [currentlyPlayingId, videoId, setCurrentlyPlaying]);

  const renderIframeEmbed = (src: string) => {
    // Add autoplay parameter for Bunny.net videos when user clicked to play
    const autoplaySrc =
      isPlaying && src.includes("iframe.mediadelivery.net")
        ? `${src}${src.includes("?") ? "&" : "?"}autoplay=true`
        : src;

    return (
      <motion.iframe
        src={autoplaySrc}
        className={`h-full w-full ${disableCard ? "" : "rounded-xl"}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleContentLoad}
        onError={handleContentError}
        style={{
          backgroundColor: "black",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: contentLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />
    );
  };

  const renderVideoElement = (src: string) => (
    <motion.video
      ref={videoRef}
      src={src}
      className={`h-full w-full object-cover ${disableCard ? "" : "rounded-xl"}`}
      controls
      loop
      playsInline
      onLoadedData={handleContentLoad}
      onError={handleContentError}
      style={{
        backgroundColor: "black",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: contentLoaded ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    />
  );

  return (
    <div className="relative h-full w-full">
      {hasError ? (
        <VideoErrorDisplay
          disableCard={disableCard}
          onRetry={() => {
            setHasError(false);
            setIsLoading(true);
          }}
        />
      ) : !shouldLoad ? (
        <VideoThumbnail
          platform={platform}
          thumbnailUrl={thumbnailUrl}
          onClick={handleLoadVideo}
          disableCard={disableCard}
          title={title}
          author={author}
        />
      ) : (
        <>
          {/* Loading overlay - only show when loading */}
          {(isLoading || !contentLoaded) && (
            <div className="pointer-events-none absolute inset-0 z-20">
              <VideoLoadingOverlay disableCard={disableCard} />
            </div>
          )}

          {/* Video content - ensure it's above any thumbnail elements */}
          <div className="absolute inset-0 z-10 bg-black">
            {getVideoContent(url, platform, hostedOnCDN, videoObjectUrl, renderIframeEmbed, renderVideoElement)}
          </div>
        </>
      )}
    </div>
  );
};

const VideoEmbedWrapper = ({
  url,
  platform,
  thumbnailUrl,
  hostedOnCDN,
  videoData,
  disableCard = false,
  lazyLoad = true,
  title,
  author,
}: {
  url: string;
  platform: "tiktok" | "instagram";
  thumbnailUrl?: string;
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  disableCard?: boolean;
  lazyLoad?: boolean;
  title?: string;
  author?: string;
}) => {
  return (
    <VideoEmbedComponent
      url={url}
      platform={platform}
      thumbnailUrl={thumbnailUrl}
      hostedOnCDN={hostedOnCDN}
      videoData={videoData}
      disableCard={disableCard}
      lazyLoad={lazyLoad}
      title={title}
      author={author}
    />
  );
};

export const VideoEmbed = memo(VideoEmbedWrapper, (prevProps, nextProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.platform === nextProps.platform &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    prevProps.hostedOnCDN === nextProps.hostedOnCDN &&
    prevProps.lazyLoad === nextProps.lazyLoad
  );
});

VideoEmbed.displayName = "VideoEmbed";
