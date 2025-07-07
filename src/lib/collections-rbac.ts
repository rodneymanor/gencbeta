import { type Collection, type Video } from "./collections";
import { formatTimestamp } from "./collections-helpers";
import { getAdminDb } from "./firebase-admin";
import { UserManagementService } from "./user-management";

export class CollectionsRBACService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  /**
   * Get all collections for a user (role-based)
   */
  static async getUserCollections(userId: string): Promise<Collection[]> {
    console.log("🔍 [RBAC] getUserCollections called with userId:", userId);
    const timerLabel = `getUserCollections-${Date.now()}`;
    console.time(timerLabel);

    try {
      const db = getAdminDb();
      const userProfile = await UserManagementService.getUserProfile(userId);
      console.log("🔍 [RBAC] User profile:", userProfile ? `role: ${userProfile.role}` : "null");

      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

      if (userProfile?.role === "super_admin") {
        console.log("🔍 [RBAC] Super admin loading all collections");
        query = db.collection(this.COLLECTIONS_PATH).orderBy("updatedAt", "desc");
      } else {
        console.log("🔍 [RBAC] Regular user, getting accessible coaches...");
        const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);
        console.log("🔍 [RBAC] Accessible coaches:", accessibleCoaches);

        if (accessibleCoaches.length === 0) {
          console.log("❌ [RBAC] No accessible coaches found");
          return [];
        }

        query = db
          .collection(this.COLLECTIONS_PATH)
          .where("userId", "in", accessibleCoaches)
          .orderBy("updatedAt", "desc");
      }

      console.log("🔍 [RBAC] Executing query...");
      const querySnapshot = await query.get();
      console.log("🔍 [RBAC] Query snapshot size:", querySnapshot.size);

      const collections = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
      })) as Collection[];

      console.log("✅ [RBAC] Loaded collections:", collections.length);
      return collections;
    } catch (error) {
      console.error("❌ [RBAC] Error fetching collections:", error);
      throw new Error("Failed to fetch collections");
    } finally {
      console.timeEnd(timerLabel);
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
    const db = getAdminDb();
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

    if (!collectionId || collectionId === "all-videos") {
      console.log("🔍 [RBAC] Super admin loading all videos");
      query = db.collection(this.VIDEOS_PATH).orderBy("addedAt", "desc");
    } else {
      try {
        const targetCollection = await this.getSuperAdminCollection(userId, collectionId);
        if (!targetCollection) {
          console.log("❌ [RBAC] Collection not found:", collectionId);
          return [];
        }
        query = db
          .collection(this.VIDEOS_PATH)
          .where("collectionId", "==", collectionId)
          .where("userId", "==", targetCollection.userId)
          .orderBy("addedAt", "desc");
      } catch (error) {
        // Collection not found, return empty array
        console.log("❌ [RBAC] Collection query failed:", error instanceof Error ? error.message : String(error));
        return [];
      }
    }

    const querySnapshot = await query.get();
    const videos = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: formatTimestamp(doc.data().addedAt),
    })) as Video[];

    console.log("✅ [RBAC] Super admin loaded videos:", videos.length);
    return videos;
  }

  /**
   * Get collection for super admin
   */
  private static async getSuperAdminCollection(userId: string, collectionId: string) {
    console.log("🔍 [RBAC] Super admin loading videos from collection:", collectionId);
    const collections = await this.getUserCollections(userId);
    const targetCollection = collections.find((c) => c.id === collectionId);
    return targetCollection;
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
    const db = getAdminDb();
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

    if (!collectionId || collectionId === "all-videos") {
      query = db.collection(this.VIDEOS_PATH).where("userId", "in", accessibleCoaches).orderBy("addedAt", "desc");
    } else {
      const collections = await this.getUserCollections(userId);
      const hasAccess = collections.some((c) => c.id === collectionId);

      if (!hasAccess) {
        throw new Error("Access denied to collection");
      }

      query = db
        .collection(this.VIDEOS_PATH)
        .where("collectionId", "==", collectionId)
        .where("userId", "in", accessibleCoaches)
        .orderBy("addedAt", "desc");
    }

    const querySnapshot = await query.get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      addedAt: formatTimestamp(doc.data().addedAt),
    })) as Video[];
  }
}
