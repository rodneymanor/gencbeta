"use client";

import React, { memo } from "react";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoPlayer } from "@/components/video-player";
import { useAuth } from "@/contexts/auth-context";

interface VideoCardProps {
  video: {
    id?: string;
    url: string;
    platform: string;
    title: string;
    author: string;
    thumbnailUrl?: string;
    hostedOnCDN?: boolean;
    videoData?: {
      buffer: number[];
      size: number;
      mimeType: string;
      filename: string;
    };
    insights: {
      views: number;
      likes: number;
      comments: number;
      shares?: number;
    };
  };
  manageMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
}

// Helper component for checkbox
const SelectionCheckbox = ({
  isSelected,
  onToggleSelection,
}: {
  isSelected: boolean;
  onToggleSelection: () => void;
}) => (
  <motion.div
    className="absolute top-2 left-2 z-10"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
  >
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelection}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-5 w-5 border-2 bg-white/90 backdrop-blur-sm"
      />
    </motion.div>
  </motion.div>
);

// Helper component for delete button
const DeleteButton = ({ onDelete, isDeleting }: { onDelete: () => void; isDeleting: boolean }) => (
  <motion.div
    className="absolute top-2 right-2 z-10"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2, delay: 0.1 }}
  >
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 rounded-full bg-red-500/90 p-0 text-white backdrop-blur-sm transition-all duration-200 hover:bg-red-600"
        onClick={onDelete}
        disabled={isDeleting}
      >
        <motion.div animate={isDeleting ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 0.5 }}>
          <Trash2 className="h-4 w-4" />
        </motion.div>
      </Button>
    </motion.div>
  </motion.div>
);

// eslint-disable-next-line complexity
const VideoCardComponent = ({
  video,
  manageMode,
  isSelected,
  isDeleting,
  onToggleSelection,
  onDelete,
}: VideoCardProps) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";

  return (
    <motion.div
      className={`relative mx-auto w-full max-w-sm transition-all duration-300 ease-in-out ${
        isDeleting ? "pointer-events-none" : ""
      } ${manageMode && isSelected ? "ring-primary ring-2 ring-offset-2" : ""}`}
      animate={{
        opacity: isDeleting ? 0 : 1,
        scale: isDeleting ? 0.95 : 1,
        y: isDeleting ? 10 : 0,
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      layout
    >
      {/* Use VideoPlayer Component with its own card */}
      <VideoPlayer
        videoUrl={video.url}
        platform={video.platform as "tiktok" | "instagram"}
        thumbnailUrl={video.thumbnailUrl}
        metrics={{
          views: video.insights.views,
          likes: video.insights.likes,
          comments: video.insights.comments,
          shares: video.insights.shares ?? 0,
        }}
        insights={{
          reach: video.insights.views * 1.2, // Estimate
          impressions: video.insights.views * 1.5, // Estimate
          engagementRate: ((video.insights.likes + video.insights.comments) / video.insights.views) * 100,
          topHours: ["18:00", "19:00", "20:00"], // Placeholder
          demographics: [
            { ageGroup: "18-24", percentage: 35 },
            { ageGroup: "25-34", percentage: 40 },
            { ageGroup: "35-44", percentage: 25 },
          ],
          growthRate: 15.2, // Placeholder
        }}
        title={video.title}
        author={video.author}
        hostedOnCDN={video.hostedOnCDN}
        videoData={video.videoData}
        className="h-full w-full"
      />

      {manageMode && isAdmin && (
        <>
          <SelectionCheckbox isSelected={isSelected} onToggleSelection={onToggleSelection} />
          <DeleteButton onDelete={onDelete} isDeleting={isDeleting} />
        </>
      )}
    </motion.div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const VideoCard = memo(VideoCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal performance
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.manageMode === nextProps.manageMode &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDeleting === nextProps.isDeleting
  );
});
