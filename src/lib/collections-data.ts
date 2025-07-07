import { Collection, Video } from "./collections";
import { CollectionsRBACService } from "./collections-rbac";
import { getCurrentUser } from "./server-auth";

export async function fetchCollections(): Promise<Collection[]> {
  console.log("🔍 [fetchCollections] Function called");
  const timerLabel = `fetchCollections-${Date.now()}`;
  console.time(timerLabel);

  try {
    const user = await getCurrentUser();
    const userInfo = user ? `uid: ${user.uid}` : "null";
    console.log("🔍 [fetchCollections] User:", userInfo);

    if (!user) {
      console.log("❌ [fetchCollections] No user found, returning empty array");
      return [];
    }

    const collections = await CollectionsRBACService.getUserCollections(user.uid);
    console.log("✅ [fetchCollections] Found collections:", collections.length);
    console.log(
      "📋 [fetchCollections] Collection IDs:",
      collections.map((c) => c.id),
    );
    return collections;
  } catch (error) {
    console.error("❌ [fetchCollections] Error:", error);
    return [];
  } finally {
    console.timeEnd(timerLabel);
  }
}

export async function fetchVideos(collectionId: string | null): Promise<Video[]> {
  console.log("🔍 [fetchVideos] Function called with collectionId:", collectionId);
  const timerLabel = `fetchVideos-${Date.now()}`;
  console.time(timerLabel);

  try {
    const user = await getCurrentUser();
    const userInfo = user ? `uid: ${user.uid}` : "null";
    console.log("🔍 [fetchVideos] User:", userInfo);

    if (!user) {
      console.log("❌ [fetchVideos] No user found, returning empty array");
      return [];
    }

    const videos = await CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined);
    console.log("✅ [fetchVideos] Found videos:", videos.length);
    console.log(
      "📋 [fetchVideos] Video IDs:",
      videos.map((v) => v.id),
    );
    return videos;
  } catch (error) {
    console.error("❌ [fetchVideos] Error:", error);
    return [];
  } finally {
    console.timeEnd(timerLabel);
  }
}
