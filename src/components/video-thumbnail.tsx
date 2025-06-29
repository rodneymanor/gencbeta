"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

// Helper component for thumbnail image
const ThumbnailImage = ({ thumbnailUrl, title }: { thumbnailUrl: string; title?: string }) => (
  <div className="absolute inset-0">
    <Image
      src={thumbnailUrl}
      alt={title ?? "Video thumbnail"}
      width={360}
      height={640}
      className="h-full w-full object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      onError={(e) => {
        console.log("🖼️ [VideoThumbnail] Image failed to load, hiding...");
        e.currentTarget.style.display = "none";
      }}
    />
    {/* Gradient overlay for better contrast */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
  </div>
);

// Helper component for play button
const PlayButton = () => (
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
);

// Helper component for platform indicator
const PlatformIndicator = ({ platform }: { platform: string }) => (
  <div className="absolute top-4 left-4">
    <div className="rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
      {platform.toUpperCase()}
    </div>
  </div>
);

// Helper component for video info overlay
const VideoInfoOverlay = ({ title, author }: { title?: string; author?: string }) => {
  if (!title && !author) return null;

  return (
    <div className="absolute right-4 bottom-4 left-4">
      <div className="rounded-lg bg-black/50 p-3 backdrop-blur-sm">
        {title && <p className="line-clamp-2 text-sm font-medium text-white">{title}</p>}
        {author && <p className="text-xs text-white/80">@{author}</p>}
      </div>
    </div>
  );
};

// Helper function for debug logging (extracted to reduce complexity)
const logThumbnailDebugInfo = (thumbnailUrl: string | undefined, platform: string) => {
  if (!thumbnailUrl) {
    console.log("🎬 [VideoThumbnail] No thumbnail - using gradient:", {
      platform,
      type: "Gradient placeholder",
      isRealThumbnail: false,
    });
    return;
  }

  if (thumbnailUrl.startsWith("data:image/svg+xml")) {
    try {
      const base64Data = thumbnailUrl.split(",")[1];
      const decodedSvg = atob(base64Data);
      console.log("🎬 [VideoThumbnail] SVG placeholder detected:", {
        platform,
        type: "SVG placeholder",
        content: decodedSvg.substring(0, 200) + "...",
        isRealThumbnail: false,
      });
    } catch {
      console.log("🎬 [VideoThumbnail] SVG decode failed:", {
        platform,
        thumbnailUrl: thumbnailUrl.substring(0, 100) + "...",
      });
    }
    return;
  }

  if (thumbnailUrl.startsWith("data:image/jpeg") || thumbnailUrl.startsWith("data:image/png")) {
    console.log("🎬 [VideoThumbnail] Real image thumbnail:", {
      platform,
      type: thumbnailUrl.startsWith("data:image/jpeg") ? "JPEG" : "PNG",
      size: `${Math.round(thumbnailUrl.length / 1024)}KB`,
      isRealThumbnail: true,
      previewUrl: thumbnailUrl.substring(0, 100) + "...",
    });
    return;
  }

  if (thumbnailUrl.startsWith("http")) {
    console.log("🎬 [VideoThumbnail] HTTP thumbnail URL:", {
      platform,
      type: "HTTP URL",
      url: thumbnailUrl,
      isRealThumbnail: true,
    });
    return;
  }

  console.log("🎬 [VideoThumbnail] Unknown thumbnail format:", {
    platform,
    type: "Unknown",
    preview: thumbnailUrl.substring(0, 100) + "...",
    isRealThumbnail: "unknown",
  });
};

// Main VideoThumbnail component
export const VideoThumbnail = ({
  platform,
  thumbnailUrl,
  onClick,
  disableCard = false,
  title,
  author,
}: {
  platform: "tiktok" | "instagram";
  thumbnailUrl?: string;
  onClick: () => void;
  disableCard?: boolean;
  title?: string;
  author?: string;
}) => {
  const platformGradients = {
    tiktok: "from-pink-500 via-purple-500 to-indigo-500",
    instagram: "from-purple-500 via-pink-500 to-orange-500",
  } as const;

  const gradientClass = platform === "tiktok" ? platformGradients.tiktok : platformGradients.instagram;

  // Enhanced debug logging
  logThumbnailDebugInfo(thumbnailUrl, platform);

  return (
    <motion.div
      className={`relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden ${disableCard ? "" : "rounded-xl"} ${
        thumbnailUrl ? "bg-black" : `bg-gradient-to-br ${gradientClass}`
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Actual thumbnail image or gradient background */}
      {thumbnailUrl && <ThumbnailImage thumbnailUrl={thumbnailUrl} title={title} />}

      {/* Play button overlay */}
      <PlayButton />

      {/* Platform indicator */}
      <PlatformIndicator platform={platform} />

      {/* Video info overlay */}
      <VideoInfoOverlay title={title} author={author} />

      {/* Shimmer effect - only show on gradients */}
      {!thumbnailUrl && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </motion.div>
  );
};
