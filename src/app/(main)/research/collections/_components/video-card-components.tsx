"use client";

import { MoreVertical, Trash2, ExternalLink, Clock, TrendingUp, Zap, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { VideoWithPlayer } from "./collections-helpers";

// Legacy video type for backward compatibility
export type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

// Coming Soon Modal Component
export const ComingSoonModal = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>This feature is coming soon! Stay tuned for updates.</DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
);

// Video actions dropdown component to reduce complexity
export const VideoActionsDropdown = ({ onDelete }: { onDelete: () => void }) => (
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
export const ManagementModeSelection = ({
  isManageMode,
  isSelected,
  onToggleSelection,
  videoTitle,
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

// Reprocess Video Component for Legacy Videos
export const ReprocessVideoOverlay = ({
  video,
  onReprocess,
  onDelete,
  isReprocessing = false,
}: {
  video: LegacyVideo;
  onReprocess: (video: LegacyVideo) => void;
  onDelete: () => void;
  isReprocessing?: boolean;
}) => {
  // Only show for videos missing iframeUrl
  if (video.iframeUrl) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="space-y-3 p-4 text-center">
        <div className="text-sm font-medium text-white/90">{isReprocessing ? "Processing..." : "Legacy Video"}</div>
        <div className="mx-auto max-w-[200px] text-xs text-white/70">
          {isReprocessing ? "Converting video for playback..." : "This video needs reprocessing to enable playback"}
        </div>
        <div className="flex gap-2 justify-center">
          <Button
            size="sm"
            onClick={() => onReprocess(video)}
            disabled={isReprocessing}
            className="shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isReprocessing ? "animate-spin" : ""}`} />
            {isReprocessing ? "Processing..." : "Reprocess"}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            disabled={isReprocessing}
            className="shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PlatformBadge = ({ platform }: { platform: string }) => (
  <div className="absolute top-3 right-3 z-15">
    <Badge
      variant="secondary"
      className="bg-background/90 text-foreground border-border/60 text-xs font-medium shadow-sm backdrop-blur-sm"
    >
      {platform}
    </Badge>
  </div>
);

export const DurationBadge = ({ duration }: { duration?: number }) => {
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

export const HoverActions = ({ showActions, onDelete }: { showActions: boolean; onDelete: () => void }) => {
  if (!showActions) return null;

  return (
    <div className="absolute top-3 right-3 z-15 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <VideoActionsDropdown onDelete={onDelete} />
    </div>
  );
};

export const ActionButtons = ({
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