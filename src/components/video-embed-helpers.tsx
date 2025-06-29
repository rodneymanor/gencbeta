"use client";

import { motion } from "framer-motion";

import { Button } from "./ui/button";

// Helper function to determine which content to render
export const getVideoContent = (
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
export const getEmbedUrl = (url: string, platform: string) => {
  if (platform === "tiktok") {
    const videoId = url.split("/").pop()?.split("?")[0];
    return `https://www.tiktok.com/embed/v2/${videoId}`;
  } else {
    const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
    return `https://www.instagram.com/p/${postId}/embed/`;
  }
};

// Error display component
export const VideoErrorDisplay = ({ disableCard, onRetry }: { disableCard: boolean; onRetry: () => void }) => (
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
          onClick={onRetry}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          Retry
        </Button>
      </motion.div>
    </div>
  </motion.div>
);
