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
      const accessibleCoaches = await UserManagementService.getUserAccessibleCoaches(userId);

      if (accessibleCoaches.length === 0) {
        return [];
      }

      let q;

      if (!collectionId || collectionId === "all-videos") {
        // Get all videos from accessible coaches
        q = query(
          collection(db, this.VIDEOS_PATH),
          where("userId", "in", accessibleCoaches),
          orderBy("addedAt", "desc"),
        );
      } else {
        // Verify collection access through role-based permissions
        const collections = await this.getUserCollections(userId);
        const hasAccess = collections.some((c) => c.id === collectionId);

        if (!hasAccess) {
          throw new Error("Access denied to collection");
        }

        q = query(
          collection(db, this.VIDEOS_PATH),
          where("collectionId", "==", collectionId),
          orderBy("addedAt", "desc"),
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: formatTimestamp(doc.data().addedAt),
      })) as Video[];
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }
}
