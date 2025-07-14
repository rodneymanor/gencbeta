interface TikTokMetadata {
  data?: {
    aweme_detail?: {
      video?: {
        play_addr?: {
          url_list?: string[];
        };
        cover?: {
          url_list?: string[];
        };
        dynamic_cover?: {
          url_list?: string[];
        };
      };
    };
  };
}

interface TikTokVideoResult {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
}

// Simple in-memory cache for TikTok API responses (24 hour TTL)
const tiktokCache = new Map<string, { data: TikTokMetadata; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function extractTikTokVideoId(url: string): Promise<string | null> {
  // Decode URL-encoded URLs
  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
    console.log("🔍 [EXTRACT] Original URL:", url);
    console.log("🔍 [EXTRACT] Decoded URL:", decodedUrl);
  } catch (error) {
    console.log("⚠️ [EXTRACT] URL decode failed, using original:", url);
    decodedUrl = url;
  }

  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = decodedUrl.match(pattern);
    if (match) {
      const extractedId = match[1];
      console.log("✅ [EXTRACT] Initial ID found:", extractedId);

      // If it's already a full numeric ID (from @user/video/ pattern), use it directly
      if (/^\d+$/.test(extractedId)) {
        console.log("✅ [EXTRACT] Full numeric video ID:", extractedId);
        return extractedId;
      }

      // If it's a short code, resolve it to get the full video ID
      console.log("🔄 [EXTRACT] Short code detected, resolving to full ID...");
      try {
        const fullId = await resolveShortUrlToFullId(decodedUrl);
        if (fullId) {
          console.log("✅ [EXTRACT] Resolved to full video ID:", fullId);
          return fullId;
        }
      } catch (error) {
        console.log("⚠️ [EXTRACT] Failed to resolve short URL:", error);
      }

      // Fallback: return the short code (though it likely won't work with API)
      console.log("⚠️ [EXTRACT] Using short code as fallback:", extractedId);
      return extractedId;
    }
  }

  console.log("❌ [EXTRACT] No video ID found with any pattern");
  return null;
}

async function resolveShortUrlToFullId(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Make a HEAD request to follow redirects without downloading content
      const response = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        signal: controller.signal,
        redirect: "follow", // Follow redirects automatically
      });

      // Get the final URL after redirects
      const finalUrl = response.url;
      console.log("🔄 [EXTRACT] Resolved URL:", finalUrl);

      // Extract full video ID from the resolved URL
      const fullIdMatch = finalUrl.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
      if (fullIdMatch) {
        return fullIdMatch[1];
      }

      console.log("⚠️ [EXTRACT] No full video ID found in resolved URL");
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.log("❌ [EXTRACT] Error resolving short URL:", error);
    return null;
  }
}

function throwApiError(status: number): never {
  if (status === 429) {
    throw new Error(
      "TikTok download service temporarily unavailable due to rate limits. Please try again in a few minutes.",
    );
  } else if (status === 404) {
    throw new Error("TikTok video not found. The video may be private, deleted, or the URL is incorrect.");
  } else {
    throw new Error("TikTok download service is currently unavailable. Please try again later.");
  }
}

async function fetchTikTokMetadata(videoId: string): Promise<TikTokMetadata> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const metadataResponse = await fetch(
      `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/video/${videoId}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "",
          "x-rapidapi-host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com",
        },
        signal: controller.signal,
      },
    );

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error("❌ [DOWNLOAD] TikTok RapidAPI error:", metadataResponse.status, errorText);
      throwApiError(metadataResponse.status);
    }

    return (await metadataResponse.json()) as TikTokMetadata;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function downloadVideoContent(videoUrl: string, videoId: string): Promise<TikTokVideoResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const videoResponse = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.tiktok.com/",
      },
      signal: controller.signal,
    });

    if (!videoResponse.ok) return null;

    const buffer = await videoResponse.arrayBuffer();
    const size = buffer.byteLength;
    const mimeType = videoResponse.headers.get("content-type") ?? "video/mp4";

    if (size <= 1000) return null; // Ensure we got actual video data

    console.log(
      `✅ [DOWNLOAD] Successfully downloaded TikTok video (${Math.round((size / 1024 / 1024) * 100) / 100}MB)`,
    );

    return {
      buffer,
      size,
      mimeType,
      filename: `tiktok-${videoId}.mp4`,
    };
  } catch (error) {
    console.log("❌ [DOWNLOAD] Video download failed:", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function cleanupCache(): void {
  if (tiktokCache.size <= 100) return;

  const now = Date.now();
  for (const [key, value] of tiktokCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      tiktokCache.delete(key);
    }
  }
}

async function getMetadata(videoId: string): Promise<TikTokMetadata> {
  const cacheKey = `tiktok_${videoId}`;
  const cached = tiktokCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("💾 [DOWNLOAD] Using cached TikTok metadata");
    return cached.data;
  }

  console.log("🌐 [DOWNLOAD] Fetching TikTok metadata from RapidAPI...");
  const metadata = await fetchTikTokMetadata(videoId);

  tiktokCache.set(cacheKey, { data: metadata, timestamp: Date.now() });
  cleanupCache();

  return metadata;
}

function extractVideoUrls(metadata: TikTokMetadata): string[] {
  const videoData = metadata.data?.aweme_detail?.video;
  const videoUrls = videoData?.play_addr?.url_list;

  if (!videoUrls || videoUrls.length === 0) {
    console.error("❌ [DOWNLOAD] No video URLs found in TikTok response");
    throw new Error("Unable to extract video download links. The video may be private or restricted.");
  }

  return videoUrls;
}

async function tryDownloadFromUrls(videoUrls: string[], videoId: string): Promise<TikTokVideoResult> {
  console.log("🔗 [DOWNLOAD] Found", videoUrls.length, "TikTok video quality options");

  // Prioritize lowest quality (last URL in the list typically)
  const prioritizedUrls = [...videoUrls].reverse();

  for (let i = 0; i < prioritizedUrls.length; i++) {
    console.log(`📥 [DOWNLOAD] Attempting download from quality option ${i + 1}/${prioritizedUrls.length}`);
    const result = await downloadVideoContent(prioritizedUrls[i], videoId);
    if (result) return result;
  }

  throw new Error("Unable to download video from any available quality options. Please try again later.");
}

function handleError(error: unknown): never {
  if (error instanceof Error && error.name === "AbortError") {
    throw new Error("TikTok download timed out. Please check your connection and try again.");
  }

  if (error instanceof Error && error.message.includes("TikTok")) {
    throw error;
  }

  console.error("❌ [DOWNLOAD] TikTok download error:", error);
  throw new Error("Failed to download TikTok video. Please check the URL and try again.");
}

export async function downloadTikTokVideo(url: string): Promise<TikTokVideoResult | null> {
  console.log("🎵 [DOWNLOAD] Downloading TikTok video via RapidAPI...");

  const videoId = await extractTikTokVideoId(url);
  if (!videoId) {
    console.error("❌ [DOWNLOAD] Could not extract TikTok video ID from URL:", url);
    throw new Error("Invalid TikTok URL format. Please check the URL and try again.");
  }

  console.log("🆔 [DOWNLOAD] TikTok video ID:", videoId);

  try {
    const metadata = await getMetadata(videoId);
    const videoUrls = extractVideoUrls(metadata);
    return await tryDownloadFromUrls(videoUrls, videoId);
  } catch (error) {
    handleError(error);
  }
}

export function extractAdditionalMetadataFromTikTok(metadata: any) {
  // Extract author (nickname) if available
  const author = metadata?.data?.aweme_detail?.author?.nickname ?? "Unknown";

  // Extract duration (in seconds) if available
  const duration = metadata?.data?.aweme_detail?.video?.duration ?? 0;

  // Caption text lives in `desc`
  const description: string = metadata?.data?.aweme_detail?.desc ?? "";

  // Parse hashtags from caption text (max 30, unique)
  const hashtags = Array.from(
    new Set((description.match(/#[A-Za-z0-9_]+/g) || []).map((h: string) => h.substring(1))),
  ).slice(0, 30);

  return {
    author,
    duration,
    description,
    hashtags,
  };
}

export function extractTikTokThumbnailUrl(metadata: any): string | undefined {
  try {
    const videoData = metadata?.data?.aweme_detail?.video;

    // Try dynamic_cover first (animated thumbnail)
    if (videoData?.dynamic_cover?.url_list?.length > 0) {
      const thumbnail = videoData.dynamic_cover.url_list[0];
      console.log("🖼️ [DOWNLOAD] Extracted TikTok thumbnail from dynamic_cover:", thumbnail);
      return thumbnail;
    }

    // Fallback to static cover
    if (videoData?.cover?.url_list?.length > 0) {
      const thumbnail = videoData.cover.url_list[0];
      console.log("🖼️ [DOWNLOAD] Extracted TikTok thumbnail from cover:", thumbnail);
      return thumbnail;
    }

    console.log("⚠️ [DOWNLOAD] No thumbnail found in TikTok metadata");
    return undefined;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Error extracting TikTok thumbnail URL:", error);
    return undefined;
  }
}

export function extractTikTokMetrics(metadata: any) {
  const statistics = metadata?.data?.aweme_detail?.statistics;

  if (!statistics) {
    console.log("⚠️ [METRICS] No statistics found in TikTok metadata");
    return {
      likes: 0,
      views: 0,
      shares: 0,
      comments: 0,
      saves: 0,
    };
  }

  const metrics = {
    likes: statistics.digg_count ?? 0,
    views: statistics.play_count ?? 0,
    shares: statistics.share_count ?? 0,
    comments: statistics.comment_count ?? 0,
    saves: statistics.collect_count ?? 0,
  };

  console.log("📊 [METRICS] Extracted TikTok metrics:", metrics);
  return metrics;
}

/**
 * Convenience helper: given a TikTok URL, fetches RapidAPI metadata and returns a simplified
 * object containing author, duration, caption (description) and parsed hashtags.
 */
export async function getTikTokAdditionalMetadata(url: string): Promise<{
  author: string;
  duration: number;
  description: string;
  hashtags: string[];
}> {
  try {
    const videoId = await extractTikTokVideoId(url);
    if (!videoId) {
      console.log("⚠️ [METADATA] Unable to extract video ID for additional metadata");
      return { author: "Unknown", duration: 0, description: "", hashtags: [] };
    }

    const metadata = await getMetadata(videoId);
    return extractAdditionalMetadataFromTikTok(metadata);
  } catch (error) {
    console.error("❌ [METADATA] Failed to fetch TikTok additional metadata:", error);
    return { author: "Unknown", duration: 0, description: "", hashtags: [] };
  }
}

/**
 * Convenience helper: given a TikTok URL, fetches RapidAPI metadata and returns the thumbnail URL.
 */
export async function getTikTokThumbnailUrl(url: string): Promise<string | undefined> {
  try {
    const videoId = await extractTikTokVideoId(url);
    if (!videoId) {
      console.log("⚠️ [THUMBNAIL] Unable to extract video ID for thumbnail");
      return undefined;
    }

    const metadata = await getMetadata(videoId);
    return extractTikTokThumbnailUrl(metadata);
  } catch (error) {
    console.error("❌ [THUMBNAIL] Failed to fetch TikTok thumbnail:", error);
    return undefined;
  }
}

/**
 * Convenience helper: given a TikTok URL, fetches RapidAPI metadata and returns the video metrics.
 */
export async function getTikTokMetrics(url: string): Promise<{
  likes: number;
  views: number;
  shares: number;
  comments: number;
  saves: number;
}> {
  try {
    const videoId = await extractTikTokVideoId(url);
    if (!videoId) {
      console.log("⚠️ [METRICS] Unable to extract video ID for metrics");
      return { likes: 0, views: 0, shares: 0, comments: 0, saves: 0 };
    }

    const metadata = await getMetadata(videoId);
    return extractTikTokMetrics(metadata);
  } catch (error) {
    console.error("❌ [METRICS] Failed to fetch TikTok metrics:", error);
    return { likes: 0, views: 0, shares: 0, comments: 0, saves: 0 };
  }
}
