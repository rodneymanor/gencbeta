"use client";

import { useState, memo, useCallback } from "react";

import { Clock, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoEmbed } from "@/components/video-embed";

import type { VideoWithPlayer } from "./collections-helpers";
import {
  ComingSoonModal,
  ManagementModeSelection,
  ReprocessVideoOverlay,
  PlatformBadge,
  HoverActions,
  getVideoUrl,
} from "./video-card-components";
import { VideoInsightsDashboard } from "./video-insights-dashboard";

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
  isPlaying?: boolean;
  onPlay?: (videoId: string) => void;
  hasHLSIssue?: boolean;
  onHLSIssue?: (issueType: string) => void;
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

// Helper function to build card className
const buildCardClassName = (
  baseClassName: string,
  isSelected: boolean,
  isDeleting: boolean,
  hasHLSIssue: boolean
) => {
  const classes = [
    baseClassName,
    isSelected ? "ring-2 ring-primary shadow-md" : "",
    isDeleting ? "opacity-50 pointer-events-none" : "",
    hasHLSIssue ? "ring-2 ring-yellow-400" : "",
  ];
  return classes.filter(Boolean).join(" ");
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
    isPlaying = false,
    onPlay,
    hasHLSIssue = false,
    onHLSIssue,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);

    // Debug: Log when VideoCard component renders
    console.log("🔍 [VideoCard] Component rendered with video:", video);
    console.log("🔍 [VideoCard] Video ID:", video.id);
    console.log("🔍 [VideoCard] Video title:", video.title);
    console.log("🔍 [VideoCard] Video metrics:", video.metrics);
    console.log("🔍 [VideoCard] Video metadata:", video.metadata);

    const baseClassName = `w-[240px] p-3 rounded-xl group relative transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border ${className}`;
    const cardClassName = buildCardClassName(baseClassName, isSelected, isDeleting, hasHLSIssue);

    const showActions = (isHovered || isManageMode) && !isDeleting;

    const handlePlay = useCallback(() => {
      if (onPlay && video.id) {
        onPlay(video.id);
      }
    }, [onPlay, video.id]);

    const handleHLSIssue = useCallback((issueType: string) => {
      onHLSIssue?.(issueType);
    }, [onHLSIssue]);

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
            <VideoEmbed
              url={getVideoUrl(video as LegacyVideo)}
              videoId={video.id}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              preload={true}
              className="absolute inset-0 h-full w-full"
            />

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

            {/* Playing Indicator */}
            {isPlaying && (
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-primary text-primary-foreground text-xs">
                  Playing
                </Badge>
              </div>
            )}

            {/* HLS Issue Indicator */}
            {hasHLSIssue && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-yellow-500 text-white text-xs">
                  HLS Issue
                </Badge>
              </div>
            )}

            {/* Hover Actions */}
            <HoverActions showActions={showActions} onDelete={onDelete} />
          </div>

          {/* Action Buttons */}
          <div className="mt-3">
            <div className="flex gap-2">
              {/* Insights Button */}
              <VideoInsightsDashboard video={video}>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-border/60 hover:bg-accent/50 h-8 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                  Insights
                </Button>
              </VideoInsightsDashboard>

              {/* Repurpose Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowRepurposeModal(true)}
                className="flex-1 border-border/60 hover:bg-accent/50 h-8 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Repurpose
              </Button>
            </div>
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
      prevProps.isReprocessing === nextProps.isReprocessing &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.hasHLSIssue === nextProps.hasHLSIssue
    );
  },
);

VideoCard.displayName = "VideoCard";
