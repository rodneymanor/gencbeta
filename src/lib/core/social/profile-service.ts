import type { SocialProfile, ProfileFetchResult, ProfileFetchOptions } from "./types";

export const SocialProfileService = {
  /**
   * Detects the platform from a URL or username
   * @param input - URL or username to analyze
   * @returns Detected platform
   */
  detectPlatform(input: string): "tiktok" | "instagram" | "youtube" | "unknown" {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes("tiktok.com") || lowerInput.includes("@tiktok") || lowerInput.startsWith("tiktok:")) {
      return "tiktok";
    }
    
    if (lowerInput.includes("instagram.com") || lowerInput.includes("@instagram") || lowerInput.startsWith("instagram:")) {
      return "instagram";
    }
    
    if (lowerInput.includes("youtube.com") || lowerInput.includes("@youtube") || lowerInput.startsWith("youtube:")) {
      return "youtube";
    }
    
    return "unknown";
  },

  /**
   * Extracts username from a social media URL
   * @param url - Social media URL
   * @returns Extracted username
   */
  extractUsername(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      
      // Handle different URL patterns
      if (urlObj.hostname.includes("tiktok.com")) {
        return pathParts[0] || null;
      }
      
      if (urlObj.hostname.includes("instagram.com")) {
        return pathParts[0] || null;
      }
      
      if (urlObj.hostname.includes("youtube.com")) {
        // Handle YouTube channel URLs
        if (pathParts[0] === "channel") {
          return pathParts[1] || null;
        }
        if (pathParts[0] === "c") {
          return pathParts[1] || null;
        }
        if (pathParts[0] === "@") {
          return pathParts[1] || null;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Fetches profile data from a social media platform
   * @param url - Social media profile URL
   * @param options - Fetch options
   * @returns Promise resolving to profile data
   */
  async fetchProfile(url: string, options: ProfileFetchOptions = {}): Promise<ProfileFetchResult> {
    try {
      const platform = this.detectPlatform(url);
      const username = this.extractUsername(url);
      
      if (!username) {
        return {
          success: false,
          error: "Could not extract username from URL",
        };
      }

      switch (platform) {
        case "tiktok":
          return await this.fetchTikTokProfile(username, options);
        case "instagram":
          return await this.fetchInstagramProfile(username, options);
        case "youtube":
          return await this.fetchYouTubeProfile(username, options);
        default:
          return {
            success: false,
            error: "Unsupported platform",
          };
      }
    } catch (error) {
      console.error("[SocialProfileService] Profile fetch failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Fetches TikTok profile data
   * @param username - TikTok username
   * @param options - Fetch options
   * @returns Promise resolving to TikTok profile data
   */
  async fetchTikTokProfile(username: string, options: ProfileFetchOptions = {}): Promise<ProfileFetchResult> {
    try {
      // TODO: Implement TikTok profile fetching
      // This would typically use TikTok's API or web scraping
      console.log(`[SocialProfileService] Fetching TikTok profile for: ${username}`);
      
      // Placeholder implementation
      const profile: SocialProfile = {
        platform: "tiktok",
        username,
        displayName: username,
        bio: options.includeBio ? "TikTok creator" : undefined,
        avatar: options.includeAvatar ? `https://p16-sign-va.tiktokcdn.com/avatar/${username}` : undefined,
        metrics: options.includeMetrics ? {
          followers: 0,
          following: 0,
          likes: 0,
          views: 0,
          posts: 0,
        } : {},
        verified: false,
        private: false,
      };

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error("[SocialProfileService] TikTok profile fetch failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "TikTok profile fetch failed",
      };
    }
  },

  /**
   * Fetches Instagram profile data
   * @param username - Instagram username
   * @param options - Fetch options
   * @returns Promise resolving to Instagram profile data
   */
  async fetchInstagramProfile(username: string, options: ProfileFetchOptions = {}): Promise<ProfileFetchResult> {
    try {
      // TODO: Implement Instagram profile fetching
      // This would typically use Instagram's API or web scraping
      console.log(`[SocialProfileService] Fetching Instagram profile for: ${username}`);
      
      // Placeholder implementation
      const profile: SocialProfile = {
        platform: "instagram",
        username,
        displayName: username,
        bio: options.includeBio ? "Instagram creator" : undefined,
        avatar: options.includeAvatar ? `https://instagram.com/${username}/profile_pic` : undefined,
        metrics: options.includeMetrics ? {
          followers: 0,
          following: 0,
          likes: 0,
          views: 0,
          posts: 0,
        } : {},
        verified: false,
        private: false,
      };

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error("[SocialProfileService] Instagram profile fetch failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Instagram profile fetch failed",
      };
    }
  },

  /**
   * Fetches YouTube profile data
   * @param username - YouTube username or channel ID
   * @param options - Fetch options
   * @returns Promise resolving to YouTube profile data
   */
  async fetchYouTubeProfile(username: string, options: ProfileFetchOptions = {}): Promise<ProfileFetchResult> {
    try {
      // TODO: Implement YouTube profile fetching
      // This would typically use YouTube Data API
      console.log(`[SocialProfileService] Fetching YouTube profile for: ${username}`);
      
      // Placeholder implementation
      const profile: SocialProfile = {
        platform: "youtube",
        username,
        displayName: username,
        bio: options.includeBio ? "YouTube creator" : undefined,
        avatar: options.includeAvatar ? `https://yt3.googleusercontent.com/${username}` : undefined,
        metrics: options.includeMetrics ? {
          followers: 0,
          following: 0,
          likes: 0,
          views: 0,
          posts: 0,
        } : {},
        verified: false,
        private: false,
      };

      return {
        success: true,
        profile,
      };
    } catch (error) {
      console.error("[SocialProfileService] YouTube profile fetch failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "YouTube profile fetch failed",
      };
    }
  },
}; 