import { NextRequest, NextResponse } from "next/server";

import {
  downloadTikTokVideo,
  downloadInstagramVideoWithMetrics,
  type DownloadResult,
} from "@/lib/video-processing-helpers";

export async function POST(request: NextRequest) {
  console.log("📥 [DOWNLOADER] Starting video download service...");

  try {
    const { url } = await request.json();

    if (!url) {
      console.error("❌ [DOWNLOADER] No URL provided");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log("🔍 [DOWNLOADER] Processing URL:", url);

    const platform = detectPlatform(url);
    console.log("🎯 [DOWNLOADER] Platform detected:", platform);

    if (!["tiktok", "instagram"].includes(platform)) {
      console.error("❌ [DOWNLOADER] Unsupported platform:", platform);
      return NextResponse.json(
        {
          error: "Only TikTok and Instagram videos are supported for download",
        },
        { status: 400 },
      );
    }

    const downloadResult = await downloadVideo(url, platform);

    if (!downloadResult) {
      console.error("❌ [DOWNLOADER] Failed to download video");
      return NextResponse.json(
        {
          error: "Failed to download video from the provided URL",
        },
        { status: 500 },
      );
    }

    console.log("✅ [DOWNLOADER] Video downloaded successfully");
    console.log("📊 [DOWNLOADER] Video info:");
    console.log("  - Size:", Math.round((downloadResult.videoData.size / 1024 / 1024) * 100) / 100, "MB");
    console.log("  - Type:", downloadResult.videoData.mimeType);
    console.log("  - Platform:", platform);

    return NextResponse.json({
      success: true,
      platform,
      videoData: {
        buffer: Array.from(new Uint8Array(downloadResult.videoData.buffer)),
        size: downloadResult.videoData.size,
        mimeType: downloadResult.videoData.mimeType,
        filename: downloadResult.videoData.filename ?? `${platform}-video.mp4`,
      },
      metrics: downloadResult.metrics ?? {
        likes: 0,
        views: 0,
        shares: 0,
        comments: 0,
        saves: 0,
      },
      additionalMetadata: downloadResult.additionalMetadata ?? {
        author: "Unknown",
        duration: 0,
      },
      metadata: {
        originalUrl: url,
        platform,
        downloadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [DOWNLOADER] Download error:", error);
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
  console.log("🔍 [DOWNLOADER] Analyzing URL for platform detection:", urlLower);

  if (urlLower.includes("tiktok.com")) {
    console.log("✅ [DOWNLOADER] Platform identified: TikTok");
    return "tiktok";
  }
  if (urlLower.includes("instagram.com")) {
    console.log("✅ [DOWNLOADER] Platform identified: Instagram");
    return "instagram";
  }

  console.log("⚠️ [DOWNLOADER] Platform unknown for URL:", urlLower);
  return "unknown";
}

async function downloadVideo(url: string, platform: string): Promise<DownloadResult | null> {
  if (platform === "tiktok") {
    const result = await downloadTikTokVideo(url);
    return result
      ? {
          videoData: result,
          additionalMetadata: { author: "Unknown", duration: 0 },
        }
      : null;
  } else if (platform === "instagram") {
    return downloadInstagramVideoWithMetrics(url);
  }
  return null;
}
