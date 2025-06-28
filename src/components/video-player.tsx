"use client";

import { memo } from "react";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { VideoEmbed } from "./video-embed";
import { containerVariants, overlayVariants } from "./video-player-animations";
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

const VideoPlayerComponent = ({
  videoUrl,
  platform,
  metrics,
  insights,
  title,
  author,
  className = "",
  hostedOnCDN,
  videoData,
  disableCard = false,
}: VideoPlayerProps) => {
  const videoContent = (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Video Container */}
      <div
        className={`relative aspect-[9/16] overflow-hidden bg-black ${disableCard ? "" : "rounded-xl"}`}
        style={{ position: "relative" }}
      >
        <VideoEmbed
          url={videoUrl}
          platform={platform}
          hostedOnCDN={hostedOnCDN}
          videoData={videoData}
          disableCard={disableCard}
          title={title}
          author={author}
          lazyLoad={true}
        />

        {/* Metrics Overlay */}
        <motion.div variants={overlayVariants}>
          <MetricsOverlay metrics={metrics} />
        </motion.div>

        {/* Insights Button */}
        {insights && (
          <motion.div className="absolute top-4 right-4" variants={overlayVariants}>
            <Dialog>
              <DialogTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    className="border-0 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70"
                  >
                    <BarChart3 className="mr-1 h-4 w-4" />
                    Insights
                  </Button>
                </motion.div>
              </DialogTrigger>
              <InsightsDialog insights={insights} metrics={metrics} />
            </Dialog>
          </motion.div>
        )}

        {/* Platform Badge */}
        <motion.div className="absolute top-4 left-4" variants={overlayVariants}>
          <Badge className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white capitalize">
            {platform}
          </Badge>
        </motion.div>
      </div>
    </motion.div>
  );

  if (disableCard) {
    return <div className={className}>{videoContent}</div>;
  }

  return (
    <motion.div
      className={`relative mx-auto w-full max-w-sm ${className}`}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <CardContent className="p-0">{videoContent}</CardContent>
      </Card>
    </motion.div>
  );
};

// Memoize the component for better performance
export const VideoPlayer = memo(VideoPlayerComponent, (prevProps, nextProps) => {
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.platform === nextProps.platform &&
    prevProps.metrics.views === nextProps.metrics.views &&
    prevProps.metrics.likes === nextProps.metrics.likes &&
    prevProps.hostedOnCDN === nextProps.hostedOnCDN
  );
});

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
