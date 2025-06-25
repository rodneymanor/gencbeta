import { NextRequest, NextResponse } from "next/server";

import { uploadToBunnyStream, isBunnyStreamConfigured } from "@/lib/bunny-stream";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata,
  extractAdditionalMetadata,
  downloadVideoFromVersions,
} from "@/lib/instagram-downloader";
import {
  downloadTikTokViaRapidAPI,
  downloadTikTokDirectFallback,
  downloadTikTokViaScraper,
} from "@/lib/video-downloader";

export async function POST(request: NextRequest) {
  console.log("📥 [DOWNLOAD] Starting video download...");

  try {
    const { url } = await request.json();

    const validationResult = validateRequest(url);
    if (validationResult) {
      return validationResult;
    }

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

    const sizeValidationResult = validateVideoSize(downloadResult.videoData.size);
    if (sizeValidationResult) {
      return sizeValidationResult;
    }

    // Upload to Bunny.net CDN
    console.log("🐰 [DOWNLOAD] Uploading video to Bunny.net CDN...");
    console.log("🔍 [DOWNLOAD] Checking environment variables for Stream upload:");
    console.log("  - BUNNY_STREAM_LIBRARY_ID:", !!process.env.BUNNY_STREAM_LIBRARY_ID);
    console.log("  - BUNNY_STREAM_API_KEY:", !!process.env.BUNNY_STREAM_API_KEY);
    console.log("  - BUNNY_CDN_HOSTNAME:", !!process.env.BUNNY_CDN_HOSTNAME);

    if (!isBunnyStreamConfigured()) {
      console.log("⚠️ [DOWNLOAD] Bunny.net not configured, skipping CDN upload");
      return createSuccessResponse(downloadResult, platform, url, null);
    }

    const cdnResult = await uploadToBunnyCDN(downloadResult.videoData);

    if (!cdnResult) {
      console.error("❌ [DOWNLOAD] Failed to upload to CDN, returning original video data");
      // Fall back to returning original video data if CDN upload fails
      return createSuccessResponse(downloadResult, platform, url, null);
    }

    console.log("✅ [DOWNLOAD] Video uploaded to CDN:", cdnResult.cdnUrl);
    return createSuccessResponse(downloadResult, platform, url, cdnResult);
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

function validateRequest(url: string) {
  if (!url) {
    console.error("❌ [DOWNLOAD] No URL provided");
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }
  console.log("🔍 [DOWNLOAD] Processing URL:", url);
  return null;
}

function validateVideoSize(size: number) {
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (size > maxSize) {
    console.error("❌ [DOWNLOAD] Video too large for transcription:", size, "bytes");
    return NextResponse.json({ error: "Video is too large for transcription (max 20MB)" }, { status: 400 });
  }
  return null;
}

interface DownloadResult {
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string };
  metrics?: { likes: number; views: number; shares: number; comments: number; saves: number };
  additionalMetadata?: { author: string; duration: number };
}

interface CdnResult {
  cdnUrl: string;
  filename: string;
}

function createSuccessResponse(
  downloadResult: DownloadResult,
  platform: string,
  originalUrl: string,
  cdnResult: CdnResult | null,
) {
  const { videoData, metrics, additionalMetadata } = downloadResult;

  console.log("✅ [DOWNLOAD] Video downloaded successfully");
  console.log("📊 [DOWNLOAD] Video info:");
  console.log("  - Size:", Math.round((videoData.size / 1024 / 1024) * 100) / 100, "MB");
  console.log("  - Type:", videoData.mimeType);
  console.log("  - Platform:", platform);

  const response: Record<string, unknown> = {
    success: true,
    platform,
    metrics: metrics ?? {
      likes: 0,
      views: 0,
      shares: 0,
      comments: 0,
      saves: 0,
    },
    additionalMetadata: additionalMetadata ?? {
      author: "Unknown",
      duration: 0,
    },
    metadata: {
      originalUrl,
      platform,
      downloadedAt: new Date().toISOString(),
      readyForTranscription: true,
    },
  };

  // If CDN upload was successful, return CDN URL instead of video buffer
  if (cdnResult) {
    response.cdnUrl = cdnResult.cdnUrl;
    response.filename = cdnResult.filename;
    response.hostedOnCDN = true;
    console.log("🎯 [DOWNLOAD] Returning CDN-hosted video URL");
  } else {
    // Fallback: return video buffer for local processing
    response.videoData = {
      buffer: Array.from(new Uint8Array(videoData.buffer)), // Convert to array for JSON
      size: videoData.size,
      mimeType: videoData.mimeType,
      filename: videoData.filename ?? `${platform}-video.mp4`,
    };
    response.hostedOnCDN = false;
    console.log("📁 [DOWNLOAD] Returning video buffer for local processing");
  }

  return NextResponse.json(response);
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
  additionalMetadata?: { author: string; duration: number };
} | null> {
  if (platform === "tiktok") {
    const result = await downloadTikTokVideo(url);
    return result ? { videoData: result, additionalMetadata: { author: "Unknown", duration: 0 } } : null;
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
  additionalMetadata?: { author: string; duration: number };
} | null> {
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    console.error("❌ [DOWNLOAD] Could not extract Instagram shortcode");
    return null;
  }

  console.log("🆔 [DOWNLOAD] Instagram shortcode:", shortcode);

  try {
    console.log("📱 [DOWNLOAD] Fetching Instagram metadata...");
    const metadata = await fetchInstagramMetadata(shortcode);

    if (!metadata) {
      console.log("❌ [DOWNLOAD] No metadata returned, falling back to basic download");
      return await fallbackToBasicDownload();
    }

    console.log("📊 [DOWNLOAD] Extracting metrics from metadata...");
    const metrics = extractMetricsFromMetadata(metadata);
    const additionalMetadata = extractAdditionalMetadata(metadata);

    console.log("🎥 [DOWNLOAD] Downloading video from versions...");
    const videoData = await downloadVideoFromVersions(metadata.video_versions, shortcode);

    if (!videoData) {
      console.log("❌ [DOWNLOAD] Failed to download video data");
      return null;
    }

    console.log("✅ [DOWNLOAD] Successfully downloaded Instagram video with metrics:", metrics);
    console.log("📋 [DOWNLOAD] Additional metadata:", additionalMetadata);
    return { videoData, metrics, additionalMetadata };
  } catch (error) {
    console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", error);
    console.log("🔄 [DOWNLOAD] Falling back to basic download...");
    return await fallbackToBasicDownload();
  }
}

async function fallbackToBasicDownload() {
  // Simplified fallback - just return null for now
  console.log("🔄 [DOWNLOAD] Basic download fallback not implemented");
  return null;
}

async function uploadToBunnyCDN(videoData: {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
}): Promise<{ cdnUrl: string; filename: string } | null> {
  try {
    console.log("🐰 [DOWNLOAD] Uploading to CDN...");

    if (videoData.buffer.byteLength === 0) {
      console.error("❌ [DOWNLOAD] No video buffer data available");
      return null;
    }

    const buffer = Buffer.from(videoData.buffer);
    const result = await uploadToBunnyStream(buffer, videoData.filename ?? "video.mp4", videoData.mimeType);

    if (result) {
      console.log("✅ [DOWNLOAD] CDN upload successful");
    } else {
      console.error("❌ [DOWNLOAD] CDN upload failed");
    }

    return result;
  } catch (error) {
    console.error("❌ [DOWNLOAD] CDN upload error:", error);
    return null;
  }
}
