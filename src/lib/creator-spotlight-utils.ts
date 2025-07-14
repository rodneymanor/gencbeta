import { CreatorProfile } from "./creator-service";
import { VideoDocument } from "./video-service";

export interface EnhancedCreatorProfile extends CreatorProfile {
  // Add any spotlight-specific enhancements
  hasOptimizedMedia?: boolean;
}

export interface EnhancedCreatorVideo {
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

  // Bunny.net optimized URLs
  bunnyIframeUrl?: string; // For video playback
  bunnyThumbnailUrl?: string; // Optimized thumbnail
  originalVideoUrl?: string; // Original URL as fallback
}

/**
 * Convert VideoDocument to EnhancedCreatorVideo with Bunny URLs
 */
export function enhanceVideoWithBunny(
  video: VideoDocument,
  bunnyMediaUrls?: CreatorProfile["bunnyMediaUrls"],
): EnhancedCreatorVideo {
  const enhanced: EnhancedCreatorVideo = {
    id: video.id!,
    thumbnailUrl: video.thumbnail_url || "",
    duration: video.duration,
    likes: video.likeCount,
    views: video.viewCount,
    title: video.title,
    description: video.description,
    platform: video.platform,
    originalVideoUrl: video.video_url,
  };

  // Check if we have Bunny optimized URLs for this video
  if (bunnyMediaUrls) {
    // Find matching thumbnail
    const bunnyThumbnail = bunnyMediaUrls.videoThumbnails.find((thumb) => thumb.videoId === video.id);
    if (bunnyThumbnail) {
      enhanced.bunnyThumbnailUrl = bunnyThumbnail.thumbnailUrl;
      enhanced.thumbnailUrl = bunnyThumbnail.thumbnailUrl; // Use optimized as primary
    }

    // Find matching video
    const bunnyVideo = bunnyMediaUrls.lowQualityVideos.find((vid) => vid.videoId === video.id);
    if (bunnyVideo) {
      enhanced.bunnyIframeUrl = bunnyVideo.bunnyIframeUrl;
    }
  }

  return enhanced;
}

/**
 * Enhance creator profile for spotlight display
 */
export function enhanceCreatorForSpotlight(creator: CreatorProfile): EnhancedCreatorProfile {
  const enhanced: EnhancedCreatorProfile = {
    ...creator,
    hasOptimizedMedia: !!(creator.bunnyMediaUrls && creator.bunnyUploadedAt),
  };

  // Use Bunny profile image if available
  if (creator.bunnyProfileImageUrl) {
    enhanced.profileImageUrl = creator.bunnyMediaUrls?.profileImage?.thumbnailUrl || creator.profileImageUrl;
  }

  return enhanced;
}

/**
 * Get display-optimized profile image URL
 */
export function getOptimizedProfileImageUrl(creator: CreatorProfile): string {
  // Prefer Bunny thumbnail for faster loading, fallback to original
  if (creator.bunnyMediaUrls?.profileImage?.thumbnailUrl) {
    return creator.bunnyMediaUrls.profileImage.thumbnailUrl;
  }
  return creator.profileImageUrl;
}

/**
 * Get video display mode based on available media
 */
export function getVideoDisplayMode(creator: CreatorProfile): "instagram" | "grid" {
  // Use Instagram-style display if we have optimized media
  return creator.bunnyMediaUrls && creator.bunnyMediaUrls.lowQualityVideos.length > 0 ? "instagram" : "grid";
}

/**
 * Check if creator needs media optimization
 */
export function needsMediaOptimization(creator: CreatorProfile): boolean {
  // Need optimization if:
  // 1. No Bunny media at all
  // 2. Media is older than 7 days
  // 3. Video count has increased significantly since last upload

  if (!creator.bunnyMediaUrls || !creator.bunnyUploadedAt) {
    return true;
  }

  const uploadDate = new Date(creator.bunnyUploadedAt);
  const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpload > 7) {
    return true;
  }

  // Check if video count has grown significantly
  const bunnyVideoCount = creator.bunnyMediaUrls.lowQualityVideos.length;
  const currentVideoCount = creator.videoCount || 0;

  if (currentVideoCount > bunnyVideoCount + 5) {
    return true;
  }

  return false;
}

/**
 * Convert EnhancedCreatorVideo to VideoWithPlayer format for VideoLightbox compatibility
 */
export function convertToVideoWithPlayer(video: EnhancedCreatorVideo): any {
  return {
    id: video.id,
    originalUrl: video.originalVideoUrl || "",
    iframeUrl: video.bunnyIframeUrl || video.originalVideoUrl || "",
    directUrl: video.originalVideoUrl || "",
    platform: video.platform,
    thumbnailUrl: video.thumbnailUrl,
    title: video.title || "",
    transcript: undefined,
    components: undefined,
    visualContext: undefined,
    metrics: {
      likes: video.likes || 0,
      comments: 0,
      shares: 0,
      views: video.views || 0,
      saves: 0,
    },
    metadata: {
      originalUrl: video.originalVideoUrl || "",
      platform: video.platform,
      downloadedAt: video.addedAt || new Date().toISOString(),
      author: undefined,
      duration: video.duration,
      description: video.description,
      hashtags: [],
    },
    transcriptionStatus: undefined,
    userId: undefined,
    collectionId: video.collectionId,
    addedAt: video.addedAt || new Date().toISOString(),
    fileSize: undefined,
    duration: video.duration,
    favorite: video.favorite || false,
    isPlaying: false,
  };
}
