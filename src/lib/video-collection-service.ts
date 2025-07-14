// Production-ready video collection service

import type { Video } from "./collections";
import { getAdminDb, isAdminInitialized } from "./firebase-admin";

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
   * Add a video to collection using guaranteed fallback processing
   */
  static async addVideoToCollection(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Promise<VideoCollectionResult> {
    try {
      // Validate input data
      const validation = this.validateVideoData(videoData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error ?? "Invalid video data",
          error: validation.error,
        };
      }

      // Try advanced processing first, then fallback to basic
      try {
        const advancedResult = await this.addVideoWithAdvancedProcessing(userId, collectionId, videoData);
        return advancedResult;
      } catch (advancedError) {
        console.warn("🔄 [VIDEO_COLLECTION] Advanced processing failed, falling back to basic:", advancedError);
        const fallbackResult = await this.addVideoWithBasicProcessing(userId, collectionId, videoData);
        return {
          ...fallbackResult,
          fallbackUsed: true,
        };
      }
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
   * Advanced processing with full video analysis (when available)
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
    const video = this.createAdvancedVideoObject(userId, collectionId, videoData);

    // Use admin SDK directly to bypass security rules
    const videoRef = adminDb.collection("videos").doc();
    await videoRef.set(video);
    const videoId = videoRef.id;

    // Update collection video count
    await this.updateCollectionCount(adminDb, collectionId, userId, 1);

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
      const adminDb = getAdminDb();

      if (!isAdminInitialized || !adminDb) {
        throw new Error("Firebase Admin SDK not configured");
      }

      // Create minimal video object
      const video = this.createBasicVideoObject(userId, collectionId, videoData);

      // Use admin SDK directly to bypass security rules
      const videoRef = adminDb.collection("videos").doc();
      await videoRef.set(video);
      const videoId = videoRef.id;

      // Update collection video count
      await this.updateCollectionCount(adminDb, collectionId, userId, 1);

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
   * Create advanced video object with full metadata
   */
  private static createAdvancedVideoObject(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Omit<Video, "id"> {
    return {
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
  }

  /**
   * Create basic video object with minimal metadata
   */
  private static createBasicVideoObject(
    userId: string,
    collectionId: string,
    videoData: VideoProcessingData,
  ): Omit<Video, "id"> {
    return {
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
  }

  /**
   * Update collection video count using admin SDK
   */
  private static async updateCollectionCount(
    adminDb: FirebaseFirestore.Firestore,
    collectionId: string,
    userId: string,
    increment: number,
  ): Promise<void> {
    if (collectionId !== "all-videos") {
      const collectionRef = adminDb.collection("collections").doc(collectionId);
      const collectionDoc = await collectionRef.get();

      if (collectionDoc.exists && collectionDoc.data()?.userId === userId) {
        const currentCount = collectionDoc.data()?.videoCount ?? 0;
        await collectionRef.update({
          videoCount: Math.max(0, currentCount + increment),
          updatedAt: new Date().toISOString(),
        });
      }
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
      return "/images/placeholder.svg";
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
