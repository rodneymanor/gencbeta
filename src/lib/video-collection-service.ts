// Production-ready video collection service

import { getAdminDb, isAdminInitialized } from "./firebase-admin";
import { CollectionsService, type Video } from "./collections";

export interface VideoCollectionResult {
  success: boolean;
  videoId?: string;
  message: string;
  error?: string;
  fallbackUsed?: boolean;
}

export interface VideoProcessingData {
  url: string;
  title?: string;
  platform: string;
  thumbnailUrl?: string;
  author?: string;
  duration?: number;
  transcript?: string;
  components?: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata?: {
    hashtags: string[];
    mentions: string[];
    description: string;
  };
  insights?: {
    engagementRate: number;
    contentType: string;
    keyTopics: string[];
    sentiment: "positive" | "negative" | "neutral";
    difficulty: "beginner" | "intermediate" | "advanced";
  };
  metrics?: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
}

export class VideoCollectionService {
  /**
   * Add a video to collection with comprehensive error handling and fallback
   */
  static async addVideoToCollection(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    try {
      console.log(`🎬 [VIDEO_COLLECTION] Adding video to collection: ${collectionId}`);

      // Validate inputs
      const validation = this.validateVideoData(videoData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error ?? "Invalid video data",
          error: validation.error,
        };
      }

      // Try advanced processing first
      try {
        const result = await this.addVideoWithAdvancedProcessing(userId, collectionId, videoData);
        if (result.success) {
          return result;
        }
      } catch (advancedError) {
        console.warn(`⚠️ [VIDEO_COLLECTION] Advanced processing failed, falling back to basic: ${advancedError}`);
      }

      // Fallback to basic processing
      const fallbackResult = await this.addVideoWithBasicProcessing(userId, collectionId, videoData);
      return {
        ...fallbackResult,
        fallbackUsed: true,
      };
    } catch (error) {
      console.error("❌ [VIDEO_COLLECTION] Unexpected error:", error);
      return {
        success: false,
        message: "Failed to add video to collection",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Advanced processing with full video analysis
   */
  private static async addVideoWithAdvancedProcessing(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    const adminDb = getAdminDb();

    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    // Create comprehensive video object
    const video: Omit<Video, "id"> = {
      url: videoData.url,
      title: videoData.title ?? this.generateTitleFromUrl(videoData.url),
      platform: videoData.platform,
      thumbnailUrl: videoData.thumbnailUrl ?? "",
      author: videoData.author ?? "Unknown",
      transcript: videoData.transcript ?? "",
      visualContext: "",
      fileSize: 0,
      duration: videoData.duration ?? 0,
      userId,
      collectionId,
      addedAt: new Date().toISOString(),
      components: videoData.components ?? {
        hook: "",
        bridge: "",
        nugget: "",
        wta: "",
      },
      contentMetadata: videoData.contentMetadata ?? {
        hashtags: [],
        mentions: [],
        description: videoData.title ?? "",
      },
      insights: videoData.insights ?? {
        engagementRate: 0,
        contentType: "general",
        keyTopics: [],
        sentiment: "neutral",
        difficulty: "beginner",
      },
    };

    const videoId = await CollectionsService.addVideoToCollection(userId, collectionId, video);

    return {
      success: true,
      videoId,
      message: "Video added successfully with advanced processing",
    };
  }

  /**
   * Basic processing as fallback
   */
  private static async addVideoWithBasicProcessing(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    try {
      // Create minimal video object that works with the existing schema
      const video: Omit<Video, "id"> = {
        url: videoData.url,
        title: videoData.title ?? this.generateTitleFromUrl(videoData.url),
        platform: videoData.platform,
        thumbnailUrl: videoData.thumbnailUrl ?? this.getDefaultThumbnail(videoData.platform),
        author: videoData.author ?? "Unknown Creator",
        transcript: videoData.transcript ?? "Transcript not available",
        visualContext: "Basic video import",
        fileSize: 0,
        duration: videoData.duration ?? 0,
        userId,
        collectionId,
        addedAt: new Date().toISOString(),
        components: {
          hook: "Auto-generated hook",
          bridge: "Auto-generated bridge",
          nugget: "Auto-generated nugget",
          wta: "Auto-generated CTA",
        },
        contentMetadata: {
          hashtags: this.extractHashtagsFromTitle(videoData.title ?? ""),
          mentions: [],
          description: videoData.title ?? "Imported video",
        },
        insights: {
          engagementRate: 0,
          contentType: this.inferContentType(videoData.platform),
          keyTopics: [],
          sentiment: "neutral",
          difficulty: "beginner",
        },
      };

      const videoId = await CollectionsService.addVideoToCollection(userId, collectionId, video);

      return {
        success: true,
        videoId,
        message: "Video added successfully with basic processing",
      };
    } catch (error) {
      console.error("❌ [VIDEO_COLLECTION] Basic processing failed:", error);
      return {
        success: false,
        message: "Failed to add video with basic processing",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate video data
   */
  private static validateVideoData(videoData: VideoProcessingData): { isValid: boolean; error?: string } {
    if (!videoData.url) {
      return { isValid: false, error: "Video URL is required" };
    }

    try {
      new URL(videoData.url);
    } catch {
      return { isValid: false, error: "Invalid video URL format" };
    }

    if (!videoData.platform) {
      return { isValid: false, error: "Platform is required" };
    }

    const supportedPlatforms = ["TikTok", "Instagram", "tiktok", "instagram"];
    if (!supportedPlatforms.includes(videoData.platform)) {
      return { isValid: false, error: "Only TikTok and Instagram videos are supported" };
    }

    return { isValid: true };
  }

  /**
   * Generate title from URL
   */
  private static generateTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("tiktok")) {
        return `TikTok Video - ${new Date().toLocaleDateString()}`;
      }

      if (hostname.includes("instagram")) {
        return `Instagram Video - ${new Date().toLocaleDateString()}`;
      }

      return `Video - ${new Date().toLocaleDateString()}`;
    } catch {
      return `Video - ${new Date().toLocaleDateString()}`;
    }
  }

  /**
   * Get default thumbnail based on platform
   */
  private static getDefaultThumbnail(platform: string): string {
    const platformLower = platform.toLowerCase();

    if (platformLower.includes("tiktok")) {
      return "/images/tiktok-placeholder.jpg";
    }

    if (platformLower.includes("instagram")) {
      return "/images/instagram-placeholder.jpg";
    }

    return "/images/video-placeholder.jpg";
  }

  /**
   * Extract hashtags from title
   */
  private static extractHashtagsFromTitle(title: string): string[] {
    const hashtagRegex = /#[\w-]+/g;
    const matches = title.match(hashtagRegex);
    return matches ? matches.map((tag) => tag.substring(1)) : [];
  }

  /**
   * Infer content type from platform
   */
  private static inferContentType(platform: string): string {
    const platformLower = platform.toLowerCase();

    if (platformLower.includes("tiktok")) {
      return "short-form";
    }

    if (platformLower.includes("instagram")) {
      return "social-media";
    }

    return "general";
  }

  /**
   * Validate platform URL
   */
  static validatePlatformUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("tiktok.com")) {
        return { isValid: true, platform: "TikTok" };
      }

      if (hostname.includes("instagram.com")) {
        return { isValid: true, platform: "Instagram" };
      }

      return {
        isValid: false,
        error: "Only TikTok and Instagram videos are currently supported",
      };
    } catch {
      return {
        isValid: false,
        error: "Invalid URL format",
      };
    }
  }

  /**
   * Create video processing data from URL
   */
  static createVideoDataFromUrl(url: string, title?: string): VideoProcessingData {
    const validation = this.validatePlatformUrl(url);

    return {
      url,
      title: title ?? this.generateTitleFromUrl(url),
      platform: validation.platform ?? "Unknown",
      thumbnailUrl: validation.platform ? this.getDefaultThumbnail(validation.platform) : undefined,
      author: "Unknown Creator",
      duration: 0,
    };
  }
}
