"use client";

import { useState, useEffect, memo } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { VideoLoadingOverlay } from "@/components/ui/page-loading";

// Helper function to determine which content to render
const getVideoContent = (
  url: string,
  platform: string,
  hostedOnCDN: boolean | undefined,
  videoObjectUrl: string | null,
  renderIframeEmbed: (src: string) => JSX.Element,
  renderVideoElement: (src: string) => JSX.Element,
) => {
  if (hostedOnCDN && url.includes("iframe.mediadelivery.net/embed")) {
    return renderIframeEmbed(url);
  }
  if (videoObjectUrl) {
    return renderVideoElement(videoObjectUrl);
  }
  if (hostedOnCDN && url.startsWith("http") && !url.includes("iframe.mediadelivery.net")) {
    return renderVideoElement(url);
  }
  return renderIframeEmbed(getEmbedUrl(url, platform));
};

const VideoEmbedComponent = ({
  url,
  platform,
  hostedOnCDN,
  videoData,
  disableCard = false,
}: {
  url: string;
  platform: "tiktok" | "instagram";
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  disableCard?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true);
    setContentLoaded(false);
    setHasError(false);

    if (videoData && !hostedOnCDN) {
      try {
        const uint8Array = new Uint8Array(videoData.buffer);
        const blob = new Blob([uint8Array], { type: videoData.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setVideoObjectUrl(objectUrl);
        // Don't set loading to false here - wait for video load event

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
    // For other video types, we'll rely on load events from iframe/video elements
  }, [url, hostedOnCDN, videoData]);

  // Handle content loading completion
  const handleContentLoad = () => {
    setContentLoaded(true);
    setIsLoading(false);
  };

  const handleContentError = (error: Event | string) => {
    console.error("❌ [VIDEO_PLAYER] Content load error:", error);
    setHasError(true);
    setIsLoading(false);
  };

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "tiktok") {
      const videoId = url.split("/").pop()?.split("?")[0];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    } else {
      const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
      return `https://www.instagram.com/p/${postId}/embed/`;
    }
  };

  const renderLoadingState = () => <VideoLoadingOverlay disableCard={disableCard} />;

  const renderErrorState = () => (
    <motion.div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 ${disableCard ? "" : "rounded-xl"}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="space-y-4 text-center">
        <motion.div
          className="text-4xl text-white"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚠️
        </motion.div>
        <p className="text-sm text-white">Failed to load video</p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
            }}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Retry
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );

  const renderIframeEmbed = (src: string) => (
    <motion.iframe
      src={src}
      className={`h-full w-full ${disableCard ? "" : "rounded-xl"}`}
      frameBorder="0"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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

  const renderVideoElement = (src: string) => (
    <motion.video
      src={src}
      className={`h-full w-full object-cover ${disableCard ? "" : "rounded-xl"}`}
      controls
      muted
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
    <AnimatePresence mode="wait">
      {hasError ? (
        <motion.div key="error">{renderErrorState()}</motion.div>
      ) : (
        <motion.div key="content" className="relative h-full w-full">
          {/* Always show loading overlay until content is actually loaded */}
          {(isLoading || !contentLoaded) && (
            <motion.div key="loading" className="absolute inset-0 z-10">
              {renderLoadingState()}
            </motion.div>
          )}

          {/* Content layer - hidden until fully loaded */}
          <div className="relative h-full w-full">
            {getVideoContent(url, platform, hostedOnCDN, videoObjectUrl, renderIframeEmbed, renderVideoElement)}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const VideoEmbed = memo(VideoEmbedComponent);
VideoEmbed.displayName = "VideoEmbed";
