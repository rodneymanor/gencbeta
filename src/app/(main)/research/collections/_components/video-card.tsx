"use client";

import { useState, memo, useCallback, useMemo } from "react";

import { Clock, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VideoEmbed } from "@/components/video-embed";
import type { Collection } from "@/lib/collections";

import type { VideoWithPlayer } from "./collections-helpers";
import { SingleVideoMoveCopyDialog } from "./single-video-move-copy-dialog";
import {
  ComingSoonModal,
  ManagementModeSelection,
  ReprocessVideoOverlay,
  PlatformBadge,
  HoverActions,
  getVideoUrl,
  getThumbnailUrl,
} from "./video-card-components";
import { VideoInsightsDashboard } from "./video-insights-dashboard";

// Legacy video type for backward compatibility
type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

interface VideoCardProps {
  video: VideoWithPlayer;
  collections?: Collection[];
  currentCollectionId?: string | null;
  isManageMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  isReprocessing?: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
  onReprocess?: (video: VideoWithPlayer) => void;
  onVideoUpdated?: () => void;
  className?: string;
  isPlaying?: boolean;
  onPlay?: (videoId: string) => void;
  hasHLSIssue?: boolean;
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
const buildCardClassName = (baseClassName: string, isSelected: boolean, isDeleting: boolean, hasHLSIssue: boolean) => {
  const classes = [
    baseClassName,
    isSelected ? "ring-2 ring-primary shadow-md" : "",
    isDeleting ? "opacity-50 pointer-events-none" : "",
    hasHLSIssue ? "ring-2 ring-yellow-400" : "",
  ];
  return classes.filter(Boolean).join(" ");
};

/* eslint-disable complexity */
export const VideoCard = memo<VideoCardProps>(
  ({
    video,
    collections = [],
    currentCollectionId,
    isManageMode,
    isSelected,
    isDeleting,
    isReprocessing,
    onToggleSelection,
    onDelete,
    onReprocess,
    onVideoUpdated,
    className = "",
    isPlaying = false,
    onPlay,
    hasHLSIssue = false,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [showCopyDialog, setShowCopyDialog] = useState(false);

    // Firefox detection - disable preloading for Firefox
    const isFirefox = useMemo(() => navigator.userAgent.includes("Firefox"), []);
    const effectivePreload = isFirefox ? false : true;

    const baseClassName = `w-[240px] p-3 rounded-xl group relative transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border ${className}`;
    const cardClassName = buildCardClassName(baseClassName, isSelected, isDeleting, hasHLSIssue);

    const showActions = (isHovered || isManageMode) && !isDeleting;

    const handlePlay = useCallback(() => {
      if (!isPlaying && video.id) {
        console.log("🎬 [VideoCard] Direct play request");
        onPlay?.(video.id);
      } else if (isPlaying) {
        console.log("⏸️ [VideoCard] Video already playing");
      }
    }, [isPlaying, onPlay, video.id]);

    const thumbnailUrl = getThumbnailUrl(video);

    return (
      <>
        <Card
          className={cardClassName}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Video Content */}
          <div className="bg-muted/30 relative aspect-[9/16] overflow-hidden rounded-lg">
            <VideoEmbed
              url={getVideoUrl(video as LegacyVideo)}
              videoId={video.id}
              isPlaying={isPlaying}
              onPlay={handlePlay}
              preload={effectivePreload}
              thumbnailUrl={thumbnailUrl ?? undefined}
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

            {/* HLS Issue Indicator */}
            {hasHLSIssue && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-yellow-500 text-xs text-white">HLS Issue</Badge>
              </div>
            )}

            {/* Management Mode Selection - Only show when in manage mode */}
            {isManageMode && (
              <ManagementModeSelection
                isManageMode={isManageMode}
                isSelected={isSelected}
                onToggleSelection={onToggleSelection}
                videoTitle={video.title}
              />
            )}

            {/* Hover Actions - Only show when NOT in manage mode */}
            {!isManageMode && (
              <HoverActions
                showActions={showActions}
                onDelete={onDelete}
                onMoveVideo={collections.length > 0 ? () => setShowMoveDialog(true) : undefined}
                onCopyVideo={collections.length > 0 ? () => setShowCopyDialog(true) : undefined}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-3">
            <div className="flex gap-2">
              {/* Insights Button */}
              <VideoInsightsDashboard video={video}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border/60 hover:bg-accent/50 h-8 flex-1 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
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
                className="border-border/60 hover:bg-accent/50 h-8 flex-1 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Repurpose
              </Button>
            </div>
          </div>
        </Card>

        {/* Repurpose Modal */}
        <ComingSoonModal
          isOpen={showRepurposeModal}
          onClose={() => setShowRepurposeModal(false)}
          title="Video Repurposing"
        />

        {/* Move Video Dialog */}
        {showMoveDialog && video.id && (
          <SingleVideoMoveCopyDialog
            collections={collections}
            videoId={video.id}
            videoTitle={video.title}
            currentCollectionId={currentCollectionId ?? null}
            onCompleted={() => {
              setShowMoveDialog(false);
              onVideoUpdated?.();
            }}
          >
            <div style={{ display: "none" }} />
          </SingleVideoMoveCopyDialog>
        )}

        {/* Copy Video Dialog */}
        {showCopyDialog && video.id && (
          <SingleVideoMoveCopyDialog
            collections={collections}
            videoId={video.id}
            videoTitle={video.title}
            currentCollectionId={currentCollectionId ?? null}
            onCompleted={() => {
              setShowCopyDialog(false);
              onVideoUpdated?.();
            }}
          >
            <div style={{ display: "none" }} />
          </SingleVideoMoveCopyDialog>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.video.id === nextProps.video.id &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isDeleting === nextProps.isDeleting &&
      prevProps.hasHLSIssue === nextProps.hasHLSIssue
    );
  },
);

VideoCard.displayName = "VideoCard";
