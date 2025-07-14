/**
 * Collections API Client
 * Client-side service for collections operations
 */

import { type Collection, type Video } from "@/lib/collections";

export interface CollectionsApiResponse {
  success: boolean;
  collections: Collection[];
  accessibleCoaches: string[];
  total: number;
  timestamp: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
}

export interface VideosApiResponse {
  success: boolean;
  videos: Video[];
  lastDoc: { id: string } | null;
  totalCount: number;
  timestamp: string;
  user: {
    id: string;
    email: string;
    displayName?: string;
    role: string;
  };
}

export class CollectionsApiClient {
  private static readonly BASE_URL = "/api/collections";

  /**
   * Get user collections with RBAC
   */
  static async getUserCollections(firebaseToken?: string): Promise<CollectionsApiResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }

    const response = await fetch(`${this.BASE_URL}/user-collections`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch collections: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get collection videos with RBAC
   */
  static async getCollectionVideos(
    collectionId?: string,
    limit: number = 24,
    lastDocId?: string,
    firebaseToken?: string,
  ): Promise<VideosApiResponse> {
    const params = new URLSearchParams();
    if (collectionId) params.append("collectionId", collectionId);
    params.append("limit", limit.toString());
    if (lastDocId) params.append("lastDocId", lastDocId);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (firebaseToken) {
      headers["Authorization"] = `Bearer ${firebaseToken}`;
    }

    const response = await fetch(`${this.BASE_URL}/collection-videos?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.statusText}`);
    }

    return response.json();
  }
}
