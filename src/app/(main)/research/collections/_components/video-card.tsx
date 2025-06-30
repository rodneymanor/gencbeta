"use client";

import { useState, memo } from "react";

import { MoreVertical, Trash2, ExternalLink, Clock, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoEmbed } from "@/components/video-embed";

import type { VideoWithPlayer } from "./collections-helpers";

// Legacy video type for backward compatibility
type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

// Helper function to get the correct video URL
const getVideoUrl = (video: LegacyVideo): string => {
  console.log("🔍 [VideoCard] Video data:", {
    id: video.id,
    iframeUrl: video.iframeUrl,
    url: video.url,
    originalUrl: video.originalUrl
  });

  // Priority order: iframeUrl -> legacy url (if Bunny) -> originalUrl -> empty
  if (video.iframeUrl) {
    console.log("✅ [VideoCard] Using iframeUrl:", video.iframeUrl);
    return video.iframeUrl;
  }
  
  if (video.url && video.url.includes('iframe.mediadelivery.net')) {
    console.log("✅ [VideoCard] Using legacy Bunny URL:", video.url);
    return video.url;
  }
  
  if (video.originalUrl) {
    console.log("⚠️ [VideoCard] Falling back to originalUrl (will be rejected):", video.originalUrl);
    return video.originalUrl;
  }
  
  console.log("❌ [VideoCard] No valid URL found - returning empty string");
  return '';
};

interface VideoCardProps {
  video: VideoWithPlayer;
  isManageMode: boolean;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelection: () => void;
  onDelete: () => void;
  className?: string;
}

// Coming Soon Modal Component
const ComingSoonModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="border-border/60 shadow-lg sm:max-w-md">
      <DialogHeader className="space-y-3 text-center">
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        <DialogDescription className="text-muted-foreground leading-relaxed">
          This feature is coming soon! We&apos;re working hard to bring you powerful video analysis and content
          repurposing tools.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center pt-4">
        <Button onClick={onClose} className="shadow-xs transition-all duration-200 hover:shadow-sm">
          Got it
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// Video actions dropdown component to reduce complexity
const VideoActionsDropdown = ({ onDelete }: { onDelete: () => void }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="secondary"
        size="sm"
        className="bg-background/90 border-border/60 hover:bg-background h-8 w-8 p-0 shadow-sm backdrop-blur-sm"
      >
        <MoreVertical className="h-4 w-4" />
        <span className="sr-only">Video options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="border-border/60 w-48 shadow-lg">
      <DropdownMenuItem className="cursor-pointer gap-2">
        <ExternalLink className="h-4 w-4" />
        View Original
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer gap-2" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
        Remove from Collection
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Helper Components
const ManagementModeSelection = ({ 
  isManageMode, 
  isSelected, 
  onToggleSelection, 
  videoTitle 
}: {
  isManageMode: boolean;
  isSelected: boolean;
  onToggleSelection: () => void;
  videoTitle: string;
}) => {
  if (!isManageMode) return null;
  
  return (
    <div className="absolute top-3 left-3 z-20">
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelection}
        className="bg-background/90 border-2 shadow-sm backdrop-blur-sm"
        aria-label={`Select ${videoTitle}`}
      />
    </div>
  );
};

const PlatformBadge = ({ platform }: { platform: string }) => (
  <div className="absolute top-3 right-3 z-10">
    <Badge
      variant="secondary"
      className="bg-background/90 text-foreground border-border/60 text-xs font-medium shadow-sm backdrop-blur-sm"
    >
      {platform}
    </Badge>
  </div>
);

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

const HoverActions = ({ 
  showActions, 
  onDelete 
}: { 
  showActions: boolean; 
  onDelete: () => void; 
}) => {
  if (!showActions) return null;
  
  return (
    <div className="absolute top-3 right-3 z-15 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <VideoActionsDropdown onDelete={onDelete} />
    </div>
  );
};

const ActionButtons = ({
  onShowInsights,
  onShowRepurpose,
}: {
  onShowInsights: () => void;
  onShowRepurpose: () => void;
}) => (
  <div className="flex gap-1.5 p-2">
    <Button
      variant="outline"
      size="sm"
      className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 h-8 flex-1 text-xs shadow-xs transition-all duration-200 hover:shadow-sm"
      onClick={onShowInsights}
    >
      <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
      Insights
    </Button>
    <Button
      variant="outline"
      size="sm"
      className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 h-8 flex-1 text-xs shadow-xs transition-all duration-200 hover:shadow-sm"
      onClick={onShowRepurpose}
    >
      <Zap className="mr-1.5 h-3.5 w-3.5" />
      Repurpose
    </Button>
  </div>
);

export const VideoCard = memo<VideoCardProps>(
  ({ video, isManageMode, isSelected, isDeleting, onToggleSelection, onDelete, className = "" }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showInsightsModal, setShowInsightsModal] = useState(false);
    const [showRepurposeModal, setShowRepurposeModal] = useState(false);

    const cardClassName = `group relative overflow-hidden transition-all duration-200 hover:shadow-lg border-border/50 hover:border-border ${className} ${
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
          <div className="bg-muted/30 relative aspect-[9/16] overflow-hidden">
            <VideoEmbed
              url={getVideoUrl(video as LegacyVideo)}
              className="absolute inset-0 h-full w-full"
            />

            {/* Platform Badge */}
            <PlatformBadge platform={video.platform} />

            {/* Duration Badge */}
            <DurationBadge duration={video.duration} />

            {/* Hover Actions */}
            <HoverActions showActions={showActions} onDelete={onDelete} />
          </div>

          {/* Action Buttons */}
          <ActionButtons
            onShowInsights={() => setShowInsightsModal(true)}
            onShowRepurpose={() => setShowRepurposeModal(true)}
          />
        </Card>

        {/* Coming Soon Modals */}
        <ComingSoonModal
          isOpen={showInsightsModal}
          onClose={() => setShowInsightsModal(false)}
          title="Video Insights"
        />
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
      prevProps.isDeleting === nextProps.isDeleting
    );
  },
);

VideoCard.displayName = "VideoCard";
