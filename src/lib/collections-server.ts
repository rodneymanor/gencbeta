import { getServerSession } from "@/lib/auth-server";
import { CollectionsRBACService } from "@/lib/collections-rbac";

// Server-side function to fetch collections
export async function fetchCollections() {
  try {
    const session = await getServerSession();
    if (!session.user?.uid) {
      throw new Error("User not authenticated");
    }

    return await CollectionsRBACService.getUserCollections(session.user.uid);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return [];
  }
}

// Server-side function to fetch videos for a collection
export async function fetchVideos(collectionId?: string | null) {
  try {
    const session = await getServerSession();
    if (!session.user?.uid) {
      throw new Error("User not authenticated");
    }

    return await CollectionsRBACService.getCollectionVideos(session.user.uid, collectionId ?? undefined);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}
