/* eslint-disable max-lines */
"use client";

import { useState, useEffect } from "react";

import dynamic from "next/dynamic";

import { MoreVertical, Trash2, ExternalLink, TrendingUp, Zap, RefreshCw, MoveRight, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase";

import type { VideoWithPlayer } from "./collections-helpers";

// Lazy load the heavy Insights dashboard component on demand (CSR only)
const VideoInsightsDashboard = dynamic(
  () => import("./video-insights-dashboard").then((m) => m.VideoInsightsDashboard),
  {
    ssr: false,
    loading: () => null, // render nothing while chunk is loading
  },
);

// Legacy video type for backward compatibility
type LegacyVideo = VideoWithPlayer & {
  url?: string; // Legacy field that might contain Bunny.net URLs
};

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
export const VideoActionsDropdown = ({
  onDelete,
  onMoveVideo,
  onCopyVideo,
}: {
  onDelete?: () => void;
  onMoveVideo?: () => void;
  onCopyVideo?: () => void;
}) => (
  <DropdownMenu modal={false}>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="pointer-events-auto h-8 w-8 border-0 bg-transparent p-0 shadow-none hover:bg-white/10 focus:ring-2 focus:ring-white/20"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <MoreVertical className="pointer-events-none h-4 w-4 text-white" />
        <span className="sr-only">Video options</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      className="border-border/60 z-50 w-48 shadow-lg"
      sideOffset={5}
      collisionPadding={10}
      onCloseAutoFocus={(e) => e.preventDefault()}
    >
      <DropdownMenuItem className="cursor-pointer gap-2">
        <ExternalLink className="h-4 w-4" />
        View Original
      </DropdownMenuItem>
      {onMoveVideo && (
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={(e) => {
            e.preventDefault();
            onMoveVideo();
          }}
        >
          <MoveRight className="h-4 w-4" />
          Move to Collection
        </DropdownMenuItem>
      )}
      {onCopyVideo && (
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={(e) => {
            e.preventDefault();
            onCopyVideo();
          }}
        >
          <Copy className="h-4 w-4" />
          Copy to Collection
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {onDelete && (
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer gap-2"
          onClick={(e) => {
            e.preventDefault();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
          Remove from Collection
        </DropdownMenuItem>
      )}
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

export const HoverActions = ({
  showActions,
  onDelete,
  onMoveVideo,
  onCopyVideo,
}: {
  showActions: boolean;
  onDelete: () => void;
  onMoveVideo?: () => void;
  onCopyVideo?: () => void;
}) => {
  if (!showActions) return null;

  return (
    <div className="pointer-events-auto absolute top-3 left-3 z-30">
      <VideoActionsDropdown onDelete={onDelete} onMoveVideo={onMoveVideo} onCopyVideo={onCopyVideo} />
    </div>
  );
};

export const ActionButtons = ({ video }: { video: VideoWithPlayer }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insightsLoaded, setInsightsLoaded] = useState(false);

  // Debug: Log when ActionButtons component renders
  console.log("🔍 [ActionButtons] Component rendered with video:", video);
  console.log("🔍 [ActionButtons] Video ID:", video.id);
  console.log("🔍 [ActionButtons] Video title:", video.title);

  const handleRepurpose = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/script/speed-write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idea: video.transcript }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to generate script");
      }
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (video.iframeUrl && !video.isPlaying) {
      const preloadFrame = document.createElement("iframe");
      preloadFrame.src = getValidIframeUrl(video.iframeUrl);
      preloadFrame.style.display = "none";
      document.body.appendChild(preloadFrame);
      const timer = window.setTimeout(() => {
        document.body.removeChild(preloadFrame);
      }, 30000);
      return () => {
        window.clearTimeout(timer);
        if (preloadFrame.parentElement) {
          preloadFrame.parentElement.removeChild(preloadFrame);
        }
      };
    }
  }, [video.iframeUrl, video.isPlaying]);

  // Predefine the Insights button so we can reuse it
  const insightsButton = (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        console.log("🔍 [ActionButtons] Insights button clicked!");
        console.log("🔍 [ActionButtons] Video data being passed to insights:", video);
        setInsightsLoaded(true);
      }}
      className="border-border/60 hover:bg-accent/50 h-8 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
      Insights
    </Button>
  );

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {insightsLoaded ? (
          <VideoInsightsDashboard video={video}>{insightsButton}</VideoInsightsDashboard>
        ) : (
          insightsButton
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-border/60 hover:bg-accent/50 h-8 rounded-md px-3 text-xs shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Zap className="mr-1.5 h-3.5 w-3.5" />
          Repurpose
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Repurpose Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to write a script based on this video&apos;s transcript?
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-destructive mb-2 text-sm">{error}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleRepurpose} disabled={loading}>
              {loading ? "Generating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

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

// Helper function to build Bunny Stream thumbnail URL
export const getThumbnailUrl = (video: VideoWithPlayer): string | null => {
  // If we already have a thumbnailUrl field, use it
  if (video.thumbnailUrl) {
    return video.thumbnailUrl;
  }

  // Try to derive from directUrl (preferred)
  if (video.directUrl && video.directUrl.includes(".b-cdn.net")) {
    try {
      const url = new URL(video.directUrl);
      const host = url.host; // e.g. vz-8416c36e-556.b-cdn.net
      const parts = url.pathname.split("/").filter(Boolean); // [guid, ...]
      if (parts.length > 0) {
        const guid = parts[0];
        return `https://${host}/${guid}/thumbnail.jpg`;
      }
    } catch (error) {
      console.log("❌ [Thumbnail] Failed to parse directUrl:", video.directUrl);
    }
  }

  // Fallback: Try to derive from iframeUrl if it contains mediadelivery.net pattern
  if (video.iframeUrl && video.iframeUrl.includes("iframe.mediadelivery.net")) {
    try {
      const url = new URL(video.iframeUrl);
      const parts = url.pathname.split("/").filter(Boolean); // [embed, libraryId, guid]
      if (parts.length === 3) {
        const libraryId = parts[1];
        const guid = parts[2];
        // Bunny's default CDN domain pattern for libraries
        return `https://vz-${libraryId}.b-cdn.net/${guid}/thumbnail.jpg`;
      }
    } catch (error) {
      console.log("❌ [Thumbnail] Failed to parse iframeUrl:", video.iframeUrl);
    }
  }

  return null; // No thumbnail found
};

// Build iframe URL with only Bunny-supported query parameters
const getValidIframeUrl = (base: string): string => {
  const url = new URL(base);
  // Supported parameters per Bunny Stream docs
  url.searchParams.set("autoplay", "false");
  url.searchParams.set("preload", "true");
  url.searchParams.set("muted", "false");
  url.searchParams.set("responsive", "true");
  // Keep metrics off to disable RUM probes if not already present
  if (!url.searchParams.has("metrics")) {
    url.searchParams.set("metrics", "false");
  }
  return url.toString();
};
