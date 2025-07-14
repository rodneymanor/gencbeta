"use client";

import React, { useState, useCallback } from "react";

import { ArrowLeft } from "lucide-react";

import { SocialHeader } from "@/components/extract/social-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstagramVideoGrid } from "@/components/ui/instagram-video-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import {
  EnhancedCreatorProfile,
  EnhancedCreatorVideo,
  getOptimizedProfileImageUrl,
  convertToVideoWithPlayer,
} from "@/lib/creator-spotlight-utils";

interface CreatorDetailViewProps {
  creator: EnhancedCreatorProfile;
  videos: EnhancedCreatorVideo[];
  loadingVideos: boolean;
  onBack: () => void;
}

export function CreatorDetailView({ creator, videos, loadingVideos, onBack }: CreatorDetailViewProps) {
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);

  // Convert videos to VideoWithPlayer format for lightbox compatibility
  const convertedVideos = videos.map(convertToVideoWithPlayer);

  // Video click handler to open lightbox
  const handleVideoClick = useCallback((video: any, index: number) => {
    setCurrentVideoIndex(index);
    setLightboxOpen(true);
  }, []);

  // Video favoriting handler (placeholder for now)
  const handleVideoFavorite = useCallback((video: any, index: number) => {
    console.log("Favorite clicked:", video, index);
    // TODO: Implement favorite functionality for creator videos
  }, []);

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
        profileImageUrl={getOptimizedProfileImageUrl(creator)}
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
        priority={true}
      />

      {/* Videos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Videos</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {creator.platform}
            </Badge>
            {creator.hasOptimizedMedia && (
              <Badge variant="outline" className="border-green-600 text-green-600">
                ⚡ Optimized
              </Badge>
            )}
          </div>
        </div>

        {loadingVideos ? (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[9/16] w-full" />
            ))}
          </div>
        ) : (
          <div className="mx-auto w-[935px]">
            <InstagramVideoGrid
              videos={videos}
              onVideoClick={handleVideoClick}
              onFavorite={handleVideoFavorite}
              renderBadge={(video, idx) =>
                (video as any).addedAt &&
                Date.now() - new Date((video as any).addedAt).getTime() < 1000 * 60 * 60 * 24 ? (
                  <Badge className="ml-2 bg-green-500 text-white">New</Badge>
                ) : null
              }
            />
          </div>
        )}
      </div>

      {/* Video Lightbox Modal */}
      <VideoLightbox
        videos={convertedVideos}
        currentIndex={currentVideoIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onChangeIndex={setCurrentVideoIndex}
      />
    </div>
  );
}
