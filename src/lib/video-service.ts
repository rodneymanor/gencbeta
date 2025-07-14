import { adminDb } from "./firebase-admin";

export interface VideoDocument {
  id?: string;
  creatorId: string; // Reference to creator profile
  platform: "tiktok" | "instagram";
  video_url: string;
  thumbnail_url?: string;
  original_thumbnail_url?: string; // Original thumbnail URL before Bunny optimization
  bunny_thumbnail_url?: string; // Bunny.net optimized thumbnail URL
  viewCount: number;
  likeCount: number;
  quality: string;
  title?: string;
  description?: string;
  author?: string;
  duration?: number;

  // Processing status fields
  downloadStatus?: "pending" | "downloading" | "completed" | "failed";
  transcriptionStatus?: "pending" | "transcribing" | "completed" | "failed";
  downloadUrl?: string; // CDN URL after download
  transcriptionId?: string; // ID of transcription result

  // Metadata
  createdAt: string;
  updatedAt: string;
  processedAt?: string; // When the video was first extracted/processed
}

export class VideoService {
  private static readonly VIDEOS_COLLECTION = "videos";

  /**
   * Create multiple videos for a creator
   */
  static async createVideosForCreator(
    creatorId: string,
    videos: Omit<VideoDocument, "id" | "creatorId" | "createdAt" | "updatedAt">[],
  ): Promise<VideoDocument[]> {
    try {
      console.log(`📹 [VIDEO_SERVICE] Creating ${videos.length} videos for creator ${creatorId}...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const now = new Date().toISOString();
      const createdVideos: VideoDocument[] = [];

      // Use batch write for better performance
      const batch = adminDb.batch();
      const videoRefs: any[] = [];

      for (const video of videos) {
        const videoRef = adminDb.collection(this.VIDEOS_COLLECTION).doc();
        videoRefs.push(videoRef);

        const videoData = {
          ...video,
          creatorId,
          createdAt: now,
          updatedAt: now,
          processedAt: now,
        };

        // Filter out undefined values
        const cleanedData = Object.fromEntries(Object.entries(videoData).filter(([_, value]) => value !== undefined));

        batch.set(videoRef, cleanedData);
      }

      await batch.commit();

      // Build response with IDs
      for (let i = 0; i < videoRefs.length; i++) {
        createdVideos.push({
          id: videoRefs[i].id,
          creatorId,
          ...videos[i],
          createdAt: now,
          updatedAt: now,
          processedAt: now,
        } as VideoDocument);
      }

      console.log(`✅ [VIDEO_SERVICE] Successfully created ${createdVideos.length} videos for creator ${creatorId}`);
      return createdVideos;
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to create videos for creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get all videos for a creator
   */
  static async getVideosByCreatorId(creatorId: string): Promise<VideoDocument[]> {
    try {
      console.log(`🔍 [VIDEO_SERVICE] Fetching videos for creator ${creatorId}...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb.collection(this.VIDEOS_COLLECTION).where("creatorId", "==", creatorId).get();

      const videos: VideoDocument[] = [];
      snapshot.forEach((doc: any) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
        } as VideoDocument);
      });

      console.log(`📊 [VIDEO_SERVICE] Retrieved ${videos.length} videos for creator ${creatorId}`);
      return videos;
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to fetch videos for creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  static async getVideoById(videoId: string): Promise<VideoDocument | null> {
    try {
      console.log(`🔍 [VIDEO_SERVICE] Fetching video ${videoId}...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb.collection(this.VIDEOS_COLLECTION).doc(videoId).get();

      if (!snapshot.exists) {
        console.log(`❌ [VIDEO_SERVICE] Video ${videoId} not found`);
        return null;
      }

      const video = {
        id: snapshot.id,
        ...snapshot.data(),
      } as VideoDocument;

      console.log(`✅ [VIDEO_SERVICE] Found video ${videoId}`);
      return video;
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to fetch video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Update video processing status
   */
  static async updateVideoStatus(
    videoId: string,
    updates: {
      downloadStatus?: VideoDocument["downloadStatus"];
      transcriptionStatus?: VideoDocument["transcriptionStatus"];
      downloadUrl?: string;
      transcriptionId?: string;
    },
  ): Promise<void> {
    try {
      console.log(`🔄 [VIDEO_SERVICE] Updating video ${videoId} status...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      // Filter out undefined values
      const cleanedUpdates = Object.fromEntries(Object.entries(updates).filter(([_, value]) => value !== undefined));

      const updateData = {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection(this.VIDEOS_COLLECTION).doc(videoId).update(updateData);

      console.log(`✅ [VIDEO_SERVICE] Video ${videoId} status updated successfully`);
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to update video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Get video count for a creator
   */
  static async getVideoCountByCreatorId(creatorId: string): Promise<number> {
    try {
      console.log(`📊 [VIDEO_SERVICE] Getting video count for creator ${creatorId}...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb.collection(this.VIDEOS_COLLECTION).where("creatorId", "==", creatorId).get();

      const count = snapshot.size;
      console.log(`📊 [VIDEO_SERVICE] Creator ${creatorId} has ${count} videos`);
      return count;
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to get video count for creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all videos for a creator
   */
  static async deleteVideosByCreatorId(creatorId: string): Promise<void> {
    try {
      console.log(`🗑️ [VIDEO_SERVICE] Deleting all videos for creator ${creatorId}...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb.collection(this.VIDEOS_COLLECTION).where("creatorId", "==", creatorId).get();

      if (snapshot.empty) {
        console.log(`📊 [VIDEO_SERVICE] No videos found for creator ${creatorId}`);
        return;
      }

      // Use batch delete for better performance
      const batch = adminDb.batch();
      snapshot.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ [VIDEO_SERVICE] Deleted ${snapshot.size} videos for creator ${creatorId}`);
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to delete videos for creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get videos with pagination
   */
  static async getVideosWithPagination(
    limit: number = 20,
    startAfter?: string,
  ): Promise<{ videos: VideoDocument[]; hasMore: boolean; lastDoc?: string }> {
    try {
      console.log(`📄 [VIDEO_SERVICE] Fetching videos with pagination (limit: ${limit})...`);

      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      let query = adminDb
        .collection(this.VIDEOS_COLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limit + 1); // Get one extra to check if there are more

      if (startAfter) {
        const startAfterDoc = await adminDb.collection(this.VIDEOS_COLLECTION).doc(startAfter).get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      }

      const snapshot = await query.get();
      const videos: VideoDocument[] = [];

      snapshot.forEach((doc: any) => {
        videos.push({
          id: doc.id,
          ...doc.data(),
        } as VideoDocument);
      });

      const hasMore = videos.length > limit;
      if (hasMore) {
        videos.pop(); // Remove the extra document
      }

      const lastDoc = videos.length > 0 ? videos[videos.length - 1].id : undefined;

      console.log(`📊 [VIDEO_SERVICE] Retrieved ${videos.length} videos, hasMore: ${hasMore}`);
      return { videos, hasMore, lastDoc };
    } catch (error) {
      console.error(`🔥 [VIDEO_SERVICE] Failed to fetch videos with pagination:`, error);
      throw error;
    }
  }
}
