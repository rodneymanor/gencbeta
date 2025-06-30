"use client";

import { useState, memo } from "react";
import { MoreVertical, Trash2, ExternalLink, Clock, TrendingUp, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoEmbed } from "@/components/video-embed";

import type { VideoWithPlayer } from "./collections-helpers";

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
const ComingSoonModal = ({ 
  isOpen, 
  onClose, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
}) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md shadow-lg border-border/60">
      <DialogHeader className="text-center space-y-3">
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        <DialogDescription className="text-muted-foreground leading-relaxed">
          This feature is coming soon! We're working hard to bring you powerful video analysis and content repurposing tools.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-center pt-4">
        <Button onClick={onClose} className="shadow-xs hover:shadow-sm transition-all duration-200">
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
        className="h-8 w-8 p-0 bg-background/90 border-border/60 shadow-sm backdrop-blur-sm hover:bg-background"
      >
        <MoreVertical className="h-4 w-4" />
        <span className="sr-only">Video options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48 shadow-lg border-border/60">
      <DropdownMenuItem className="gap-2 cursor-pointer">
        <ExternalLink className="h-4 w-4" />
        View Original
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
        Remove from Collection
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const VideoCard = memo<VideoCardProps>(({
  video,
  isManageMode,
  isSelected,
  isDeleting,
  onToggleSelection,
  onDelete,
  className = "",
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showRepurposeModal, setShowRepurposeModal] = useState(false);

  // Debug: Log video data structure
  console.log("🎬 [VideoCard] Rendering video:");
  console.log("  Video ID:", video.id);
  console.log("  Video URL:", video.url);
  console.log("  Video URL type:", typeof video.url);
  console.log("  Thumbnail URL:", video.thumbnailUrl);
  console.log("  Thumbnail type:", typeof video.thumbnailUrl);
  console.log("  Platform:", video.platform);
  console.log("  Title:", video.title);

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
        {isManageMode && (
          <div className="absolute top-3 left-3 z-20">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelection}
              className="bg-background/90 border-2 shadow-sm backdrop-blur-sm"
              aria-label={`Select ${video.title}`}
            />
          </div>
        )}

        {/* Video Content */}
        <div className="aspect-[9/16] relative overflow-hidden bg-muted/30">
          <VideoEmbed
            url={video.url}
            platform={video.platform as "tiktok" | "instagram"}
            thumbnailUrl={video.thumbnailUrl}
            className="absolute inset-0 w-full h-full"
          />
          
          {/* Platform Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge 
              variant="secondary" 
              className="bg-background/90 text-foreground border-border/60 shadow-sm backdrop-blur-sm text-xs font-medium"
            >
              {video.platform}
            </Badge>
          </div>

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 z-10">
              <Badge 
                variant="secondary" 
                className="bg-background/90 text-foreground border-border/60 shadow-sm backdrop-blur-sm text-xs font-medium flex items-center gap-1"
              >
                <Clock className="h-3 w-3" />
                {Math.round(video.duration)}s
              </Badge>
            </div>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute top-3 right-3 z-15 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <VideoActionsDropdown onDelete={onDelete} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
            onClick={() => setShowInsightsModal(true)}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Insights
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
            onClick={() => setShowRepurposeModal(true)}
          >
            <Zap className="mr-2 h-4 w-4" />
            Repurpose
          </Button>
        </div>
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
}, (prevProps, nextProps) => {
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.isManageMode === nextProps.isManageMode &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDeleting === nextProps.isDeleting
  );
});

VideoCard.displayName = "VideoCard";
