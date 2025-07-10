import { NextRequest, NextResponse } from "next/server";

import { getTikTokAdditionalMetadata, getTikTokMetrics } from "@/lib/tiktok-downloader";
import {
  downloadTikTokVideo,
  downloadInstagramVideoWithMetrics,
  detectPlatform,
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

    // Decode URL if it's URL-encoded (fixes Instagram issue)
    const decodedUrl = decodeURIComponent(url);
    console.log("🔍 [DOWNLOADER] Processing URL:", url);
    console.log("🔍 [DOWNLOADER] Decoded URL:", decodedUrl);

    const platform = detectPlatform(decodedUrl);
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

    const downloadResult = await downloadVideo(decodedUrl, platform);

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
        originalUrl: decodedUrl,
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

async function downloadVideo(url: string, platform: string): Promise<DownloadResult | null> {
  if (platform === "tiktok") {
    const videoResult = await downloadTikTokVideo(url);
    if (!videoResult) return null;

    const additionalMetadata = await getTikTokAdditionalMetadata(url);
    const metrics = await getTikTokMetrics(url);

    return {
      videoData: videoResult,
      additionalMetadata: additionalMetadata as any, // include description & hashtags
      metrics,
    };
  } else if (platform === "instagram") {
    return await downloadInstagramVideoWithMetrics(url);
  }
  return null;
}
