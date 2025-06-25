import { NextRequest, NextResponse } from "next/server";

import {
  downloadTikTokViaRapidAPI,
  downloadTikTokDirectFallback,
  downloadTikTokViaScraper,
  downloadInstagramViaRapidAPI,
  downloadInstagramDirectFallback,
} from "@/lib/video-downloader";

export async function POST(request: NextRequest) {
  console.log("📥 [DOWNLOAD] Starting video download...");

  try {
    const { url } = await request.json();

    if (!url) {
      console.error("❌ [DOWNLOAD] No URL provided");
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    console.log("🔍 [DOWNLOAD] Processing URL:", url);

    const platform = detectPlatform(url);
    console.log("🎯 [DOWNLOAD] Platform detected:", platform);

    if (!["tiktok", "instagram"].includes(platform)) {
      console.error("❌ [DOWNLOAD] Unsupported platform:", platform);
      return NextResponse.json(
        { error: "Only TikTok and Instagram videos are supported for download" },
        { status: 400 },
      );
    }

    const downloadResult = await downloadVideo(url, platform);

    if (!downloadResult) {
      console.error("❌ [DOWNLOAD] Failed to download video");
      return NextResponse.json({ error: "Failed to download video from the provided URL" }, { status: 500 });
    }

    const { videoData, metrics } = downloadResult;

    console.log("✅ [DOWNLOAD] Video downloaded successfully");
    console.log("📊 [DOWNLOAD] Video info:");
    console.log("  - Size:", Math.round((videoData.size / 1024 / 1024) * 100) / 100, "MB");
    console.log("  - Type:", videoData.mimeType);
    console.log("  - Platform:", platform);

    // Check if video is under 20MB limit
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (videoData.size > maxSize) {
      console.error("❌ [DOWNLOAD] Video too large for transcription:", videoData.size, "bytes");
      return NextResponse.json({ error: "Video is too large for transcription (max 20MB)" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      platform,
      videoData: {
        buffer: Array.from(new Uint8Array(videoData.buffer)), // Convert to array for JSON
        size: videoData.size,
        mimeType: videoData.mimeType,
        filename: videoData.filename ?? `${platform}-video.mp4`,
      },
      metrics: metrics ?? {
        likes: 0,
        views: 0,
        shares: 0,
        comments: 0,
        saves: 0,
      },
      metadata: {
        originalUrl: url,
        platform,
        downloadedAt: new Date().toISOString(),
        readyForTranscription: true,
      },
    });
  } catch (error) {
    console.error("❌ [DOWNLOAD] Video download error:", error);
    console.error("❌ [DOWNLOAD] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        error: "Failed to download video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  console.log("🔍 [DOWNLOAD] Analyzing URL for platform detection:", urlLower);

  if (urlLower.includes("tiktok.com")) {
    console.log("✅ [DOWNLOAD] Platform identified: TikTok");
    return "tiktok";
  }
  if (urlLower.includes("instagram.com")) {
    console.log("✅ [DOWNLOAD] Platform identified: Instagram");
    return "instagram";
  }

  console.log("⚠️ [DOWNLOAD] Platform unknown for URL:", urlLower);
  return "unknown";
}

async function downloadVideo(
  url: string,
  platform: string,
): Promise<{
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string };
  metrics?: { likes: number; views: number; shares: number; comments: number; saves: number };
} | null> {
  if (platform === "tiktok") {
    const result = await downloadTikTokVideo(url);
    return result ? { videoData: result } : null;
  } else if (platform === "instagram") {
    return downloadInstagramVideoWithMetrics(url);
  }
  return null;
}

async function downloadTikTokVideo(
  url: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  console.log("🎵 [DOWNLOAD] Downloading TikTok video...");

  const videoId = extractTikTokVideoId(url);
  if (!videoId) {
    console.error("❌ [DOWNLOAD] Could not extract TikTok video ID");
    return null;
  }

  console.log("🆔 [DOWNLOAD] TikTok video ID:", videoId);

  // Try different download methods
  const methods = [
    () => downloadTikTokViaRapidAPI(videoId),
    () => downloadTikTokDirectFallback(url, videoId),
    () => downloadTikTokViaScraper(url),
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result) {
        return result;
      }
    } catch (error) {
      console.log("❌ [DOWNLOAD] Method failed:", error);
    }
  }

  console.error("❌ [DOWNLOAD] All TikTok download methods failed");
  return null;
}

async function downloadInstagramVideo(
  url: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  console.log("📸 [DOWNLOAD] Downloading Instagram video...");

  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    console.error("❌ [DOWNLOAD] Could not extract Instagram shortcode");
    return null;
  }

  console.log("🆔 [DOWNLOAD] Instagram shortcode:", shortcode);

  // Try different download methods
  const methods = [
    () => downloadInstagramViaRapidAPI(shortcode),
    () => downloadInstagramDirectFallback(url, shortcode),
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result) {
        return result;
      }
    } catch (error) {
      console.log("❌ [DOWNLOAD] Method failed:", error);
    }
  }

  console.error("❌ [DOWNLOAD] All Instagram download methods failed");
  return null;
}

function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function downloadInstagramVideoWithMetrics(url: string): Promise<{
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string };
  metrics?: { likes: number; views: number; shares: number; comments: number; saves: number };
} | null> {
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    console.error("❌ [DOWNLOAD] Could not extract Instagram shortcode");
    return null;
  }

  console.log("🆔 [DOWNLOAD] Instagram shortcode:", shortcode);

  try {
    const metadata = await fetchInstagramMetadata(shortcode);
    if (!metadata) {
      return await fallbackToBasicDownload(url);
    }

    const metrics = extractMetricsFromMetadata(metadata);
    const videoData = await downloadVideoFromVersions(metadata.video_versions, shortcode);

    if (!videoData) {
      return null;
    }

    return { videoData, metrics };
  } catch (error) {
    console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", error);
    return await fallbackToBasicDownload(url);
  }
}

async function fetchInstagramMetadata(shortcode: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  console.log("🌐 [DOWNLOAD] Calling Instagram RapidAPI with 30s timeout...");

  const response = await fetch(
    `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reel_by_shortcode?shortcode=${shortcode}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e",
        "x-rapidapi-host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
      },
      signal: controller.signal,
    },
  );

  clearTimeout(timeoutId);

  if (!response.ok) {
    console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", response.status);
    return null;
  }

  return response.json();
}

function extractMetricsFromMetadata(metadata: any) {
  const metrics = {
    likes: metadata.like_count ?? 0,
    views: metadata.play_count ?? 0,
    shares: metadata.reshare_count ?? 0,
    comments: 0, // Not available in this API response
    saves: 0, // Not available in this API response
  };

  console.log("📊 [DOWNLOAD] Extracted metrics:", metrics);
  return metrics;
}

async function downloadVideoFromVersions(videoVersions: any[], shortcode: string) {
  if (!videoVersions || videoVersions.length === 0) {
    console.error("❌ [DOWNLOAD] No video versions found in Instagram RapidAPI response");
    return null;
  }

  console.log("🔗 [DOWNLOAD] Instagram video versions found:", videoVersions.length, "options");

  // Try video versions, starting with the smallest
  for (let i = videoVersions.length - 1; i >= 0; i--) {
    const videoVersion = videoVersions[i];
    const videoUrl = videoVersion.url;

    const result = await tryDownloadFromUrl(videoUrl, i + 1);
    if (result) {
      return {
        ...result,
        filename: `instagram-${shortcode}.mp4`,
      };
    }
  }

  return null;
}

async function tryDownloadFromUrl(videoUrl: string, version: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;
      const mimeType = response.headers.get("content-type") ?? "video/mp4";

      console.log(`✅ [DOWNLOAD] Successfully downloaded from Instagram version ${version}`);

      return { buffer, size, mimeType };
    }
  } catch (error) {
    console.log(`❌ [DOWNLOAD] Instagram version ${version} failed:`, error);
  }

  return null;
}

async function fallbackToBasicDownload(url: string) {
  const basicResult = await downloadInstagramVideo(url);
  return basicResult ? { videoData: basicResult } : null;
}
