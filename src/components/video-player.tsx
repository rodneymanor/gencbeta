"use client";

import { useState, useEffect } from "react";

import { Heart, Eye, MessageCircle, Share, TrendingUp, Users, Clock, BarChart3, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const VideoEmbed = ({ url, platform }: { url: string; platform: "tiktok" | "instagram" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getEmbedUrl = (url: string, platform: string) => {
    if (platform === "tiktok") {
      // Extract TikTok video ID and create embed URL
      const videoId = url.split("/").pop()?.split("?")[0];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    } else {
      // Instagram embed URL format
      const postId = url.split("/p/")[1]?.split("/")[0] ?? "";
      return `https://www.instagram.com/p/${postId}/embed/`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
          <p className="text-sm text-white">Loading video...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-red-900 via-pink-900 to-purple-900">
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
  }

  return (
    <iframe
      src={getEmbedUrl(url, platform)}
      className="h-full w-full rounded-xl"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onError={() => setHasError(true)}
    />
  );
};

const MetricsOverlay = ({ metrics }: { metrics: VideoMetrics }) => {
  return (
    <div className="absolute right-0 bottom-0 left-0 rounded-b-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">{formatNumber(metrics.views)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span className="text-sm font-medium">{formatNumber(metrics.likes)}</span>
          </div>
          {metrics.comments && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{formatNumber(metrics.comments)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

      <div className="space-y-6">
        {/* Performance Overview */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(metrics.views)}</p>
                    <p className="text-muted-foreground text-xs">Views</p>
                    <div className="mt-1 flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">+{insights.growthRate}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{formatNumber(metrics.likes)}</p>
                    <p className="text-muted-foreground text-xs">Likes</p>
                    <p className="mt-1 text-xs text-blue-500">{insights.engagementRate}% rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reach & Impressions */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Reach</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="font-semibold">{formatNumber(insights.reach)}</p>
                <p className="text-muted-foreground text-xs">Reach</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="font-semibold">{formatNumber(insights.impressions)}</p>
                <p className="text-muted-foreground text-xs">Impressions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Breakdown */}
        {(metrics.comments ?? metrics.shares) && (
          <div className="space-y-3">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Engagement</h3>
            <div className="grid grid-cols-2 gap-4">
              {metrics.comments && (
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-semibold">{formatNumber(metrics.comments)}</p>
                    <p className="text-muted-foreground text-xs">Comments</p>
                  </div>
                </div>
              )}
              {metrics.shares && (
                <div className="flex items-center space-x-2">
                  <Share className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-semibold">{formatNumber(metrics.shares)}</p>
                    <p className="text-muted-foreground text-xs">Shares</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Hours */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground flex items-center space-x-2 text-sm font-semibold tracking-wide uppercase">
            <Clock className="h-4 w-4" />
            <span>Peak Hours</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {insights.topHours.map((hour, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {hour}
              </Badge>
            ))}
          </div>
        </div>

        {/* Demographics */}
        <div className="space-y-3">
          <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Top Demographics</h3>
          <div className="space-y-2">
            {insights.demographics.map((demo, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{demo.ageGroup}</span>
                <div className="flex items-center space-x-2">
                  <div className="bg-muted h-2 w-16 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${demo.percentage}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-8 text-xs">{demo.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export const VideoPlayer = ({ videoUrl, platform, metrics, insights, className = "" }: VideoPlayerProps) => {
  return (
    <div className={`relative mx-auto w-full max-w-sm ${className}`}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
        <CardContent className="p-0">
          {/* Video Container */}
          <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black">
            <VideoEmbed url={videoUrl} platform={platform} />

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
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPlayer;
