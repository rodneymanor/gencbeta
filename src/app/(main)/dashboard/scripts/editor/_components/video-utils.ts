// Video utility functions for parsing and handling Bunny.net URLs

export interface BunnyVideoInfo {
  libraryId: string;
  videoId: string;
  isValid: boolean;
}

/**
 * Parse Bunny.net video information from various URL formats
 */
export function parseBunnyVideoUrl(url: string): BunnyVideoInfo {
  const defaultResult: BunnyVideoInfo = {
    libraryId: "",
    videoId: "",
    isValid: false,
  };

  if (!url || typeof url !== "string") {
    return defaultResult;
  }

  // Try to match iframe embed URL format
  const iframeMatch = url.match(/iframe\.mediadelivery\.net\/embed\/(\d+)\/([a-f0-9-]+)/i);
  if (iframeMatch) {
    return {
      libraryId: iframeMatch[1],
      videoId: iframeMatch[2],
      isValid: true,
    };
  }

  // Try to match player URL format
  const playerMatch = url.match(/iframe\.mediadelivery\.net\/play\/(\d+)\/([a-f0-9-]+)/i);
  if (playerMatch) {
    return {
      libraryId: playerMatch[1],
      videoId: playerMatch[2],
      isValid: true,
    };
  }

  return defaultResult;
}

/**
 * Generate Bunny.net iframe URL from components
 */
export function generateBunnyIframeUrl(
  libraryId: string,
  videoId: string,
  options: {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    preload?: boolean;
    responsive?: boolean;
  } = {},
): string {
  const { autoplay = false, muted = false, loop = false, preload = true, responsive = true } = options;

  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    muted: muted.toString(),
    loop: loop.toString(),
    preload: preload.toString(),
    responsive: responsive.toString(),
  });

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params.toString()}`;
}

/**
 * Generate Bunny.net player URL for opening in new tab
 */
export function generateBunnyPlayerUrl(libraryId: string, videoId: string): string {
  return `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;
}

/**
 * Validate video ID format (should be UUID format)
 */
export function isValidVideoId(videoId: string): boolean {
  const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  return uuidRegex.test(videoId);
}

/**
 * Validate library ID format (should be numeric)
 */
export function isValidLibraryId(libraryId: string): boolean {
  return /^\d+$/.test(libraryId);
}

/**
 * Extract video information from HTML content
 */
export function extractVideoFromHtml(html: string): BunnyVideoInfo | null {
  if (!html || typeof html !== "string") {
    return null;
  }

  // Try to find iframe src
  const iframeSrcMatch = html.match(/src=["']([^"']*iframe\.mediadelivery\.net[^"']*)["']/i);
  if (iframeSrcMatch) {
    return parseBunnyVideoUrl(iframeSrcMatch[1]);
  }

  // Try to find plain URLs in text
  const urlMatch = html.match(/https?:\/\/iframe\.mediadelivery\.net\/[^\s<>]+/i);
  if (urlMatch) {
    return parseBunnyVideoUrl(urlMatch[0]);
  }

  return null;
}
