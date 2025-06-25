"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Target, Users, TrendingUp, Heart, Eye, MessageCircle, Share } from "lucide-react";

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

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const MetricsOverlay = ({ metrics }: { metrics: VideoMetrics }) => {
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

export const InsightsDialogContent = ({ insights, metrics }: { insights: VideoInsights; metrics: VideoMetrics }) => {
  return (
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
  );
}; 