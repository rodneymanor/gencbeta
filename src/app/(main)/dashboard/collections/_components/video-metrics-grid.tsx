"use client";

import { Bookmark, Eye, Heart, MessageCircle, Share, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";

interface VideoInsights {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  engagementRate: number;
}

interface VideoMetricsGridProps {
  insights: VideoInsights;
}

export function VideoMetricsGrid({ insights }: VideoMetricsGridProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(insights.likes)}</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <Heart className="h-4 w-4" />
            Likes
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{formatNumber(insights.comments)}</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <MessageCircle className="h-4 w-4" />
            Comments
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{formatNumber(insights.shares)}</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <Share className="h-4 w-4" />
            Shares
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{formatNumber(insights.views)}</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <Eye className="h-4 w-4" />
            Views
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{formatNumber(insights.saves)}</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <Bookmark className="h-4 w-4" />
            Saves
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{insights.engagementRate.toFixed(2)}%</div>
          <div className="text-muted-foreground mt-1 flex items-center justify-center gap-1 text-sm">
            <TrendingUp className="h-4 w-4" />
            Engagement Rate
          </div>
        </Card>
      </div>
    </div>
  );
}
