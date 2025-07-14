"use client";

import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedCreatorProfile, getOptimizedProfileImageUrl } from "@/lib/creator-spotlight-utils";
import { cn } from "@/lib/utils";

interface CreatorGridProps {
  creators: EnhancedCreatorProfile[];
  loading: boolean;
  onCreatorClick: (creator: EnhancedCreatorProfile) => void;
}

export function CreatorGrid({ creators, loading, onCreatorClick }: CreatorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator, index) => (
        <Card
          key={creator.id}
          className="cursor-pointer overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
          onClick={() => onCreatorClick(creator)}
        >
          <CardContent className="p-0">
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <SafeImage
                    src={getOptimizedProfileImageUrl(creator)}
                    alt={creator.displayName ?? creator.username}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full"
                    fallbackUsername={creator.username}
                    fallbackPlatform={creator.platform}
                    priority={index < 6}
                  />
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -right-1 -bottom-1 text-xs capitalize",
                      creator.platform === "tiktok" && "border-[#FF0050] bg-[#FF0050] text-white",
                      creator.platform === "instagram" && "border-[#E4405F] bg-[#E4405F] text-white",
                    )}
                  >
                    {creator.platform}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{creator.displayName ?? creator.username}</h3>
                    {creator.isVerified && (
                      <Badge variant="outline" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-sm">@{creator.username}</p>
                </div>
              </div>

              {creator.bio && <p className="text-muted-foreground line-clamp-2 text-sm">{creator.bio}</p>}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    <span className="text-foreground font-semibold">
                      {creator.followersCount >= 1000000
                        ? `${(creator.followersCount / 1000000).toFixed(1)}M`
                        : creator.followersCount >= 1000
                          ? `${(creator.followersCount / 1000).toFixed(1)}K`
                          : creator.followersCount}{" "}
                      followers
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {creator.videoCount ?? 0} videos
                  </Badge>
                  {creator.hasOptimizedMedia && (
                    <Badge variant="outline" className="border-green-600 text-xs text-green-600">
                      ⚡ Fast
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
