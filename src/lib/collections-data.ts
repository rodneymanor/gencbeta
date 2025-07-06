import { Collection, Video } from "./collections";
import { CollectionsRBACService } from "./collections-rbac";
import { getCurrentUser } from "./server-auth";

export async function fetchCollections(): Promise<Collection[]> {
  console.log("🔍 [fetchCollections] Function called");
  console.time("fetchCollections");
  
  try {
    const user = await getCurrentUser();
    console.log("🔍 [fetchCollections] User:", user ? `uid: ${user.uid}` : "null");
    
    if (!user) {
      console.log("❌ [fetchCollections] No user found, returning empty array");
      return [];
    }
    
    const collections = await CollectionsRBACService.getUserCollections(user.uid);
    console.log("✅ [fetchCollections] Found collections:", collections.length);
    console.log("📋 [fetchCollections] Collection IDs:", collections.map((c) => c.id));
    
    return collections;
  } catch (error) {
    console.error("❌ [fetchCollections] Error:", error);
    return [];
  } finally {
    console.timeEnd("fetchCollections");
  }
}

export async function fetchVideos(collectionId: string | null): Promise<Video[]> {
  console.log("🔍 [fetchVideos] Function called with collectionId:", collectionId);
  console.time("fetchVideos");
  
  try {
    const user = await getCurrentUser();
    console.log("🔍 [fetchVideos] User:", user ? `uid: ${user.uid}` : "null");
    
    if (!user) {
      console.log("❌ [fetchVideos] No user found, returning empty array");
      return [];
    }
    
    const videos = await CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined);
    console.log("✅ [fetchVideos] Found videos:", videos.length);
    console.log("📋 [fetchVideos] Video IDs:", videos.map(v => v.id));
    
    return videos;
  } catch (error) {
    console.error("❌ [fetchVideos] Error:", error);
    return [];
  } finally {
    console.timeEnd("fetchVideos");
  }
}
