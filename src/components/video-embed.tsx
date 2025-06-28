"use client";

import { useState, useEffect, memo } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Play } from "lucide-react";

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

// Helper function to get embed URL
const getEmbedUrl = (url: string, platform: string) => {
  if (platform === "tiktok") {
    const videoId = url.split("/").pop()?.split("?")[0];
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  } else {
    const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
    return `https://www.instagram.com/p/${postId}/embed/`;
  }
};

// Thumbnail placeholder component
const VideoThumbnail = ({
  platform,
  onClick,
  disableCard = false,
  title,
  author,
}: {
  platform: "tiktok" | "instagram";
  onClick: () => void;
  disableCard?: boolean;
  title?: string;
  author?: string;
}) => {
  const platformGradients = {
    tiktok: "from-pink-500 via-purple-500 to-indigo-500",
    instagram: "from-purple-500 via-pink-500 to-orange-500",
  } as const;

  const gradientClass =
    platform === "tiktok"
      ? platformGradients.tiktok
      : platform === "instagram"
        ? platformGradients.instagram
        : platformGradients.tiktok;

  // Debug logging
  console.log("🎬 [VideoThumbnail] Rendering with:", { platform, gradientClass, title, author });

  return (
    <motion.div
      className={`relative flex h-full w-full cursor-pointer items-center justify-center bg-gradient-to-br ${gradientClass} ${disableCard ? "" : "rounded-xl"}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Play button overlay */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="rounded-full bg-black/50 p-6 backdrop-blur-sm"
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0, 0, 0, 0.7)" }}
          whileTap={{ scale: 0.9 }}
        >
          <Play className="h-8 w-8 text-white" fill="white" />
        </motion.div>
      </motion.div>

      {/* Platform indicator */}
      <div className="absolute top-4 left-4">
        <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {platform.toUpperCase()}
        </div>
      </div>

      {/* Video info overlay */}
      {(title ?? author) && (
        <div className="absolute right-4 bottom-4 left-4">
          <div className="rounded-lg bg-black/50 p-3 backdrop-blur-sm">
            {title && <p className="line-clamp-2 text-sm font-medium text-white">{title}</p>}
            {author && <p className="text-xs text-white/80">@{author}</p>}
          </div>
        </div>
      )}

      {/* Shimmer effect */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
};

const VideoEmbedComponent = ({
  url,
  platform,
  hostedOnCDN,
  videoData,
  disableCard = false,
  lazyLoad = true,
  title,
  author,
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
  lazyLoad?: boolean;
  title?: string;
  author?: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazyLoad);
  const [isPlaying, setIsPlaying] = useState(false);

  // Debug logging
  console.log("🎥 [VideoEmbed]:", { platform, lazyLoad, shouldLoad, isLoading });

  // Handle click to load video
  const handleLoadVideo = () => {
    console.log("🔥 [VideoEmbed] Click detected");
    if (!shouldLoad) {
      setShouldLoad(true);
      setIsLoading(true);
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
    setIsPlaying(true);
  };

  const handleContentError = (error: Event | string) => {
    console.error("❌ [VIDEO_PLAYER] Content load error:", error);
    setHasError(true);
    setIsLoading(false);
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
      autoPlay={isPlaying}
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
      ) : !shouldLoad ? (
        <motion.div key="thumbnail">
          <VideoThumbnail
            platform={platform}
            onClick={handleLoadVideo}
            disableCard={disableCard}
            title={title}
            author={author}
          />
        </motion.div>
      ) : (
        <motion.div key="content" className="relative h-full w-full">
          {(isLoading || !contentLoaded) && (
            <motion.div key="loading" className="absolute inset-0 z-10">
              {renderLoadingState()}
            </motion.div>
          )}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: contentLoaded ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {getVideoContent(url, platform, hostedOnCDN, videoObjectUrl, renderIframeEmbed, renderVideoElement)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const VideoEmbed = memo(VideoEmbedComponent, (prevProps, nextProps) => {
  return (
    prevProps.url === nextProps.url &&
    prevProps.platform === nextProps.platform &&
    prevProps.hostedOnCDN === nextProps.hostedOnCDN &&
    prevProps.lazyLoad === nextProps.lazyLoad
  );
});

VideoEmbed.displayName = "VideoEmbed";
