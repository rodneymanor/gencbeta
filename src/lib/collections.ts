/* eslint-disable max-lines */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import {
  verifyCollectionOwnership,
  verifyVideoOwnership,
  updateCollectionVideoCount,
  deleteCollectionVideos,
  formatTimestamp,
} from "./collections-helpers";
import { db } from "./firebase";

export interface VideoInsights {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  engagementRate: number;
}

export interface VideoComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface ContentMetadata {
  platform: string;
  author: string;
  description: string;
  source: string;
  hashtags: string[];
}

export interface Video {
  id?: string;
  originalUrl: string; // The original TikTok/Instagram URL
  iframeUrl?: string; // The Bunny.net iframe URL for playback
  directUrl?: string; // Direct CDN URL
  guid?: string; // Bunny CDN GUID
  platform: string;
  thumbnailUrl: string;
  title: string;
  transcript?: string;
  components?: VideoComponents;
  visualContext?: string;
  metrics?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves: number;
  };
  metadata?: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    author?: string;
    duration?: number;
    description?: string;
    hashtags?: string[];
  };
  transcriptionStatus?: string;
  userId?: string;
  collectionId?: string;
  addedAt: string;
  fileSize?: number;
  duration?: number;
  favorite?: boolean;
}

export interface Collection {
  id?: string;
  title: string;
  description: string;
  userId: string; // This will be the coach's UID
  videoCount: number;
  favorite?: boolean; // pinned to top of list
  createdAt: string;
  updatedAt: string;
}

// Character limits for collections
export const COLLECTION_LIMITS = {
  MAX_TITLE_LENGTH: 80,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export class CollectionsService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  /**
   * Deduplicate videos by originalUrl, keeping the most recent one
   */
  private static deduplicateVideosByOriginalUrl(videos: Video[]): Video[] {
    const urlToVideoMap = new Map<string, Video>();

    // Process videos in order (already sorted by addedAt desc)
    videos.forEach((video) => {
      const originalUrl = video.originalUrl;
      if (!originalUrl) return;

      // Keep the first occurrence (most recent due to sorting)
      if (!urlToVideoMap.has(originalUrl)) {
        urlToVideoMap.set(originalUrl, video);
      }
    });

    return Array.from(urlToVideoMap.values());
  }

  /**
   * Validate video URL format
   */
  static validateVideoUrl(url: string): { isValid: boolean; platform?: string } {
    if (!url || typeof url !== "string") {
      return { isValid: false };
    }

    const urlLower = url.toLowerCase();

    if (urlLower.includes("tiktok.com")) {
      return { isValid: true, platform: "TikTok" };
    }

    if (urlLower.includes("instagram.com") && (urlLower.includes("/reel/") || urlLower.includes("/p/"))) {
      return { isValid: true, platform: "Instagram" };
    }

    return { isValid: false };
  }

  /**
   * Create a new collection
   */
  static async createCollection(userId: string, title: string, description: string = ""): Promise<string> {
    try {
      const collectionData: Omit<Collection, "id"> = {
        title: title.trim(),
        description: description.trim(),
        userId,
        videoCount: 0,
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, this.COLLECTIONS_PATH), {
        ...collectionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw new Error("Failed to create collection");
    }
  }

  /**
   * Get all collections for a user (legacy method - use CollectionsRBACService for role-based access)
   */
  static async getUserCollections(userId: string): Promise<Collection[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS_PATH),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        favorite: doc.data().favorite ?? false,
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
      })) as Collection[];
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get a specific collection by ID
   */
  static async getCollection(userId: string, collectionId: string): Promise<Collection | null> {
    try {
      const ownership = await verifyCollectionOwnership(userId, collectionId);
      if (!ownership.exists) {
        return null;
      }

      return {
        id: collectionId,
        ...ownership.data,
        createdAt: formatTimestamp(ownership.data.createdAt),
        updatedAt: formatTimestamp(ownership.data.updatedAt),
      } as Collection;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw new Error("Failed to fetch collection");
    }
  }

  /**
   * Update a collection
   */
  static async updateCollection(userId: string, collectionId: string, updates: Partial<Collection>): Promise<void> {
    try {
      await verifyCollectionOwnership(userId, collectionId);
      const docRef = doc(db, this.COLLECTIONS_PATH, collectionId);

      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating collection:", error);
      throw new Error("Failed to update collection");
    }
  }

  /**
   * Toggle favorite flag on a collection
   */
  static async setFavorite(userId: string, collectionId: string, favorite: boolean): Promise<void> {
    return this.updateCollection(userId, collectionId, { favorite, updatedAt: new Date().toISOString() });
  }

  /**
   * Delete a collection and all its videos
   */
  static async deleteCollection(userId: string, collectionId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      await verifyCollectionOwnership(userId, collectionId);
      await deleteCollectionVideos(batch, userId, collectionId);

      const collectionRef = doc(db, this.COLLECTIONS_PATH, collectionId);
      batch.delete(collectionRef);

      await batch.commit();
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw new Error("Failed to delete collection");
    }
  }

  /**
   * Add a video to a collection (or all-videos)
   */
  static async addVideoToCollection(userId: string, collectionId: string, video: Omit<Video, "id">): Promise<string> {
    try {
      const batch = writeBatch(db);

      // Normalize collection ID - handle empty strings and null/undefined
      const normalizedCollectionId = !collectionId || collectionId.trim() === "" ? "all-videos" : collectionId;

      const videoRef = doc(collection(db, this.VIDEOS_PATH));
      const videoData = {
        ...video,
        userId,
        collectionId: normalizedCollectionId,
        addedAt: serverTimestamp(),
      };

      batch.set(videoRef, videoData);

      // Only verify ownership and update count for actual collections (not "all-videos")
      if (normalizedCollectionId !== "all-videos") {
        await verifyCollectionOwnership(userId, normalizedCollectionId);
        await updateCollectionVideoCount(batch, normalizedCollectionId, userId, 1);
      }

      await batch.commit();
      return videoRef.id;
    } catch (error) {
      console.error("Error adding video to collection:", error);
      throw new Error("Failed to add video to collection");
    }
  }

  /**
   * Get videos from a collection or all videos (legacy method - use CollectionsRBACService for role-based access)
   */
  static async getCollectionVideos(userId: string, collectionId?: string): Promise<Video[]> {
    try {
      let q;

      if (!collectionId || collectionId === "all-videos") {
        q = query(collection(db, this.VIDEOS_PATH), where("userId", "==", userId), orderBy("addedAt", "desc"));
      } else {
        q = query(
          collection(db, this.VIDEOS_PATH),
          where("userId", "==", userId),
          where("collectionId", "==", collectionId),
          orderBy("addedAt", "desc"),
        );
      }

      const querySnapshot = await getDocs(q);
      let videos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: formatTimestamp(doc.data().addedAt),
      })) as Video[];

      // Deduplicate videos for "all-videos" view based on originalUrl
      if (!collectionId || collectionId === "all-videos") {
        videos = this.deduplicateVideosByOriginalUrl(videos);
        console.log("🔄 [Collections] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
      }

      return videos;
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Get a specific video by ID
   */
  static async getVideo(userId: string, videoId: string): Promise<Video | null> {
    try {
      const ownership = await verifyVideoOwnership(userId, videoId);
      if (!ownership.exists) {
        return null;
      }

      return {
        id: videoId,
        ...ownership.data,
        addedAt: formatTimestamp(ownership.data.addedAt),
      } as Video;
    } catch (error) {
      console.error("Error fetching video:", error);
      throw new Error("Failed to fetch video");
    }
  }

  /**
   * Update a video
   */
  static async updateVideo(userId: string, videoId: string, updates: Partial<Video>): Promise<void> {
    try {
      await verifyVideoOwnership(userId, videoId);
      const docRef = doc(db, this.VIDEOS_PATH, videoId);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating video:", error);
      throw new Error("Failed to update video");
    }
  }

  /**
   * Delete a video from a collection
   */
  static async deleteVideo(userId: string, videoId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const ownership = await verifyVideoOwnership(userId, videoId);

      if (!ownership.exists) {
        throw new Error("Video not found");
      }

      const videoRef = doc(db, this.VIDEOS_PATH, videoId);
      batch.delete(videoRef);

      const collectionId = ownership.data.collectionId;
      await updateCollectionVideoCount(batch, collectionId, userId, -1);

      await batch.commit();
    } catch (error) {
      console.error("Error deleting video:", error);
      throw new Error("Failed to delete video");
    }
  }

  /**
   * Move a video between collections
   */
  static async moveVideo(userId: string, videoId: string, newCollectionId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const ownership = await verifyVideoOwnership(userId, videoId);

      if (!ownership.exists) {
        throw new Error("Video not found");
      }

      const oldCollectionId = ownership.data.collectionId;

      // Update video collection
      const videoRef = doc(db, this.VIDEOS_PATH, videoId);
      batch.update(videoRef, {
        collectionId: newCollectionId === "all-videos" ? "all-videos" : newCollectionId,
      });

      // Update collection counts
      await updateCollectionVideoCount(batch, oldCollectionId, userId, -1);

      if (newCollectionId !== "all-videos") {
        await verifyCollectionOwnership(userId, newCollectionId);
        await updateCollectionVideoCount(batch, newCollectionId, userId, 1);
      }

      await batch.commit();
    } catch (error) {
      console.error("Error moving video:", error);
      throw new Error("Failed to move video");
    }
  }

  /**
   * Copy a video to another collection (duplicates the video document)
   */
  static async copyVideo(userId: string, videoId: string, targetCollectionId: string): Promise<string> {
    try {
      const ownership = await verifyVideoOwnership(userId, videoId);
      if (!ownership.exists || !ownership.data) {
        throw new Error("Video not found");
      }

      const videoData = ownership.data as Video;

      // Verify access to target collection
      if (targetCollectionId !== "all-videos") {
        await verifyCollectionOwnership(userId, targetCollectionId);
      }

      // Prepare new video doc
      const batch = writeBatch(db);
      const newVideoRef = doc(collection(db, this.VIDEOS_PATH));

      batch.set(newVideoRef, {
        ...videoData,
        collectionId: targetCollectionId === "all-videos" ? "all-videos" : targetCollectionId,
        addedAt: serverTimestamp(),
      });

      // Update target collection count (not for all-videos)
      await updateCollectionVideoCount(batch, targetCollectionId, userId, 1);

      await batch.commit();

      return newVideoRef.id;
    } catch (error) {
      console.error("Error copying video:", error);
      throw new Error("Failed to copy video");
    }
  }

  /**
   * Toggle favorite flag on a video
   */
  static async setVideoFavorite(userId: string, videoId: string, favorite: boolean): Promise<void> {
    try {
      await this.updateVideo(userId, videoId, { favorite });
    } catch (error) {
      console.error("Error toggling video favorite:", error);
      throw new Error("Failed to update video favorite status");
    }
  }

  /**
   * Get total video count for user (across all collections)
   */
  static async getTotalVideoCount(userId: string): Promise<number> {
    try {
      const q = query(collection(db, this.VIDEOS_PATH), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting total video count:", error);
      return 0;
    }
  }
}
