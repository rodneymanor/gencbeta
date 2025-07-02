"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialMediaStats } from "@/types/usage-tracking";

interface SocialStatsProps {
  className?: string;
}

// Mock data for now - will be replaced with API integration
const mockSocialStats: SocialMediaStats[] = [
  {
    platform: "instagram",
    username: "@johndoe",
    followerCount: 12500,
    weeklyChange: 250,
    weeklyChangePercent: 2.04,
    lastUpdated: new Date().toISOString(),
  },
  {
    platform: "tiktok",
    username: "@johndoe",
    followerCount: 8300,
    weeklyChange: -50,
    weeklyChangePercent: -0.60,
    lastUpdated: new Date().toISOString(),
  },
];

export function SocialStats({ className }: SocialStatsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [socialStats, setSocialStats] = useState<SocialMediaStats[]>(mockSocialStats);

  // Auto-rotate through platforms every 5 seconds
  useEffect(() => {
    if (socialStats.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % socialStats.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [socialStats.length]);

  const nextStat = () => {
    setCurrentIndex((prev) => (prev + 1) % socialStats.length);
  };

  const prevStat = () => {
    setCurrentIndex((prev) => (prev - 1 + socialStats.length) % socialStats.length);
  };

  if (socialStats.length === 0) {
    return null;
  }

  const currentStat = socialStats[currentIndex];
  const isPositiveChange = currentStat.weeklyChange > 0;
  const isNegativeChange = currentStat.weeklyChange < 0;

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatChange = (change: number): string => {
    const absChange = Math.abs(change);
    if (absChange >= 1000) {
      return `${(absChange / 1000).toFixed(1)}K`;
    }
    return absChange.toString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return "📷";
      case "tiktok":
        return "🎵";
      default:
        return "📱";
    }
  };

  const getTrendIcon = () => {
    if (isPositiveChange) {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (isNegativeChange) {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    } else {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangeColor = () => {
    if (isPositiveChange) {
      return "text-green-500";
    } else if (isNegativeChange) {
      return "text-red-500";
    } else {
      return "text-muted-foreground";
    }
  };

  return (
    <Card className={`${className} min-w-[200px]`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Navigation Button */}
          {socialStats.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={prevStat}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          )}

          {/* Stats Content */}
          <div className="flex-1 flex items-center justify-center gap-3">
            {/* Platform */}
            <div className="flex items-center gap-1">
              <span className="text-sm">{getPlatformIcon(currentStat.platform)}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentStat.platform}
              </span>
            </div>

            {/* Follower Count */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {formatFollowerCount(currentStat.followerCount)}
              </span>
              <span className="text-xs text-muted-foreground">followers</span>
            </div>

            {/* Weekly Change */}
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-xs font-medium ${getChangeColor()}`}>
                {currentStat.weeklyChange !== 0 && (isPositiveChange ? "+" : "")}
                {formatChange(currentStat.weeklyChange)}
              </span>
            </div>
          </div>

          {/* Navigation Button */}
          {socialStats.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={nextStat}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Platform Indicators */}
        {socialStats.length > 1 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            {socialStats.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-1 rounded-full transition-colors ${
                  index === currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 