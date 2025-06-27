"use client";

import { useState, useEffect, memo } from "react";

import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    if (videoData && !hostedOnCDN) {
      try {
        const uint8Array = new Uint8Array(videoData.buffer);
        const blob = new Blob([uint8Array], { type: videoData.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setVideoObjectUrl(objectUrl);
        setIsLoading(false);

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
    } else if (hostedOnCDN || url.startsWith("http")) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [url, hostedOnCDN, videoData]);

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "tiktok") {
      const videoId = url.split("/").pop()?.split("?")[0];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    } else {
      const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
      return `https://www.instagram.com/p/${postId}/embed/`;
    }
  };

  const renderLoadingState = () => (
    <motion.div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${disableCard ? "" : "rounded-xl"}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="space-y-4 text-center">
        <motion.div
          className="mx-auto h-12 w-12 rounded-full border-b-2 border-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.p
          className="text-sm text-white"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading video...
        </motion.p>
      </div>
    </motion.div>
  );

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
      onError={(e) => {
        console.error("❌ [VIDEO_PLAYER] Iframe playback error:", e);
        setHasError(true);
      }}
      style={{
        backgroundColor: "black",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
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
      onError={(e) => {
        console.error("❌ [VIDEO_PLAYER] Video playback error:", e);
        setHasError(true);
      }}
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
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div key="loading">{renderLoadingState()}</motion.div>
      ) : hasError ? (
        <motion.div key="error">{renderErrorState()}</motion.div>
      ) : (
        <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {/* Handle iframe URLs (like Bunny Stream) - CHECK THIS FIRST! */}
          {hostedOnCDN && url.includes("iframe.mediadelivery.net/embed")
            ? renderIframeEmbed(url)
            : videoObjectUrl
              ? renderVideoElement(videoObjectUrl)
              : hostedOnCDN && url.startsWith("http") && !url.includes("iframe.mediadelivery.net")
                ? renderVideoElement(url)
                : renderIframeEmbed(getEmbedUrl(url, platform))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const VideoEmbed = memo(VideoEmbedComponent);
VideoEmbed.displayName = "VideoEmbed";
