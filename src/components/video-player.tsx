"use client";

import { memo } from "react";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { VideoEmbed } from "./video-embed";
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
  thumbnailUrl?: string;
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

const InsightsDialog = memo(({ insights, metrics }: { insights: VideoInsights; metrics: VideoMetrics }) => {
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
});

InsightsDialog.displayName = "InsightsDialog";

// Simplified VideoPlayer - reduced from 6+ divs to 2-3 divs max
const VideoPlayerComponent = ({
  videoUrl,
  platform,
  thumbnailUrl,
  metrics,
  insights,
  title,
  author,
  className = "",
  hostedOnCDN,
  videoData,
  disableCard = false,
}: VideoPlayerProps) => {
  // Main video container - single div with aspect ratio
  const videoContainer = (
    <div className={`relative aspect-[9/16] overflow-hidden bg-black ${disableCard ? "" : "rounded-xl"}`}>
      <VideoEmbed
        url={videoUrl}
        platform={platform}
        thumbnailUrl={thumbnailUrl}
        videoData={videoData}
        className="h-full w-full"
      />

      {/* Metrics Overlay */}
      <MetricsOverlay metrics={metrics} />

      {/* Insights Button */}
      {insights && (
        <div className="absolute top-4 right-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="border-0 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70"
              >
                <BarChart3 className="mr-1 h-4 w-4" />
                Insights
              </Button>
            </DialogTrigger>
            <InsightsDialog insights={insights} metrics={metrics} />
          </Dialog>
        </div>
      )}

      {/* Platform Badge removed - VideoThumbnail handles platform indicator */}
    </div>
  );

  // Return simplified structure
  if (disableCard) {
    return <div className={className}>{videoContainer}</div>;
  }

  return (
    <motion.div
      className={`relative mx-auto w-full max-w-sm ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <CardContent className="p-0">{videoContainer}</CardContent>
      </Card>
    </motion.div>
  );
};

// Memoize the component for better performance
export const VideoPlayer = memo(VideoPlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.platform === nextProps.platform &&
    prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
    prevProps.metrics.views === nextProps.metrics.views &&
    prevProps.metrics.likes === nextProps.metrics.likes &&
    prevProps.hostedOnCDN === nextProps.hostedOnCDN
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
