"use client";

import { useState, useEffect } from "react";

import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { MetricsOverlay, InsightsDialogContent } from "./video-player-components";

interface VideoMetrics {
  views: number;
  likes: number;
  comments?: number;
  shares?: number;
}

interface VideoInsights {
  reach: number;
  impressions: number;
  engagementRate: number;
  topHours: string[];
  demographics: {
    ageGroup: string;
    percentage: number;
  }[];
  growthRate: number;
}

interface VideoPlayerProps {
  videoUrl: string;
  platform: "tiktok" | "instagram";
  metrics: VideoMetrics;
  insights?: VideoInsights;
  title?: string;
  author?: string;
  className?: string;
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  disableCard?: boolean;
}

const VideoEmbed = ({
  url,
  platform,
  hostedOnCDN,
  videoData,
  disableCard = false,
}: {
  url: string;
  platform: "tiktok" | "instagram";
  hostedOnCDN?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  disableCard?: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoData && !hostedOnCDN) {
      try {
        const uint8Array = new Uint8Array(videoData.buffer);
        const blob = new Blob([uint8Array], { type: videoData.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setVideoObjectUrl(objectUrl);
        setIsLoading(false);

        return () => {
          if (objectUrl && objectUrl.startsWith("blob:")) {
            URL.revokeObjectURL(objectUrl);
          }
        };
      } catch (error) {
        console.error("❌ [VIDEO_PLAYER] Failed to create video blob:", error);
        setHasError(true);
        setIsLoading(false);
      }
    } else if (hostedOnCDN || url.startsWith("http")) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [url, hostedOnCDN, videoData]);

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "tiktok") {
      const videoId = url.split("/").pop()?.split("?")[0];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    } else {
      const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
      return `https://www.instagram.com/p/${postId}/embed/`;
    }
  };

  const renderLoadingState = () => (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 ${disableCard ? "" : "rounded-xl"}`}
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        <p className="text-sm text-white">Loading video...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-red-900 via-pink-900 to-purple-900 ${disableCard ? "" : "rounded-xl"}`}
    >
      <div className="space-y-4 text-center">
        <div className="text-4xl text-white">⚠️</div>
        <p className="text-sm text-white">Failed to load video</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
          }}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          Retry
        </Button>
      </div>
    </div>
  );

  const renderIframeEmbed = (src: string) => (
    <iframe
      src={src}
      className={`h-full w-full ${disableCard ? "" : "rounded-xl"}`}
      frameBorder="0"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onError={(e) => {
        console.error("❌ [VIDEO_PLAYER] Iframe playback error:", e);
        setHasError(true);
      }}
      style={{ backgroundColor: "black" }}
    />
  );

  const renderVideoElement = (src: string) => (
    <video
      src={src}
      className={`h-full w-full object-cover ${disableCard ? "" : "rounded-xl"}`}
      controls
      muted
      loop
      playsInline
      onError={(e) => {
        console.error("❌ [VIDEO_PLAYER] Video playback error:", e);
        setHasError(true);
      }}
      style={{ backgroundColor: "black" }}
    />
  );

  if (isLoading) return renderLoadingState();
  if (hasError) return renderErrorState();

  // Handle iframe URLs (like Bunny Stream) - CHECK THIS FIRST!
  if (hostedOnCDN && url.includes("iframe.mediadelivery.net/embed")) {
    console.log("🎬 [VIDEO_PLAYER] Using iframe for Bunny Stream embed:", url);
    return renderIframeEmbed(url);
  }

  // Handle local video data first
  if (videoObjectUrl) {
    console.log("🎬 [VIDEO_PLAYER] Using local video object URL");
    return renderVideoElement(videoObjectUrl);
  }

  // Handle other CDN URLs (not iframe embeds)
  if (hostedOnCDN && url.startsWith("http") && !url.includes("iframe.mediadelivery.net")) {
    console.log("🎬 [VIDEO_PLAYER] Using video element for CDN URL:", url);
    return renderVideoElement(url);
  }

  return renderIframeEmbed(getEmbedUrl(url, platform));
};

const InsightsDialog = ({ insights, metrics }: { insights: VideoInsights; metrics: VideoMetrics }) => {
  return (
    <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Video Insights</span>
        </DialogTitle>
      </DialogHeader>
      <InsightsDialogContent insights={insights} metrics={metrics} />
    </DialogContent>
  );
};

export const VideoPlayer = ({
  videoUrl,
  platform,
  metrics,
  insights,
  className = "",
  hostedOnCDN,
  videoData,
  disableCard = false,
}: VideoPlayerProps) => {
  const videoContent = (
    <>
      {/* Video Container */}
      <div className={`relative aspect-[9/16] overflow-hidden bg-black ${disableCard ? "" : "rounded-xl"}`}>
        <VideoEmbed
          url={videoUrl}
          platform={platform}
          hostedOnCDN={hostedOnCDN}
          videoData={videoData}
          disableCard={disableCard}
        />

        {/* Metrics Overlay */}
        <MetricsOverlay metrics={metrics} />

        {/* Insights Button */}
        {insights && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="absolute top-4 right-4 border-0 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/70"
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                Insights
              </Button>
            </DialogTrigger>
            <InsightsDialog insights={insights} metrics={metrics} />
          </Dialog>
        )}

        {/* Platform Badge */}
        <Badge className="absolute top-4 left-4 border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white capitalize">
          {platform}
        </Badge>
      </div>
    </>
  );

  if (disableCard) {
    return <div className={className}>{videoContent}</div>;
  }

  return (
    <div className={`relative mx-auto w-full max-w-sm ${className}`}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <CardContent className="p-0">{videoContent}</CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayer;
