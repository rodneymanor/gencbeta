/**
 * TikTok API Service for fetching creator videos
 */

export interface TikTokVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  author: {
    username: string;
    displayName: string;
    avatar: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  duration: number;
  createdAt: string;
  music?: {
    title: string;
    author: string;
    url: string;
  };
}

export class TikTokApiService {
  static async fetchCreatorVideos(username: string): Promise<TikTokVideo[]> {
    try {
      const cleanUsername = this.cleanUsername(username);

      if (!this.validateUsername(cleanUsername)) {
        throw new Error("Invalid username format");
      }

      console.log(`Fetching videos for TikTok user: ${cleanUsername}`);

      const response = await fetch(`/api/tiktok/creator?username=${encodeURIComponent(cleanUsername)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error ?? `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error ?? "Failed to fetch videos");
      }

      console.log(`Successfully fetched ${data.videos.length} videos for @${cleanUsername}`);
      return data.videos;
    } catch (error) {
      console.error("Error fetching TikTok videos:", error);
      throw new Error(error instanceof Error ? error.message : `Failed to fetch videos for @${username}`);
    }
  }

  static validateUsername(username: string): boolean {
    // Remove @ symbol if present
    const cleanUsername = username.replace(/^@/, "");

    // TikTok username validation: 1-24 characters, alphanumeric, underscores, periods
    const usernameRegex = /^[a-zA-Z0-9_.]{1,24}$/;
    return usernameRegex.test(cleanUsername);
  }

  static cleanUsername(username: string): string {
    return username.replace(/^@/, "");
  }
}
