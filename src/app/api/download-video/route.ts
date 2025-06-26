import { NextRequest, NextResponse } from "next/server";

import { isBunnyStreamConfigured } from "@/lib/bunny-stream";
import {
  transcribeVideoData,
  uploadToBunnyCDN,
  downloadTikTokVideo,
  downloadInstagramVideoWithMetrics,
  type DownloadResult,
  type CdnResult,
  type TranscriptionResult,
} from "@/lib/video-processing-helpers";

export async function POST(request: NextRequest) {
  console.log("📥 [DOWNLOAD] Starting video download...");

  try {
    const { url } = await request.json();
    return await processVideoDownload(url);
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

async function processVideoDownload(url: string) {
  const validationResult = validateRequest(url);
  if (validationResult) {
    return validationResult;
  }

  const platform = detectPlatform(url);
  console.log("🎯 [DOWNLOAD] Platform detected:", platform);

  if (!["tiktok", "instagram"].includes(platform)) {
    console.error("❌ [DOWNLOAD] Unsupported platform:", platform);
    return NextResponse.json({ error: "Only TikTok and Instagram videos are supported for download" }, { status: 400 });
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

  return await processVideoUpload(downloadResult, platform, url);
}

async function processVideoUpload(downloadResult: DownloadResult, platform: string, url: string) {
  console.log("🐰 [DOWNLOAD] Uploading video to Bunny.net CDN...");
  console.log("🔍 [DOWNLOAD] Checking environment variables for Stream upload:");
  console.log("  - BUNNY_STREAM_LIBRARY_ID:", !!process.env.BUNNY_STREAM_LIBRARY_ID);
  console.log("  - BUNNY_STREAM_API_KEY:", !!process.env.BUNNY_STREAM_API_KEY);
  console.log("  - BUNNY_CDN_HOSTNAME:", !!process.env.BUNNY_CDN_HOSTNAME);

  if (!isBunnyStreamConfigured()) {
    console.log("⚠️ [DOWNLOAD] Bunny.net not configured, skipping CDN upload");
    return createSuccessResponse(downloadResult, platform, url, null);
  }

  // Transcribe video BEFORE uploading to CDN (using original video data)
  console.log("🎬 [DOWNLOAD] Transcribing video...");
  const transcriptionResult = await transcribeVideoData(downloadResult.videoData, platform);

  if (!transcriptionResult) {
    console.log("⚠️ [DOWNLOAD] Transcription failed, but continuing with video processing");
  }

  const cdnResult = await uploadToBunnyCDN(downloadResult.videoData);

  if (!cdnResult) {
    console.error("❌ [DOWNLOAD] Failed to upload to CDN, returning original video data with transcription");
    return createSuccessResponse(downloadResult, platform, url, null, transcriptionResult);
  }

  console.log("✅ [DOWNLOAD] Video uploaded to CDN:", cdnResult.cdnUrl);
  return createSuccessResponse(downloadResult, platform, url, cdnResult, transcriptionResult);
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

function createSuccessResponse(
  downloadResult: DownloadResult,
  platform: string,
  originalUrl: string,
  cdnResult: CdnResult | null,
  transcriptionResult: TranscriptionResult | null = null,
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

  // Include transcription result if available
  if (transcriptionResult) {
    response.transcription = transcriptionResult;
    (response.metadata as Record<string, unknown>).readyForTranscription = false; // Already transcribed
  }

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
