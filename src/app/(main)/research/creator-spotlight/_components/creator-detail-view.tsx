"use client";

import React, { useState, useCallback } from "react";

import { ArrowLeft, MoreVertical, Download, Share, Heart, ChevronDown } from "lucide-react";

import { SocialHeader } from "@/components/extract/social-header";
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

interface ActionMenuProps {
  creator: EnhancedCreatorProfile;
}

function ActionMenu({ creator }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDownloadData = () => {
    console.log("Download creator data:", creator);
    setIsOpen(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${creator.displayName || creator.username} - Creator Profile`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    setIsOpen(false);
  };

  const handleFavorite = () => {
    console.log("Toggle favorite creator:", creator);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground md:hover:text-foreground focus:ring-ring flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none md:hover:bg-black/5 dark:md:hover:bg-white/5"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Menu */}
          <div className="bg-card border-border visible absolute right-0 z-20 mt-2 w-48 origin-top-right scale-100 rounded-lg border py-2 opacity-100 transition-all duration-200">
            <button
              onClick={handleDownloadData}
              className="text-foreground flex w-full items-center gap-3 px-4 py-2 text-sm font-normal transition-colors duration-200 md:hover:bg-black/5 dark:md:hover:bg-white/5"
            >
              <Download className="h-4 w-4" />
              Download Data
            </button>
            <button
              onClick={handleShare}
              className="text-foreground flex w-full items-center gap-3 px-4 py-2 text-sm font-normal transition-colors duration-200 md:hover:bg-black/5 dark:md:hover:bg-white/5"
            >
              <Share className="h-4 w-4" />
              Share Profile
            </button>
            <button
              onClick={handleFavorite}
              className="text-foreground flex w-full items-center gap-3 px-4 py-2 text-sm font-normal transition-colors duration-200 md:hover:bg-black/5 dark:md:hover:bg-white/5"
            >
              <Heart className="h-4 w-4" />
              Add to Favorites
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function CreatorDetailView({ creator, videos, loadingVideos, onBack }: CreatorDetailViewProps) {
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);

  // Progressive loading state
  const [visibleVideoCount, setVisibleVideoCount] = useState(8);
  const [showingAllVideos, setShowingAllVideos] = useState(false);

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

  // Progressive loading handlers
  const handleLoadMore = () => {
    const newCount = visibleVideoCount + 8;
    if (newCount >= videos.length) {
      setVisibleVideoCount(videos.length);
      setShowingAllVideos(true);
    } else {
      setVisibleVideoCount(newCount);
    }
  };

  const handleShowLess = () => {
    setVisibleVideoCount(8);
    setShowingAllVideos(false);
  };

  // Get visible videos
  const visibleVideos = videos.slice(0, visibleVideoCount);
  const hasMoreVideos = videos.length > visibleVideoCount;

  return (
    <div className="mx-auto max-w-screen-xl space-y-[var(--space-4)] px-[var(--space-3)] md:px-[var(--space-6)]">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="text-muted-foreground md:hover:text-foreground focus:ring-ring flex items-center gap-[var(--space-1)] text-sm font-normal transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Creators
      </button>

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
        className="bg-muted rounded-xl"
        priority={true}
      />

      {/* Videos Section */}
      <div className="space-y-[var(--space-2)]">
        <div className="flex flex-col space-y-[var(--space-1)] md:flex-row md:items-center md:justify-between md:space-y-0">
          <h2 className="text-foreground text-2xl leading-tight font-medium">Videos</h2>
          <div className="flex items-center gap-[var(--space-1)]">
            <span className="text-muted-foreground text-sm font-normal capitalize">{creator.platform}</span>
            {creator.hasOptimizedMedia && (
              <span className="text-muted-foreground text-sm font-normal">⚡ Optimized</span>
            )}
            <ActionMenu creator={creator} />
          </div>
        </div>

        {loadingVideos ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="aspect-[9/16] w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <InstagramVideoGrid
              videos={visibleVideos}
              onVideoClick={handleVideoClick}
              onFavorite={handleVideoFavorite}
              renderBadge={(video, idx) =>
                (video as any).addedAt &&
                Date.now() - new Date((video as any).addedAt).getTime() < 1000 * 60 * 60 * 24 ? (
                  <span className="text-muted-foreground ml-2">New</span>
                ) : null
              }
            />

            {/* Progressive Loading Controls */}
            {(hasMoreVideos || showingAllVideos) && (
              <div className="flex flex-col items-center space-y-3 pt-4">
                <div className="text-muted-foreground text-sm font-normal">
                  Showing {visibleVideos.length} of {videos.length} videos
                </div>

                <div className="flex gap-2">
                  {hasMoreVideos && (
                    <button
                      onClick={handleLoadMore}
                      className="text-primary md:hover:text-primary/90 md:hover:bg-primary/10 focus:ring-ring flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-normal transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none"
                    >
                      <span>Load More Videos</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}

                  {showingAllVideos && visibleVideoCount > 8 && (
                    <button
                      onClick={handleShowLess}
                      className="text-muted-foreground md:hover:text-foreground focus:ring-ring flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-normal transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none md:hover:bg-black/5 dark:md:hover:bg-white/5"
                    >
                      <span>Show Less</span>
                      <ChevronDown className="h-4 w-4 rotate-180" />
                    </button>
                  )}
                </div>
              </div>
            )}
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
