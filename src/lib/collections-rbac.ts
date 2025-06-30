import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

import { type Collection, type Video } from "./collections";
import { formatTimestamp } from "./collections-helpers";
import { db } from "./firebase";
import { UserManagementService } from "./user-management";

export class CollectionsRBACService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

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
  static async getCollectionVideos(userId: string, collectionId?: string): Promise<Video[]> {
    try {
      console.log("🔍 [RBAC] User ID:", userId);

      const userProfile = await UserManagementService.getUserProfile(userId);
      if (userProfile?.role === "super_admin") {
        return this.getSuperAdminVideos(userId, collectionId);
      }

      return this.getRegularUserVideos(userId, collectionId);
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Get videos for super admin users
   */
  private static async getSuperAdminVideos(userId: string, collectionId?: string): Promise<Video[]> {
    console.log("🔍 [RBAC] Super admin detected - bypassing coach restrictions");

    let q;
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Super admin loading all videos");
      q = query(collection(db, this.VIDEOS_PATH), orderBy("addedAt", "desc"));
    } else {
      q = await this.getSuperAdminCollectionQuery(userId, collectionId);
      if (!q) return [];
    }

    const querySnapshot = await getDocs(q);
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: formatTimestamp(doc.data().addedAt),
    })) as Video[];

    console.log("✅ [RBAC] Super admin loaded videos:", videos.length);
    return videos;
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
      return null;
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
  private static async getRegularUserVideos(userId: string, collectionId?: string): Promise<Video[]> {
    const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);
    console.log("🔍 [RBAC] Accessible coaches:", accessibleCoaches);

    if (accessibleCoaches.length === 0) {
      console.log("❌ [RBAC] No accessible coaches found - returning empty array");
      return [];
    }

    const q = await this.getRegularUserQuery(userId, collectionId, accessibleCoaches);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: formatTimestamp(doc.data().addedAt),
    })) as Video[];
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
