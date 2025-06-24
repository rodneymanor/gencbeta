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

export interface TikTokApiResponse {
  success: boolean;
  data: {
    videos: TikTokVideo[];
    user: {
      username: string;
      displayName: string;
      avatar: string;
      followers: number;
      following: number;
      likes: number;
    };
  };
}

const RAPIDAPI_KEY = "7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e";
const RAPIDAPI_HOST = "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com";

export class TikTokApiService {
  static async fetchCreatorVideos(username: string): Promise<TikTokVideo[]> {
    try {
      const response = await fetch(
        `https://${RAPIDAPI_HOST}/user/${username}/feed`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch TikTok videos: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract and normalize video data
      return this.normalizeVideoData(data);
    } catch (error) {
      console.error("Error fetching TikTok videos:", error);
      throw new Error(`Failed to fetch videos for @${username}`);
    }
  }

  private static normalizeVideoData(apiResponse: any): TikTokVideo[] {
    try {
      // Handle different possible response structures
      const videos = apiResponse?.data?.videos || apiResponse?.videos || [];
      
      return videos
        .slice(0, 10) // Get latest 10 videos
        .map((video: any) => ({
          id: video.id || video.video_id || String(Math.random()),
          title: video.title || video.desc || "Untitled Video",
          description: video.description || video.desc || "",
          url: video.play_url || video.video_url || video.url || "",
          thumbnailUrl: video.cover || video.thumbnail || video.origin_cover || "",
          author: {
            username: video.author?.unique_id || video.author?.username || "unknown",
            displayName: video.author?.nickname || video.author?.display_name || "Unknown User",
            avatar: video.author?.avatar_larger || video.author?.avatar || "",
          },
          stats: {
            views: video.statistics?.play_count || video.play_count || 0,
            likes: video.statistics?.digg_count || video.digg_count || 0,
            comments: video.statistics?.comment_count || video.comment_count || 0,
            shares: video.statistics?.share_count || video.share_count || 0,
          },
          duration: video.duration || 0,
          createdAt: video.create_time ? new Date(video.create_time * 1000).toISOString() : new Date().toISOString(),
          music: video.music ? {
            title: video.music.title || "Unknown Song",
            author: video.music.author || "Unknown Artist",
            url: video.music.play_url || "",
          } : undefined,
        }))
        .filter((video: TikTokVideo) => video.id && video.thumbnailUrl); // Filter out invalid videos
    } catch (error) {
      console.error("Error normalizing TikTok video data:", error);
      return [];
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