import { useState, useEffect, useCallback } from "react";

import { CreatorProfile } from "@/lib/creator-service";
import {
  EnhancedCreatorProfile,
  EnhancedCreatorVideo,
  enhanceCreatorForSpotlight,
  enhanceVideoWithBunny,
  needsMediaOptimization,
} from "@/lib/creator-spotlight-utils";

export function useCreators() {
  const [creators, setCreators] = useState<EnhancedCreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/creators");

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Unauthorized access to creators API - using mock data");
          // Fallback to mock data for development
          const mockCreators: CreatorProfile[] = [
            {
              id: "1",
              username: "tiktok_creator_1",
              displayName: "TikTok Star",
              platform: "tiktok",
              profileImageUrl: "https://via.placeholder.com/150x150/FF0050/FFFFFF?text=TS",
              bio: "Creating amazing TikTok content! 🎵",
              postsCount: 150,
              followersCount: 2500000,
              followingCount: 500,
              isVerified: true,
              videoCount: 45,
              lastProcessed: "2024-01-15T10:30:00Z",
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-15T10:30:00Z",
            },
            {
              id: "2",
              username: "instagram_creator_1",
              displayName: "Instagram Influencer",
              platform: "instagram",
              profileImageUrl: "https://via.placeholder.com/150x150/E4405F/FFFFFF?text=II",
              bio: "Lifestyle and fashion content 📸",
              postsCount: 320,
              followersCount: 1800000,
              followingCount: 1200,
              isVerified: true,
              videoCount: 28,
              lastProcessed: "2024-01-14T15:45:00Z",
              createdAt: "2024-01-02T00:00:00Z",
              updatedAt: "2024-01-14T15:45:00Z",
            },
            {
              id: "3",
              username: "tiktok_creator_2",
              displayName: "Comedy Creator",
              platform: "tiktok",
              profileImageUrl: "https://via.placeholder.com/150x150/FF0050/FFFFFF?text=CC",
              bio: "Making people laugh one video at a time 😂",
              postsCount: 89,
              followersCount: 850000,
              followingCount: 200,
              isVerified: false,
              videoCount: 32,
              lastProcessed: "2024-01-13T09:20:00Z",
              createdAt: "2024-01-03T00:00:00Z",
              updatedAt: "2024-01-13T09:20:00Z",
            },
          ];
          setCreators(mockCreators);
          return;
        }
        throw new Error(`Failed to load creators: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        // Enhance creators with Bunny optimization data
        const enhancedCreators = data.creators.map((creator: CreatorProfile) => enhanceCreatorForSpotlight(creator));
        setCreators(enhancedCreators);
      } else {
        console.error("Error loading creators:", data.error);
        // Fallback to empty array
        setCreators([]);
      }
    } catch (error) {
      console.error("Error loading creators:", error);
      // Fallback to empty array
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  return { creators, loading, loadCreators };
}

export function useCreatorVideos() {
  const [creatorVideos, setCreatorVideos] = useState<EnhancedCreatorVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const loadStoredVideos = useCallback(async (creator: EnhancedCreatorProfile): Promise<boolean> => {
    const videosResponse = await fetch(`/api/creators/${creator.id}/videos`);

    if (videosResponse.ok) {
      const videosData = await videosResponse.json();

      if (videosData.success && videosData.videos && videosData.videos.length > 0) {
        console.log(`✅ [CREATOR_VIDEOS] Found ${videosData.videos.length} stored videos for @${creator.username}`);

        // Enhance videos with Bunny URLs if available
        const enhancedVideos = videosData.videos.map((video: any) =>
          enhanceVideoWithBunny(video, creator.bunnyMediaUrls),
        );

        setCreatorVideos(enhancedVideos);

        // Trigger media optimization if needed (background process)
        if (needsMediaOptimization(creator)) {
          console.log(`🔄 [CREATOR_VIDEOS] Creator @${creator.username} needs media optimization`);
          triggerMediaOptimization(creator.id!);
        }

        return true;
      }
    }
    return false;
  }, []);

  const loadFreshVideos = useCallback(async (creator: EnhancedCreatorProfile) => {
    console.log(`🔄 [CREATOR_VIDEOS] No stored videos found, fetching fresh data for @${creator.username}`);
    const response = await fetch("/api/process-creator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: creator.username,
        platform: creator.platform,
        videoCount: 20,
      }),
    });

    if (!response.ok) {
      if (response.status === 500) {
        console.warn("API server error - using mock videos");
        throw new Error("API_UNAVAILABLE");
      }
      throw new Error("Failed to load creator videos");
    }

    const data = await response.json();

    if (data.success && data.extractedVideos) {
      const videos: EnhancedCreatorVideo[] = data.extractedVideos.map((video: Record<string, unknown>) => ({
        id: video.id as string,
        thumbnailUrl: (video.thumbnail_url as string) ?? "https://via.placeholder.com/300x400",
        duration: video.duration as number,
        likes: video.likeCount as number,
        views: video.viewCount as number,
        title: video.title as string,
        description: video.description as string,
        platform: video.platform as "tiktok" | "instagram",
        addedAt: new Date().toISOString(),
        originalVideoUrl: video.video_url as string,
      }));

      setCreatorVideos(videos);

      // Trigger media optimization for new videos (background process)
      triggerMediaOptimization(creator.id!);
    }
  }, []);

  const createMockVideos = useCallback((creator: EnhancedCreatorProfile): EnhancedCreatorVideo[] => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: `video_${i}`,
      thumbnailUrl: `https://via.placeholder.com/300x400/${creator.platform === "tiktok" ? "FF0050" : "E4405F"}/FFFFFF?text=V${i + 1}`,
      duration: Math.floor(Math.random() * 60) + 15,
      likes: Math.floor(Math.random() * 100000) + 1000,
      views: Math.floor(Math.random() * 1000000) + 10000,
      title: `${creator.displayName} Video ${i + 1}`,
      description: `Amazing content from ${creator.displayName}`,
      platform: creator.platform,
      addedAt: new Date().toISOString(),
      originalVideoUrl: `https://example.com/video_${i}.mp4`,
    }));
  }, []);

  const loadCreatorVideos = useCallback(async (creator: EnhancedCreatorProfile) => {
    try {
      setLoadingVideos(true);

      // First try to get stored videos from the creator's video collection
      const hasStoredVideos = await loadStoredVideos(creator);
      if (hasStoredVideos) {
        return;
      }

      // Fallback: Call process-creator API to get fresh videos if no stored videos
      await loadFreshVideos(creator);
    } catch (error) {
      console.error("Error loading creator videos:", error);

      // Check if it's an API unavailability error
      if (error instanceof Error && error.message === "API_UNAVAILABLE") {
        console.log("Using mock videos due to API unavailability");
      }

      // Fallback to mock data
      const mockVideos = createMockVideos(creator);
      setCreatorVideos(mockVideos);
    } finally {
      setLoadingVideos(false);
    }
  }, [loadStoredVideos, loadFreshVideos, createMockVideos]);

  const clearVideos = useCallback(() => {
    setCreatorVideos([]);
  }, []);

  return { creatorVideos, loadingVideos, loadCreatorVideos, clearVideos };
}

/**
 * Trigger background media optimization for a creator
 */
function triggerMediaOptimization(creatorId: string) {
  // Non-blocking background call to optimize media
  setTimeout(async () => {
    try {
      console.log(`🚀 [MEDIA_OPTIMIZATION] Starting background optimization for creator: ${creatorId}`);

      const response = await fetch("/api/creator/upload-media", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId,
          adminKey: "GenC-Admin-Sync-2025", // TODO: Make this configurable
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ [MEDIA_OPTIMIZATION] Completed optimization for creator: ${creatorId}`, {
          cached: result.cached,
          profileImage: !!result.results?.profileImage,
          thumbnails: result.results?.videoThumbnails?.length ?? 0,
          videos: result.results?.lowQualityVideos?.length ?? 0,
        });
      } else {
        console.warn(`⚠️ [MEDIA_OPTIMIZATION] Failed to optimize media for creator: ${creatorId}`);
      }
    } catch (error) {
      console.error(`❌ [MEDIA_OPTIMIZATION] Error optimizing media for creator: ${creatorId}`, error);
    }
  }, 1000); // Start after 1 second delay
}
