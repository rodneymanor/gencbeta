"use client";

import { Bookmark, Eye, Heart, MessageCircle, Share, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

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

// Helper function to format large numbers with K, M suffixes
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
};

// Individual Metric Card Component
const SocialMediaMetricCard = ({
  icon,
  metric,
  label,
  trend,
  trendDirection,
}: {
  icon: React.ReactNode;
  metric: string;
  label: string;
  trend?: string;
  trendDirection?: "up" | "down";
}) => {
  const TrendIcon = trendDirection === "up" ? ArrowUp : ArrowDown;
  const trendColor = trendDirection === "up" ? "text-green-500" : "text-red-500";

  return (
    <div className="border-border/50 bg-card/50 transform rounded-xl border p-4 shadow-sm transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-md sm:p-6">
      <div className="flex items-center gap-x-4">
        <div className="bg-muted/50 rounded-lg p-2">{icon}</div>
        <div className="flex flex-col">
          <p className="text-foreground text-2xl font-bold">{metric}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
        {trend && (
          <div className={`ml-auto flex items-center text-xs ${trendColor}`}>
            <TrendIcon className="mr-1 h-4 w-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export function VideoMetricsGrid({ insights }: VideoMetricsGridProps) {
  // Mock trend data - in a real app, this would come from the API
  const metrics = [
    {
      type: "views",
      value: insights.views,
      label: "Views",
      trend: "12.5%",
      trendDirection: "up" as const,
      icon: <Eye className="h-6 w-6 text-blue-500" />,
    },
    {
      type: "likes",
      value: insights.likes,
      label: "Likes",
      trend: "5.2%",
      trendDirection: "up" as const,
      icon: <Heart className="h-6 w-6 text-red-500" />,
    },
    {
      type: "shares",
      value: insights.shares,
      label: "Shares",
      trend: "2.1%",
      trendDirection: "down" as const,
      icon: <Share className="h-6 w-6 text-purple-500" />,
    },
    {
      type: "comments",
      value: insights.comments,
      label: "Comments",
      trend: "8.9%",
      trendDirection: "up" as const,
      icon: <MessageCircle className="h-6 w-6 text-green-500" />,
    },
    {
      type: "saves",
      value: insights.saves,
      label: "Saves",
      trend: "3.4%",
      trendDirection: "up" as const,
      icon: <Bookmark className="h-6 w-6 text-[#2d93ad]" />,
    },
    {
      type: "engagement",
      value: insights.engagementRate,
      label: "Engagement Rate",
      trend: "1.2%",
      trendDirection: "up" as const,
      icon: <TrendingUp className="h-6 w-6 text-indigo-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Metrics</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <SocialMediaMetricCard
            key={metric.type}
            icon={metric.icon}
            metric={metric.type === "engagement" ? `${metric.value.toFixed(1)}%` : formatNumber(metric.value)}
            label={metric.label}
            trend={metric.trend}
            trendDirection={metric.trendDirection}
          />
        ))}
      </div>
    </div>
  );
}
