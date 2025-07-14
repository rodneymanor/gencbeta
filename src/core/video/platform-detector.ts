/**
 * Platform Detection Service
 * Centralized platform detection for TikTok, Instagram, YouTube, and other platforms
 */

export type Platform = "tiktok" | "instagram" | "youtube" | "unknown";

export interface PlatformInfo {
  platform: Platform;
  videoId?: string;
  shortcode?: string;
  url: string;
}

/**
 * Detects the platform from a given URL
 * @param url - The video URL to analyze
 * @returns PlatformInfo object with platform and extracted identifiers
 */
export function detectPlatform(url: string): PlatformInfo {
  const urlLower = url.toLowerCase();
  console.log("🔍 [PLATFORM] Analyzing URL for platform detection:", urlLower);

  // Decode URL if it's URL-encoded
  const decodedUrl = decodeURIComponent(url);

  if (urlLower.includes("tiktok.com")) {
    const videoId = extractTikTokVideoId(decodedUrl);
    console.log("✅ [PLATFORM] Platform identified: TikTok", { videoId });
    return {
      platform: "tiktok",
      videoId,
      url: decodedUrl,
    };
  }

  if (urlLower.includes("instagram.com") || urlLower.includes("instagr.am")) {
    const shortcode = extractInstagramShortcode(decodedUrl);
    console.log("✅ [PLATFORM] Platform identified: Instagram", { shortcode });
    return {
      platform: "instagram",
      shortcode,
      url: decodedUrl,
    };
  }

  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
    const videoId = extractYouTubeVideoId(decodedUrl);
    console.log("✅ [PLATFORM] Platform identified: YouTube", { videoId });
    return {
      platform: "youtube",
      videoId,
      url: decodedUrl,
    };
  }

  console.log("⚠️ [PLATFORM] Platform unknown for URL:", urlLower);
  return {
    platform: "unknown",
    url: decodedUrl,
  };
}

/**
 * Extracts TikTok video ID from URL
 * @param url - TikTok video URL
 * @returns Video ID or null if not found
 */
export function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/(?:tiktok\.com\/@[\w.-]+\/video\/|tiktok\.com\/v\/|tiktok\.com\/t\/)(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extracts Instagram shortcode from URL
 * @param url - Instagram post/reel URL
 * @returns Shortcode or null if not found
 */
export function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reels?)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extracts YouTube video ID from URL
 * @param url - YouTube video URL
 * @returns Video ID or null if not found
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Validates if a platform is supported for video processing
 * @param platform - Platform to check
 * @returns True if platform is supported
 */
export function isSupportedPlatform(platform: Platform): boolean {
  return ["tiktok", "instagram", "youtube"].includes(platform);
}

/**
 * Gets platform-specific configuration
 * @param platform - Platform to get config for
 * @returns Platform configuration object
 */
export function getPlatformConfig(platform: Platform) {
  const configs = {
    tiktok: {
      maxDuration: 600, // 10 minutes
      supportedFormats: ["mp4"],
      requiresAuth: false,
    },
    instagram: {
      maxDuration: 60, // 1 minute for reels
      supportedFormats: ["mp4"],
      requiresAuth: false,
    },
    youtube: {
      maxDuration: 43200, // 12 hours
      supportedFormats: ["mp4", "webm"],
      requiresAuth: false,
    },
    unknown: {
      maxDuration: 0,
      supportedFormats: [],
      requiresAuth: false,
    },
  };

  return configs[platform] || configs.unknown;
}
