"use client";

import { useEffect, useState } from "react";
import { Instagram, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Auto-rotate through platforms every 4 seconds
  useEffect(() => {
    if (socialStats.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % socialStats.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [socialStats.length]);

  if (socialStats.length === 0) {
    return null;
  }

  const currentStat = socialStats[currentIndex];
  const isPositiveChange = currentStat.weeklyChange > 0;

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
        return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
      case "tiktok":
        return <Music className="h-3.5 w-3.5 text-black dark:text-white" />;
      default:
        return <Instagram className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getChangeColor = () => {
    if (isPositiveChange) {
      return "text-green-600 dark:text-green-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`${className} h-8 px-2 text-xs hover:bg-muted/50 transition-all duration-300`}
      onClick={() => setCurrentIndex((prev) => (prev + 1) % socialStats.length)}
    >
      <div className="flex items-center gap-1.5">
        {/* Platform Icon */}
        {getPlatformIcon(currentStat.platform)}
        
        {/* Follower Count */}
        <span className="font-medium text-foreground">
          {formatFollowerCount(currentStat.followerCount)}
        </span>
        
        {/* Weekly Change - only show if significant */}
        {Math.abs(currentStat.weeklyChange) > 0 && (
          <span className={`font-medium ${getChangeColor()}`}>
            {isPositiveChange ? "+" : ""}
            {formatChange(currentStat.weeklyChange)}
          </span>
        )}
        
        {/* Subtle platform indicators */}
        {socialStats.length > 1 && (
          <div className="flex gap-0.5 ml-1">
            {socialStats.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-1 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? "bg-primary scale-110" 
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Button>
  );
} 