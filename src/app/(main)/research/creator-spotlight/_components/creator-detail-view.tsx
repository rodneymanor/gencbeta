"use client";

import React from "react";

import { ArrowLeft } from "lucide-react";

import { SocialHeader } from "@/components/extract/social-header";
import { VideoGridDisplay } from "@/components/extract/video-grid-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatorProfile {
  id: string;
  username: string;
  displayName?: string;
  platform: "tiktok" | "instagram";
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

interface CreatorVideo {
  id: string;
  thumbnailUrl: string;
  duration?: number;
  likes?: number;
  views?: number;
  favorite?: boolean;
  title?: string;
  description?: string;
  collectionId?: string;
  addedAt?: string;
  platform: "tiktok" | "instagram";
}

interface CreatorDetailViewProps {
  creator: CreatorProfile;
  videos: CreatorVideo[];
  loadingVideos: boolean;
  onBack: () => void;
}

export function CreatorDetailView({ creator, videos, loadingVideos, onBack }: CreatorDetailViewProps) {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </Button>

      {/* Creator Profile */}
      <SocialHeader
        username={creator.username}
        displayName={creator.displayName}
        profileImageUrl={creator.profileImageUrl}
        bio={creator.bio}
        website={creator.website}
        postsCount={creator.postsCount}
        followersCount={creator.followersCount}
        followingCount={creator.followingCount}
        isVerified={creator.isVerified}
        mutualFollowers={creator.mutualFollowers}
        onFollowClick={() => console.log("Follow clicked")}
        onMoreClick={() => console.log("More clicked")}
        className="rounded-lg border"
      />

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Videos</h2>
          <Badge variant="outline" className="capitalize">
            {creator.platform}
          </Badge>
        </div>

        {loadingVideos ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[9/16] w-full" />
            ))}
          </div>
        ) : (
          <VideoGridDisplay
            videos={videos}
            mode="instagram"
            onVideoClick={(video, index) => console.log("Video clicked:", video, index)}
            onFavorite={(video, index) => console.log("Favorite clicked:", video, index)}
            emptyStateMessage="No videos found for this creator."
          />
        )}
      </div>
    </div>
  );
}
