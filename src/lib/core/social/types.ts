export interface SocialProfile {
  platform: "tiktok" | "instagram" | "youtube" | "unknown";
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  metrics: {
    followers?: number;
    following?: number;
    likes?: number;
    views?: number;
    posts?: number;
  };
  verified?: boolean;
  private?: boolean;
}

export interface ProfileFetchResult {
  success: boolean;
  profile?: SocialProfile;
  error?: string;
}

export interface ProfileFetchOptions {
  includeMetrics?: boolean;
  includeAvatar?: boolean;
  includeBio?: boolean;
} 