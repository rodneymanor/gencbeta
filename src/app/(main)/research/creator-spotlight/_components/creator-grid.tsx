'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';

interface CreatorProfile {
  id: string;
  username: string;
  displayName?: string;
  platform: 'tiktok' | 'instagram';
  profileImageUrl: string;
  bio?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  lastProcessed?: string;
  videoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatorGridProps {
  creators: CreatorProfile[];
  loading: boolean;
  onCreatorClick: (creator: CreatorProfile) => void;
}

export function CreatorGrid({ creators, loading, onCreatorClick }: CreatorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {creators.map((creator) => (
        <Card
          key={creator.id}
          className="overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          onClick={() => onCreatorClick(creator)}
        >
          <CardContent className="p-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <SafeImage
                    src={creator.profileImageUrl}
                    alt={creator.displayName ?? creator.username}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full"
                    fallbackUsername={creator.username}
                    fallbackPlatform={creator.platform}
                  />
                  <Badge
                    variant="outline"
                    className={cn(
                      "absolute -bottom-1 -right-1 text-xs capitalize",
                      creator.platform === 'tiktok' && "bg-[#FF0050] text-white border-[#FF0050]",
                      creator.platform === 'instagram' && "bg-[#E4405F] text-white border-[#E4405F]"
                    )}
                  >
                    {creator.platform}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">
                      {creator.displayName ?? creator.username}
                    </h3>
                    {creator.isVerified && (
                      <Badge variant="outline" className="text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{creator.username}
                  </p>
                </div>
              </div>
              
              {creator.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {creator.bio}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {creator.followersCount >= 1000000 
                        ? `${(creator.followersCount / 1000000).toFixed(1)}M`
                        : creator.followersCount >= 1000
                        ? `${(creator.followersCount / 1000).toFixed(1)}K`
                        : creator.followersCount
                      } followers
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {creator.videoCount ?? 0} videos
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 