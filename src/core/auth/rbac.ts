/**
 * Role-Based Access Control Service
 * Centralized RBAC for collections and resources
 */

import { collection, query, where, orderBy, getDocs, limit, startAfter, DocumentSnapshot } from "firebase/firestore";

import { type Collection, type Video } from "@/lib/collections";
import { formatTimestamp } from "@/lib/collections-helpers";
import { db } from "@/lib/firebase";
import { UserManagementService } from "@/lib/user-management-server";

export interface RBACContext {
  userId: string;
  role: string;
  accessibleCoaches: string[];
  isSuperAdmin: boolean;
}

export interface CollectionAccessResult {
  collections: Collection[];
  accessibleCoaches: string[];
}

export interface VideoAccessResult {
  videos: Video[];
  lastDoc?: DocumentSnapshot;
  totalCount: number;
}

export class RBACService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  /**
   * Get RBAC context for a user
   */
  static async getRBACContext(userId: string): Promise<RBACContext> {
    const userProfile = await UserManagementService.getUserProfile(userId);
    const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);

    return {
      userId,
      role: userProfile?.role || "creator",
      accessibleCoaches,
      isSuperAdmin: userProfile?.role === "super_admin",
    };
  }

  /**
   * Check if user has access to a specific resource
   */
  static async hasAccess(userId: string, resourceType: "collection" | "video", resourceId: string): Promise<boolean> {
    const context = await this.getRBACContext(userId);

    if (context.isSuperAdmin) {
      return true;
    }

    if (context.accessibleCoaches.length === 0) {
      return false;
    }

    // For collections, check if the collection belongs to an accessible coach
    if (resourceType === "collection") {
      const collectionDoc = await getDocs(
        query(
          collection(db, this.COLLECTIONS_PATH),
          where("id", "==", resourceId),
          where("userId", "in", context.accessibleCoaches),
        ),
      );
      return !collectionDoc.empty;
    }

    // For videos, check if the video belongs to an accessible coach
    if (resourceType === "video") {
      const videoDoc = await getDocs(
        query(
          collection(db, this.VIDEOS_PATH),
          where("id", "==", resourceId),
          where("userId", "in", context.accessibleCoaches),
        ),
      );
      return !videoDoc.empty;
    }

    return false;
  }

  /**
   * Get collections accessible to a user
   */
  static async getUserCollections(userId: string): Promise<CollectionAccessResult> {
    try {
      const context = await this.getRBACContext(userId);

      if (context.isSuperAdmin) {
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
        return { collections, accessibleCoaches: [] };
      }

      if (context.accessibleCoaches.length === 0) {
        return { collections: [], accessibleCoaches: [] };
      }

      const q = query(
        collection(db, this.COLLECTIONS_PATH),
        where("userId", "in", context.accessibleCoaches),
        orderBy("updatedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      const collections = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
      })) as Collection[];

      return { collections, accessibleCoaches: context.accessibleCoaches };
    } catch (error) {
      console.error("❌ [RBAC] Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get videos accessible to a user
   */
  static async getCollectionVideos(
    userId: string,
    collectionId?: string,
    videoLimit?: number,
    lastDoc?: DocumentSnapshot,
  ): Promise<VideoAccessResult> {
    try {
      console.log("🔍 [RBAC] User ID:", userId, "Limit:", videoLimit, "HasCursor:", !!lastDoc);

      const context = await this.getRBACContext(userId);

      if (context.isSuperAdmin) {
        return this.getSuperAdminVideos(userId, collectionId, videoLimit, lastDoc);
      }

      return this.getRegularUserVideos(userId, collectionId, videoLimit, lastDoc, context);
    } catch (error) {
      console.error("❌ [RBAC] Error fetching videos:", error);
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
  ): Promise<VideoAccessResult> {
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
        return { videos: [], totalCount: 0 };
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
    return { videos, lastDoc: newLastDoc, totalCount: videos.length };
  }

  /**
   * Get collection query for super admin
   */
  private static async getSuperAdminCollectionQuery(userId: string, collectionId: string) {
    console.log("🔍 [RBAC] Super admin loading videos from collection:", collectionId);
    const { collections } = await this.getUserCollections(userId);
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
    context?: RBACContext,
  ): Promise<VideoAccessResult> {
    const userContext = context || (await this.getRBACContext(userId));
    console.log("🔍 [RBAC] Accessible coaches:", userContext.accessibleCoaches);

    if (userContext.accessibleCoaches.length === 0) {
      console.log("❌ [RBAC] No accessible coaches found - returning empty array");
      return { videos: [], totalCount: 0 };
    }

    let q = await this.getRegularUserQuery(userId, collectionId, userContext.accessibleCoaches);

    // Apply pagination cursor if provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // Apply limit if specified
    if (videoLimit) {
      q = query(q, limit(videoLimit));
    }

    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: formatTimestamp(doc.data().addedAt),
    })) as Video[];

    const newLastDoc = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : undefined;

    console.log("✅ [RBAC] Regular user loaded videos:", videos.length);
    return { videos, lastDoc: newLastDoc, totalCount: videos.length };
  }

  /**
   * Get query for regular user videos
   */
  private static async getRegularUserQuery(
    userId: string,
    collectionId: string | undefined,
    accessibleCoaches: string[],
  ) {
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Regular user loading all accessible videos");
      return query(
        collection(db, this.VIDEOS_PATH),
        where("userId", "in", accessibleCoaches),
        orderBy("addedAt", "desc"),
      );
    }

    console.log("🔍 [RBAC] Regular user loading videos from collection:", collectionId);
    const { collections } = await this.getUserCollections(userId);
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
   * Check if user can perform an action on a resource
   */
  static async canPerformAction(
    userId: string,
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    resourceId?: string,
  ): Promise<boolean> {
    const context = await this.getRBACContext(userId);

    // Super admin can do everything
    if (context.isSuperAdmin) {
      return true;
    }

    // Check specific resource access if resourceId is provided
    if (resourceId) {
      return this.hasAccess(userId, resourceType as "collection" | "video", resourceId);
    }

    // For general permissions, check role-based access
    switch (action) {
      case "read":
        return context.accessibleCoaches.length > 0 || context.role === "coach";
      case "write":
        return context.role === "coach" || context.role === "creator";
      case "delete":
        return context.role === "coach";
      default:
        return false;
    }
  }

  /**
   * Get accessible coaches for a user
   */
  static async getAccessibleCoaches(userId: string): Promise<string[]> {
    const context = await this.getRBACContext(userId);
    return context.accessibleCoaches;
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    const context = await this.getRBACContext(userId);
    return context.isSuperAdmin;
  }
}
