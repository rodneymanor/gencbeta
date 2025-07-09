/**
 * Video utility functions for handling thumbnails and URLs
 */

/**
 * Extract video ID from Bunny.net iframe URL
 */
export function extractBunnyVideoId(url: string): string | null {
  if (!url || !url.includes('iframe.mediadelivery.net')) {
    return null;
  }
  
  const match = url.match(/\/embed\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Generate Bunny.net thumbnail URL from video ID or iframe URL
 */
export function generateBunnyThumbnailUrl(videoIdOrUrl: string): string | null {
  let videoId: string | null = null;
  
  if (videoIdOrUrl.includes('iframe.mediadelivery.net')) {
    videoId = extractBunnyVideoId(videoIdOrUrl);
  } else {
    videoId = videoIdOrUrl;
  }
  
  if (!videoId) {
    return null;
  }
  
  return `https://iframe.mediadelivery.net/embed/thumbnails/${videoId}.jpg`;
}

/**
 * Get the best available thumbnail URL for a video
 */
export function getVideoThumbnailUrl(video: {
  thumbnailUrl?: string;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  id?: string;
}): string | null {
  // First priority: Use the stored thumbnailUrl
  if (video.thumbnailUrl) {
    return video.thumbnailUrl;
  }
  
  // Second priority: Generate from iframeUrl
  if (video.iframeUrl) {
    const bunnyThumbnail = generateBunnyThumbnailUrl(video.iframeUrl);
    if (bunnyThumbnail) {
      return bunnyThumbnail;
    }
  }
  
  // Third priority: Generate from directUrl
  if (video.directUrl) {
    const bunnyThumbnail = generateBunnyThumbnailUrl(video.directUrl);
    if (bunnyThumbnail) {
      return bunnyThumbnail;
    }
  }
  
  // Fourth priority: Generate from guid
  if (video.guid) {
    return generateBunnyThumbnailUrl(video.guid);
  }
  
  // Last priority: Generate from video ID
  if (video.id) {
    return generateBunnyThumbnailUrl(video.id);
  }
  
  return null;
}

/**
 * Check if a URL is a valid Bunny.net URL
 */
export function isBunnyUrl(url: string): boolean {
  return Boolean(url && (
    url.includes("iframe.mediadelivery.net") || 
    url.includes("bunnycdn.com") || 
    url.includes("b-cdn.net")
  ));
}

/**
 * Build iframe src URL with parameters
 */
export function buildIframeSrc(baseUrl: string, params: Record<string, string>): string {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${baseUrl}${separator}${paramString}`;
} 