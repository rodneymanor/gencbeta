"use client";

import { useState, memo } from "react";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { VideoEmbed } from "@/components/video-embed";

import type { VideoWithPlayer } from "./collections-helpers";
import {
  ComingSoonModal,
  ManagementModeSelection,
  ReprocessVideoOverlay,
  PlatformBadge,
  HoverActions,
  ActionButtons,
  getVideoUrl,
} from "./video-card-components";

// Legacy video type for backward compatibility
type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

interface VideoCardProps {
  video: VideoWithPlayer;
  isManageMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  isReprocessing?: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
  onReprocess?: (video: VideoWithPlayer) => void;
  className?: string;
}

const DurationBadge = ({ duration }: { duration?: number }) => {
  if (!duration) return null;

  return (
    <div className="absolute right-3 bottom-3 z-10">
      <Badge
        variant="secondary"
        className="bg-background/90 text-foreground border-border/60 flex items-center gap-1 text-xs font-medium shadow-sm backdrop-blur-sm"
      >
        <Clock className="h-3 w-3" />
        {Math.round(duration)}s
      </Badge>
    </div>
  );
};

export const VideoCard = memo<VideoCardProps>(
  ({
    video,
    isManageMode,
    isSelected,
    isDeleting,
    isReprocessing,
    onToggleSelection,
    onDelete,
    onReprocess,
    className = "",
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);

    // Debug: Log when VideoCard component renders
    console.log("🔍 [VideoCard] Component rendered with video:", video);
    console.log("🔍 [VideoCard] Video ID:", video.id);
    console.log("🔍 [VideoCard] Video title:", video.title);
    console.log("🔍 [VideoCard] Video metrics:", video.metrics);
    console.log("🔍 [VideoCard] Video metadata:", video.metadata);

    const cardClassName = `w-[240px] p-3 rounded-xl group relative transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border ${className} ${
      isSelected ? "ring-2 ring-primary shadow-md" : ""
    } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`;

    const showActions = (isHovered || isManageMode) && !isDeleting;

    return (
      <>
        <Card
          className={cardClassName}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Management Mode Selection */}
          <ManagementModeSelection
            isManageMode={isManageMode}
            isSelected={isSelected}
            onToggleSelection={onToggleSelection}
            videoTitle={video.title}
          />

          {/* Video Content */}
          <div className="bg-muted/30 relative aspect-[9/16] overflow-hidden rounded-lg">
            <VideoEmbed url={getVideoUrl(video as LegacyVideo)} className="absolute inset-0 h-full w-full" />

            {/* Reprocess Video Overlay for Legacy Videos */}
            {onReprocess && (
              <ReprocessVideoOverlay
                video={video as LegacyVideo}
                onReprocess={onReprocess}
                onDelete={onDelete}
                isReprocessing={isReprocessing}
              />
            )}

            {/* Platform Badge */}
            <PlatformBadge platform={video.platform} />

            {/* Duration Badge */}
            <DurationBadge duration={video.duration} />

            {/* Hover Actions */}
          </div>

          {/* Action Buttons */}
          <div className="mt-3">
            <ActionButtons video={video} />
          </div>
        </Card>

        {/* Coming Soon Modal for Repurpose */}
        <ComingSoonModal
          isOpen={showRepurposeModal}
          onClose={() => setShowRepurposeModal(false)}
          title="Content Repurposing"
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.video.id === nextProps.video.id &&
      prevProps.isManageMode === nextProps.isManageMode &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.isReprocessing === nextProps.isReprocessing
    );
  },
);

VideoCard.displayName = "VideoCard";
