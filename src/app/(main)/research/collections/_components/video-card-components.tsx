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
type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

// Platform icons (you can replace these with actual SVG icons if needed)
const TikTokIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

// Coming Soon Modal Component
export const ComingSoonModal = ({
  isOpen,
  onClose,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) => (
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
        <div className="flex justify-center gap-2">
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

export const PlatformBadge = ({ platform }: { platform: string }) => {
  const platformLower = platform.toLowerCase();

  // Only show badge for TikTok or Instagram
  if (platformLower !== "tiktok" && platformLower !== "instagram") {
    return null;
  }

  const isTikTok = platformLower === "tiktok";

  return (
    <div className="absolute top-3 right-3 z-15">
      <Badge
        className={`flex items-center gap-1 text-xs font-medium shadow-sm backdrop-blur-sm ${
          isTikTok
            ? "bg-black text-white hover:bg-black/90"
            : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
        }`}
      >
        {isTikTok ? <TikTokIcon /> : <InstagramIcon />}
        {isTikTok ? "TikTok" : "Instagram"}
      </Badge>
    </div>
  );
};

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
    <div className="absolute top-3 right-3 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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
  <div className="flex gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={onShowInsights}
      className="border-border/60 hover:bg-accent/50 flex-1 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
      Insights
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={onShowRepurpose}
      className="border-border/60 hover:bg-accent/50 flex-1 shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <Zap className="mr-1.5 h-3.5 w-3.5" />
      Repurpose
    </Button>
  </div>
);

export const VideoMetadata = ({ video }: { video: VideoWithPlayer }) => (
  <div className="space-y-3">
    <div className="space-y-1">
      <h3 className="text-sm leading-tight font-semibold">{video.title}</h3>
      {video.description && (
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{video.description}</p>
      )}
    </div>

    {/* Video metadata */}
    <div className="flex items-center gap-3 text-xs">
      {video.duration && (
        <div className="text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{video.duration}</span>
        </div>
      )}
      {video.views && (
        <div className="text-muted-foreground">
          <span>{video.views.toLocaleString()} views</span>
        </div>
      )}
    </div>
  </div>
);

// Helper function to get the correct video URL
export const getVideoUrl = (video: LegacyVideo): string => {
  console.log("🔍 [VideoCard] Video data:", {
    id: video.id,
    iframeUrl: video.iframeUrl,
    url: video.url,
    originalUrl: video.originalUrl,
  });

  // Priority order: iframeUrl -> legacy url (if Bunny) -> originalUrl -> empty
  if (video.iframeUrl) {
    console.log("✅ [VideoCard] Using iframeUrl:", video.iframeUrl);
    return video.iframeUrl;
  }

  if (video.url && video.url.includes("iframe.mediadelivery.net")) {
    console.log("✅ [VideoCard] Using legacy Bunny URL:", video.url);
    return video.url;
  }

  if (video.originalUrl) {
    console.log("⚠️ [VideoCard] Falling back to originalUrl (will be rejected):", video.originalUrl);
    return video.originalUrl;
  }

  console.log("❌ [VideoCard] No valid URL found - returning empty string");
  return "";
};
