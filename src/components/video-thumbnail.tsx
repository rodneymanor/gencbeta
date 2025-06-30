"use client";

import Image from "next/image";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

// Clean VideoThumbnail component - no duplicate badges or iframe labels
export const VideoThumbnail = ({
  platform,
  thumbnailUrl,
  onClick,
  disableCard = false,
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

  // Only log critical thumbnail issues in development
  if (!thumbnailUrl && process.env.NODE_ENV === "development") {
    console.warn("⚠️ [VideoThumbnail] No thumbnail provided for", platform);
  }

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
      {/* Thumbnail Image */}
      {thumbnailUrl && (
        <>
          <Image
            src={thumbnailUrl}
            alt="Video thumbnail"
            width={360}
            height={640}
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={true}
            onError={(e) => {
              console.warn("🖼️ [VideoThumbnail] Image failed to load:", thumbnailUrl.substring(0, 50));
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </>
      )}

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

      {/* Shimmer effect - only show on gradients when no thumbnail */}
      {!thumbnailUrl && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </motion.div>
  );
};
