import { FirebaseFirestore } from "firebase-admin";

import { getAdminDb, isAdminInitialized } from "./firebase-admin";
import { UserManagementAdminService } from "./user-management-admin";

export interface Collection {
  id: string;
  title: string;
  description: string;
  userId: string;
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  platform: string;
  userId: string;
  collectionId: string;
  addedAt: string;
  metrics: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
}

/**
 * Helper function to format Firestore timestamps
 */
const formatTimestamp = (timestamp: unknown): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  return new Date(timestamp).toISOString();
};

export class CollectionsRBACAdminService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  /**
   * Get all collections for a user using Admin SDK
   */
  static async getUserCollections(userId: string): Promise<Collection[]> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN_RBAC] Getting collections for user:", userId);

      const userProfile = await UserManagementAdminService.getUserProfile(userId);
      if (!userProfile) {
        console.log("❌ [ADMIN_RBAC] User profile not found");
        return [];
      }

      console.log("🔍 [ADMIN_RBAC] User role:", userProfile.role);

      let collectionsQuery;

      // Super admins can see all collections
      if (userProfile.role === "super_admin") {
        console.log("🔍 [ADMIN_RBAC] Super admin - getting all collections");
        collectionsQuery = adminDb.collection(this.COLLECTIONS_PATH).orderBy("updatedAt", "desc");
      } else {
        // Regular users can only see their own collections
        const accessibleCoaches = await UserManagementAdminService.getUserAccessibleCoaches(userId);

        if (accessibleCoaches.length === 0) {
          console.log("❌ [ADMIN_RBAC] No accessible coaches found");
          return [];
        }

        collectionsQuery = adminDb
          .collection(this.COLLECTIONS_PATH)
          .where("userId", "in", accessibleCoaches)
          .orderBy("updatedAt", "desc");
      }

      const querySnapshot = await collectionsQuery.get();
      const collections = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
      })) as Collection[];

      console.log("✅ [ADMIN_RBAC] Found collections:", collections.length);
      return collections;
    } catch (error) {
      console.error("❌ [ADMIN_RBAC] Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    }
  }

  /**
   * Get videos from a collection or all videos using Admin SDK
   */
  static async getCollectionVideos(userId: string, collectionId?: string): Promise<Video[]> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN_RBAC] Getting videos for user:", userId, "collection:", collectionId);

      const userProfile = await UserManagementAdminService.getUserProfile(userId);
      if (!userProfile) {
        console.log("❌ [ADMIN_RBAC] User profile not found");
        return [];
      }

      console.log("🔍 [ADMIN_RBAC] User role:", userProfile.role);

      const videosQuery = await this.buildVideosQuery(adminDb, userProfile, userId, collectionId);
      if (!videosQuery) {
        return [];
      }

      const querySnapshot = await videosQuery.get();
      const videos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: formatTimestamp(doc.data().addedAt),
      })) as Video[];

      console.log("✅ [ADMIN_RBAC] Found videos:", videos.length);
      return videos;
    } catch (error) {
      console.error("❌ [ADMIN_RBAC] Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Build the appropriate Firestore query for videos based on user role
   */
  private static async buildVideosQuery(
    adminDb: FirebaseFirestore.Firestore,
    userProfile: { role: string },
    userId: string,
    collectionId?: string,
  ) {
    // Super admins can see all videos
    if (userProfile.role === "super_admin") {
      return this.buildSuperAdminQuery(adminDb, collectionId);
    }

    // Regular users can only see videos from accessible coaches
    const accessibleCoaches = await UserManagementAdminService.getUserAccessibleCoaches(userId);
    if (accessibleCoaches.length === 0) {
      console.log("❌ [ADMIN_RBAC] No accessible coaches found");
      return null;
    }

    return this.buildRegularUserQuery(adminDb, accessibleCoaches, collectionId);
  }

  /**
   * Build query for super admin users
   */
  private static buildSuperAdminQuery(adminDb: FirebaseFirestore.Firestore, collectionId?: string) {
    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [ADMIN_RBAC] Super admin - getting all videos");
      return adminDb.collection(this.VIDEOS_PATH).orderBy("addedAt", "desc");
    } else {
      console.log("🔍 [ADMIN_RBAC] Super admin - getting videos from collection:", collectionId);
      return adminDb.collection(this.VIDEOS_PATH).where("collectionId", "==", collectionId).orderBy("addedAt", "desc");
    }
  }

  /**
   * Build query for regular users
   */
  private static buildRegularUserQuery(
    adminDb: FirebaseFirestore.Firestore,
    accessibleCoaches: string[],
    collectionId?: string,
  ) {
    if (!collectionId || collectionId === "all-videos") {
      return adminDb.collection(this.VIDEOS_PATH).where("userId", "in", accessibleCoaches).orderBy("addedAt", "desc");
    } else {
      return adminDb
        .collection(this.VIDEOS_PATH)
        .where("collectionId", "==", collectionId)
        .where("userId", "in", accessibleCoaches)
        .orderBy("addedAt", "desc");
    }
  }

  /**
   * Get a specific collection by ID using Admin SDK
   */
  static async getCollection(collectionId: string): Promise<Collection | null> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN_RBAC] Getting collection:", collectionId);

      const collectionDoc = await adminDb.collection(this.COLLECTIONS_PATH).doc(collectionId).get();

      if (!collectionDoc.exists) {
        console.log("❌ [ADMIN_RBAC] Collection not found:", collectionId);
        return null;
      }

      const collection = {
        id: collectionDoc.id,
        ...collectionDoc.data(),
        createdAt: formatTimestamp(collectionDoc.data()?.createdAt),
        updatedAt: formatTimestamp(collectionDoc.data()?.updatedAt),
      } as Collection;

      console.log("✅ [ADMIN_RBAC] Collection found:", collection.title);
      return collection;
    } catch (error) {
      console.error("❌ [ADMIN_RBAC] Error fetching collection:", error);
      throw new Error("Failed to fetch collection");
    }
  }

  /**
   * Delete a collection and all its videos using Admin SDK
   */
  static async deleteCollection(collectionId: string): Promise<void> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🗑️ [ADMIN_RBAC] Starting collection deletion:", collectionId);

      // First, verify the collection exists
      const collectionDoc = await adminDb.collection(this.COLLECTIONS_PATH).doc(collectionId).get();
      if (!collectionDoc.exists) {
        throw new Error("Collection not found");
      }

      const collectionData = collectionDoc.data() as Collection;
      console.log("🗑️ [ADMIN_RBAC] Collection found, title:", collectionData.title);

      // Use a batch to ensure atomicity
      const batch = adminDb.batch();

      // Delete all videos in the collection
      const videosQuery = await adminDb.collection(this.VIDEOS_PATH).where("collectionId", "==", collectionId).get();

      console.log("🗑️ [ADMIN_RBAC] Found videos to delete:", videosQuery.docs.length);

      // Add video deletions to batch
      videosQuery.docs.forEach((videoDoc) => {
        batch.delete(videoDoc.ref);
      });

      // Delete the collection document
      batch.delete(collectionDoc.ref);

      // Commit the batch
      await batch.commit();

      console.log("✅ [ADMIN_RBAC] Collection and all videos deleted successfully:", collectionId);
    } catch (error) {
      console.error("❌ [ADMIN_RBAC] Error deleting collection:", error);
      throw new Error(`Failed to delete collection: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
