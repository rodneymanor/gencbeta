import { CollectionsService, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import type { VideoWithPlayer } from "./collections-helpers";

// Simplified cache for better performance
interface SimpleCache {
  data: Map<string, { videos: VideoWithPlayer[]; timestamp: number }>;
}

interface RouterLike {
  push: (path: string, options?: { scroll?: boolean }) => void;
}

const CACHE_DURATION = 30000; // 30 seconds

export class CollectionsDataManager {
  private cacheRef: React.MutableRefObject<SimpleCache>;

  constructor(cacheRef: React.MutableRefObject<SimpleCache>) {
    this.cacheRef = cacheRef;
  }

  getCachedVideos(collectionId: string | null): VideoWithPlayer[] | null {
    const key = collectionId ?? "all";
    const cached = this.cacheRef.current.data.get(key);
    if (!cached) return null;

    const isValid = Date.now() - cached.timestamp < CACHE_DURATION;
    return isValid ? cached.videos : null;
  }

  setCachedVideos(collectionId: string | null, videos: VideoWithPlayer[]) {
    const key = collectionId ?? "all";
    this.cacheRef.current.data.set(key, { videos, timestamp: Date.now() });
  }

  clearCache() {
    this.cacheRef.current.data.clear();
  }

  validateCollectionExists(
    collectionId: string | null,
    collections: Collection[],
    router: RouterLike,
    startTransition: (callback: () => void) => void,
  ): boolean {
    if (!collectionId || collectionId === "all-videos") return true;

    const collectionExists = collections.some((c) => c.id === collectionId);
    if (!collectionExists) {
      console.warn("⚠️ [Collections] Collection not found, redirecting to all videos:", collectionId);
      this.clearCache();
      startTransition(() => {
        router.push("/research/collections", { scroll: false });
      });
      return false;
    }
    return true;
  }

  async loadCollectionsAndVideos(userId: string, collectionId?: string) {
    return await Promise.allSettled([
      CollectionsRBACService.getUserCollections(userId),
      CollectionsRBACService.getCollectionVideos(userId, collectionId),
    ]);
  }

  async deleteVideo(userId: string, videoId: string) {
    return await CollectionsService.deleteVideo(userId, videoId);
  }

  async deleteBulkVideos(userId: string, videoIds: string[]) {
    const batchSize = 5;
    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize);
      await Promise.all(batch.map((videoId) => CollectionsService.deleteVideo(userId, videoId)));
    }
  }
}
