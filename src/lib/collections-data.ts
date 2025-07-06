import { Collection, Video } from "./collections";
import { CollectionsRBACService } from "./collections-rbac";
import { getCurrentUser } from "./server-auth";

export async function fetchCollections(): Promise<Collection[]> {
  const user = await getCurrentUser();
  if (!user) {
    // Or handle as an error, depending on your app's logic
    return [];
  }
  return CollectionsRBACService.getUserCollections(user.uid);
}

export async function fetchVideos(collectionId: string | null): Promise<Video[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }
  return CollectionsRBACService.getCollectionVideos(user.uid, collectionId ?? undefined);
}
