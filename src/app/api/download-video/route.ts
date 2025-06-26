import { NextRequest, NextResponse } from "next/server";

import { isBunnyStreamConfigured } from "@/lib/bunny-stream";
import {
  uploadToBunnyCDN,
  downloadTikTokVideo,
  downloadInstagramVideoWithMetrics,
  type DownloadResult,
  type CdnResult,
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
    // Start background transcription without waiting
    startBackgroundTranscription(downloadResult.videoData, platform, url);
    return createSuccessResponse(downloadResult, platform, url, null);
  }

  const cdnResult = await uploadToBunnyCDN(downloadResult.videoData);

  if (!cdnResult) {
    console.error("❌ [DOWNLOAD] Failed to upload to CDN, returning original video data");
    // Start background transcription without waiting
    startBackgroundTranscription(downloadResult.videoData, platform, url);
    return createSuccessResponse(downloadResult, platform, url, null);
  }

  console.log("✅ [DOWNLOAD] Video uploaded to CDN:", cdnResult.cdnUrl);

  // Start background transcription without waiting for it to complete
  startBackgroundTranscription(downloadResult.videoData, platform, url);

  return createSuccessResponse(downloadResult, platform, url, cdnResult);
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

/**
 * Start transcription in the background without blocking the response
 */
async function startBackgroundTranscription(
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string },
  platform: string,
  originalUrl: string,
) {
  console.log("🎬 [BACKGROUND] Starting background transcription for:", originalUrl);

  // Use setTimeout to ensure this runs after the response is sent
  setTimeout(async () => {
    try {
      console.log("🎬 [BACKGROUND] Processing transcription...");
      const transcriptionResult = await callCompleteAnalysisService(videoData);

      if (transcriptionResult) {
        console.log("✅ [BACKGROUND] Complete analysis completed successfully");
        console.log("📝 [BACKGROUND] Transcription length:", transcriptionResult.transcript.length);
        console.log("📊 [BACKGROUND] Platform detected:", transcriptionResult.contentMetadata.platform);
        // TODO: Update video record in database with transcription result
        // This would require knowing the video ID, which we could pass as a parameter
      } else {
        console.log("⚠️ [BACKGROUND] Complete analysis failed");
      }
    } catch (error) {
      console.error("❌ [BACKGROUND] Background analysis error:", error);
    }
  }, 100); // Small delay to ensure response is sent first
}

/**
 * Call the complete analysis service for background processing
 */
async function callCompleteAnalysisService(videoData: {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
}) {
  try {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

    const formData = new FormData();
    const blob = new Blob([videoData.buffer], { type: videoData.mimeType });
    formData.append("video", blob, videoData.filename ?? "video.mp4");

    const response = await fetch(`${baseUrl}/api/video/analyze-complete`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error("❌ [BACKGROUND] Complete analysis service failed:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ [BACKGROUND] Complete analysis service error:", error);
    return null;
  }
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
      transcriptionStatus: "pending", // Indicates transcription is happening in background
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
