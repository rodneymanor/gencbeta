import { uploadToBunnyStream, generateBunnyThumbnailUrl, extractVideoIdFromIframeUrl } from "./bunny-stream";
import { CreatorService, CreatorProfile } from "./creator-service";
import { VideoService, VideoDocument } from "./video-service";

export interface CreatorMediaUrls {
  profileImage?: {
    originalUrl: string;
    bunnyIframeUrl: string;
    thumbnailUrl: string;
    videoId: string;
  };
  videoThumbnails: Array<{
    videoId: string;
    originalUrl: string;
    bunnyIframeUrl: string;
    thumbnailUrl: string;
  }>;
  lowQualityVideos: Array<{
    videoId: string;
    originalUrl: string;
    bunnyIframeUrl: string;
    thumbnailUrl: string;
  }>;
}

export class CreatorMediaService {
  /**
   * Upload all media for a creator to Bunny.net for use in creator spotlight
   * This includes profile image, video thumbnails, and low-quality videos
   */
  static async uploadCreatorMediaToBunny(creatorId: string): Promise<CreatorMediaUrls | null> {
    try {
      console.log(`🎬 [CREATOR_MEDIA_SERVICE] Starting media upload for creator: ${creatorId}`);

      // Get creator profile
      const creator = await CreatorService.getCreatorById(creatorId);
      if (!creator) {
        console.error(`❌ [CREATOR_MEDIA_SERVICE] Creator not found: ${creatorId}`);
        return null;
      }

      console.log(`✅ [CREATOR_MEDIA_SERVICE] Found creator @${creator.username} on ${creator.platform}`);
      
      // Validate Bunny.net environment variables
      const requiredEnvVars = ['BUNNY_STREAM_LIBRARY_ID', 'BUNNY_STREAM_API_KEY', 'BUNNY_CDN_HOSTNAME'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error(`❌ [CREATOR_MEDIA_SERVICE] Missing required environment variables: ${missingVars.join(', ')}`);
        return null;
      }
      
      console.log(`✅ [CREATOR_MEDIA_SERVICE] Bunny.net environment variables validated`);
      
      // Double-check if creator already has recent Bunny media (prevent race conditions)
      const existingMedia = (creator as any).bunnyMediaUrls;
      const uploadedAt = (creator as any).bunnyUploadedAt;
      
      if (existingMedia && uploadedAt) {
        const uploadDate = new Date(uploadedAt);
        const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceUpload < 1) { // If uploaded within last day, use existing
          console.log(`♻️ [CREATOR_MEDIA_SERVICE] Using existing recent Bunny media (${daysSinceUpload.toFixed(1)} days old)`);
          return existingMedia;
        }
      }

      const results: CreatorMediaUrls = {
        videoThumbnails: [],
        lowQualityVideos: [],
      };

      // Step 1: Upload profile image to Bunny if available
      if (creator.profileImageUrl && !creator.profileImageUrl.startsWith("/")) {
        console.log(`📸 [CREATOR_MEDIA_SERVICE] Uploading profile image...`);
        try {
          const profileResult = await this.uploadImageToBunny(
            creator.profileImageUrl,
            `${creator.username}_profile_${creator.platform}_${Date.now()}.jpg`,
          );

          if (profileResult) {
            results.profileImage = profileResult;
            console.log(`✅ [CREATOR_MEDIA_SERVICE] Profile image uploaded successfully`);
          }
        } catch (error) {
          console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to upload profile image:`, error);
        }
      } else if (creator.profileImageUrl?.startsWith("/")) {
        console.log(`⚠️ [CREATOR_MEDIA_SERVICE] Skipping relative URL profile image: ${creator.profileImageUrl}`);
      }

      // Step 2: Get creator videos
      const videos = await VideoService.getVideosByCreatorId(creatorId);
      console.log(`📹 [CREATOR_MEDIA_SERVICE] Found ${videos.length} videos for creator`);

      // Process videos (limit to 10 to avoid overwhelming Bunny and for spotlight display)
      const videosToProcess = videos
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)) // Sort by view count
        .slice(0, 10);

      for (let i = 0; i < videosToProcess.length; i++) {
        const video = videosToProcess[i];
        console.log(`🔄 [CREATOR_MEDIA_SERVICE] Processing video ${i + 1}/${videosToProcess.length}: ${video.id}`);

        // Upload video thumbnail
        if (video.thumbnail_url) {
          try {
            const thumbnailResult = await this.uploadImageToBunny(
              video.thumbnail_url,
              `${creator.username}_thumb_${video.id}_${Date.now()}.jpg`,
            );

            if (thumbnailResult) {
              results.videoThumbnails.push({
                videoId: video.id!,
                originalUrl: video.thumbnail_url,
                bunnyIframeUrl: thumbnailResult.bunnyIframeUrl,
                thumbnailUrl: thumbnailResult.thumbnailUrl,
              });
              console.log(`✅ [CREATOR_MEDIA_SERVICE] Thumbnail ${i + 1} uploaded`);
            }
          } catch (error) {
            console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to upload thumbnail ${i + 1}:`, error);
          }
        }

        // Upload low-quality video for iframe display
        if (video.video_url) {
          try {
            const videoResult = await this.uploadVideoToBunny(
              video.video_url,
              `${creator.username}_video_${video.id}_${Date.now()}.mp4`,
            );

            if (videoResult) {
              results.lowQualityVideos.push({
                videoId: video.id!,
                originalUrl: video.video_url,
                bunnyIframeUrl: videoResult.bunnyIframeUrl,
                thumbnailUrl: videoResult.thumbnailUrl,
              });
              console.log(`✅ [CREATOR_MEDIA_SERVICE] Video ${i + 1} uploaded`);
            }
          } catch (error) {
            console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to upload video ${i + 1}:`, error);
          }
        }

        // Rate limiting: wait between uploads
        if (i < videosToProcess.length - 1) {
          console.log(`⏳ [CREATOR_MEDIA_SERVICE] Waiting 2s before next upload...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Step 3: Update creator profile with Bunny URLs
      await this.updateCreatorWithBunnyUrls(creatorId, results);

      console.log(`🎉 [CREATOR_MEDIA_SERVICE] Upload completed for @${creator.username}`);
      console.log(
        `📊 [CREATOR_MEDIA_SERVICE] Results: Profile: ${results.profileImage ? "✅" : "❌"}, Thumbnails: ${results.videoThumbnails.length}, Videos: ${results.lowQualityVideos.length}`,
      );

      return results;
    } catch (error) {
      console.error(`🔥 [CREATOR_MEDIA_SERVICE] Failed to upload creator media:`, error);
      return null;
    }
  }

  /**
   * Upload an image to Bunny.net and get iframe URL + thumbnail
   */
  private static async uploadImageToBunny(
    imageUrl: string,
    filename: string,
  ): Promise<{
    bunnyIframeUrl: string;
    thumbnailUrl: string;
    videoId: string;
  } | null> {
    try {
      console.log(`🖼️ [CREATOR_MEDIA_SERVICE] Downloading image: ${imageUrl.substring(0, 80)}...`);

      // Download image with proper headers
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`📊 [CREATOR_MEDIA_SERVICE] Downloaded ${buffer.length} bytes`);

      // Upload to Bunny Stream
      const result = await uploadToBunnyStream(buffer, filename, "image/jpeg");

      if (!result) {
        throw new Error("Bunny upload returned null");
      }

      // Extract video ID and generate thumbnail URL
      const videoId = extractVideoIdFromIframeUrl(result.cdnUrl);
      if (!videoId) {
        throw new Error("Could not extract video ID from iframe URL");
      }

      const thumbnailUrl = generateBunnyThumbnailUrl(videoId);

      return {
        bunnyIframeUrl: result.cdnUrl,
        thumbnailUrl: thumbnailUrl || result.cdnUrl,
        videoId,
      };
    } catch (error) {
      console.error(`❌ [CREATOR_MEDIA_SERVICE] Image upload failed:`, error);
      return null;
    }
  }

  /**
   * Upload a video to Bunny.net and get iframe URL + thumbnail
   */
  private static async uploadVideoToBunny(
    videoUrl: string,
    filename: string,
  ): Promise<{
    bunnyIframeUrl: string;
    thumbnailUrl: string;
    videoId: string;
  } | null> {
    try {
      console.log(`🎬 [CREATOR_MEDIA_SERVICE] Downloading video: ${videoUrl.substring(0, 80)}...`);

      // Download video with proper headers
      const response = await fetch(videoUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "video/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`📊 [CREATOR_MEDIA_SERVICE] Downloaded ${buffer.length} bytes`);

      // Upload to Bunny Stream
      const result = await uploadToBunnyStream(buffer, filename, "video/mp4");

      if (!result) {
        throw new Error("Bunny upload returned null");
      }

      // Extract video ID and generate thumbnail URL
      const videoId = extractVideoIdFromIframeUrl(result.cdnUrl);
      if (!videoId) {
        throw new Error("Could not extract video ID from iframe URL");
      }

      const thumbnailUrl = generateBunnyThumbnailUrl(videoId);

      return {
        bunnyIframeUrl: result.cdnUrl,
        thumbnailUrl: thumbnailUrl || result.cdnUrl,
        videoId,
      };
    } catch (error) {
      console.error(`❌ [CREATOR_MEDIA_SERVICE] Video upload failed:`, error);
      return null;
    }
  }

  /**
   * Update creator profile with Bunny URLs for faster loading in spotlight
   */
  private static async updateCreatorWithBunnyUrls(creatorId: string, mediaUrls: CreatorMediaUrls): Promise<void> {
    try {
      const updates: any = {
        bunnyMediaUrls: mediaUrls,
        bunnyUploadedAt: new Date().toISOString(),
      };

      // If we have a profile image, also update the main profile image URL
      if (mediaUrls.profileImage) {
        updates.bunnyProfileImageUrl = mediaUrls.profileImage.bunnyIframeUrl;
      }

      await CreatorService.updateCreator(creatorId, updates);
      console.log(`✅ [CREATOR_MEDIA_SERVICE] Updated creator ${creatorId} with Bunny URLs`);
    } catch (error) {
      console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to update creator with Bunny URLs:`, error);
    }
  }

  /**
   * Check if creator already has Bunny media uploaded (to avoid re-processing)
   */
  static async hasCreatorBunnyMedia(creatorId: string): Promise<boolean> {
    try {
      const creator = await CreatorService.getCreatorById(creatorId);
      return !!(creator && (creator as any).bunnyMediaUrls && (creator as any).bunnyUploadedAt);
    } catch (error) {
      console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to check Bunny media status:`, error);
      return false;
    }
  }

  /**
   * Get Bunny media URLs for a creator
   */
  static async getCreatorBunnyMedia(creatorId: string): Promise<CreatorMediaUrls | null> {
    try {
      const creator = await CreatorService.getCreatorById(creatorId);
      return creator ? (creator as any).bunnyMediaUrls || null : null;
    } catch (error) {
      console.error(`❌ [CREATOR_MEDIA_SERVICE] Failed to get Bunny media:`, error);
      return null;
    }
  }
}
