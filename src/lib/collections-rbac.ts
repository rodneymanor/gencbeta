import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot } from "firebase/firestore";

import { type Collection, type Video } from "./collections";

// Re-export types for external use
export type { Video, Collection } from "./collections";
import { formatTimestamp } from "./collections-helpers";
import { db } from "./firebase";
import { UserManagementService } from "./user-management";

export class CollectionsRBACService {
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
   * Get all collections for a user (role-based)
   */
  static async getUserCollections(userId: string): Promise<Collection[]> {
    try {
      // Check if user is super admin first
      const userProfile = await UserManagementService.getUserProfile(userId);
      if (userProfile?.role === "super_admin") {
        console.log("🔍 [RBAC] Super admin loading all collections");

        // For super admin, get all collections
        const q = query(collection(db, this.COLLECTIONS_PATH), orderBy("updatedAt", "desc"));

        const querySnapshot = await getDocs(q);
        const collections = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: formatTimestamp(doc.data().createdAt),
          updatedAt: formatTimestamp(doc.data().updatedAt),
        })) as Collection[];

        console.log("✅ [RBAC] Super admin loaded collections:", collections.length);
        return collections;
      }

      const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);

      if (accessibleCoaches.length === 0) {
        return [];
      }

      const q = query(
        collection(db, this.COLLECTIONS_PATH),
        where("userId", "in", accessibleCoaches),
        orderBy("updatedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
      })) as Collection[];
    } catch (error) {
      console.error("Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get videos from a collection or all videos (role-based)
   */
  static async getCollectionVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    try {
      console.log("🔍 [RBAC] User ID:", userId, "Limit:", videoLimit, "HasCursor:", !!lastDoc);

      const userProfile = await UserManagementService.getUserProfile(userId);
      if (userProfile?.role === "super_admin") {
        return this.getSuperAdminVideos(userId, collectionId, videoLimit, lastDoc);
      }

      return this.getRegularUserVideos(userId, collectionId, videoLimit, lastDoc);
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Get videos for super admin users
   */
  private static async getSuperAdminVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    console.log("🔍 [RBAC] Super admin detected - bypassing coach restrictions");

    let q;
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Super admin loading all videos");
      q = query(collection(db, this.VIDEOS_PATH), orderBy("addedAt", "desc"));
    } else {
      try {
        q = await this.getSuperAdminCollectionQuery(userId, collectionId);
      } catch (error) {
        // Collection not found, return empty array
        console.log("❌ [RBAC] Collection query failed:", error instanceof Error ? error.message : String(error));
        return { videos: [] };
      }
    }

    // Apply pagination cursor if provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // Apply limit if specified
    if (videoLimit) {
      q = query(q, limit(videoLimit));
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
      console.log("🔄 [RBAC] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
    }

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    console.log("✅ [RBAC] Super admin loaded videos:", videos.length);
    return { videos, lastDoc: newLastDoc };
  }

  /**
   * Get collection query for super admin
   */
  private static async getSuperAdminCollectionQuery(userId: string, collectionId: string) {
    console.log("🔍 [RBAC] Super admin loading videos from collection:", collectionId);
    const collections = await this.getUserCollections(userId);
    const targetCollection = collections.find((c) => c.id === collectionId);

    if (!targetCollection) {
      console.log("❌ [RBAC] Collection not found:", collectionId);
      throw new Error(`Collection not found: ${collectionId}`);
    }

    return query(
      collection(db, this.VIDEOS_PATH),
      where("collectionId", "==", collectionId),
      where("userId", "==", targetCollection.userId),
      orderBy("addedAt", "desc"),
    );
  }

  /**
   * Get videos for regular users (coach/creator)
   */
  private static async getRegularUserVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<{ videos: Video[]; lastDoc?: DocumentSnapshot }> {
    const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);
    console.log("🔍 [RBAC] Accessible coaches:", accessibleCoaches);

    if (accessibleCoaches.length === 0) {
      console.log("❌ [RBAC] No accessible coaches found - returning empty array");
      return { videos: [] };
    }

    let q = await this.getRegularUserQuery(userId, collectionId, accessibleCoaches);

    // Apply pagination cursor if provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // Apply limit if specified
    if (videoLimit) {
      q = query(q, limit(videoLimit));
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
      console.log("🔄 [RBAC] Deduplicated videos from", querySnapshot.docs.length, "to", videos.length);
    }

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    return { videos, lastDoc: newLastDoc };
  }

  /**
   * Get query for regular users
   */
  private static async getRegularUserQuery(
    userId: string,
    collectionId: string | undefined,
    accessibleCoaches: string[],
  ) {
    if (!collectionId || collectionId === "all-videos") {
      return query(
        collection(db, this.VIDEOS_PATH),
        where("userId", "in", accessibleCoaches),
        orderBy("addedAt", "desc"),
      );
    }

    const collections = await this.getUserCollections(userId);
    const hasAccess = collections.some((c) => c.id === collectionId);

    if (!hasAccess) {
      throw new Error("Access denied to collection");
    }

    return query(
      collection(db, this.VIDEOS_PATH),
      where("collectionId", "==", collectionId),
      where("userId", "in", accessibleCoaches),
      orderBy("addedAt", "desc"),
    );
  }
}
