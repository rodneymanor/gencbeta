interface TikTokMetadata {
  data?: {
    aweme_detail?: {
      video?: {
        play_addr?: {
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
