import { NextRequest, NextResponse } from "next/server";

import { streamToBunnyFromUrl } from "@/lib/bunny-stream";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata,
  extractAdditionalMetadata,
} from "@/lib/instagram-downloader";
import { detectPlatform } from "@/lib/video-processing-helpers";

export async function POST(request: NextRequest) {
  console.log("🌊 [STREAM_TO_BUNNY] Starting direct stream service...");

  try {
    const { url } = await request.json();

    if (!url) {
      console.error("❌ [STREAM_TO_BUNNY] No URL provided");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    console.log("🔍 [STREAM_TO_BUNNY] Processing URL:", url);

    const platform = detectPlatform(url);
    console.log("🎯 [STREAM_TO_BUNNY] Platform detected:", platform);

    if (platform !== "instagram") {
      console.error("❌ [STREAM_TO_BUNNY] Only Instagram is supported for direct streaming");
      return NextResponse.json({ error: "Only Instagram videos are supported for direct streaming" }, { status: 400 });
    }

    // Extract shortcode from URL
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      console.error("❌ [STREAM_TO_BUNNY] Could not extract Instagram shortcode");
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    console.log("🆔 [STREAM_TO_BUNNY] Instagram shortcode:", shortcode);

    // Get metadata and video URLs
    console.log("📱 [STREAM_TO_BUNNY] Fetching Instagram metadata...");
    const metadata = await fetchInstagramMetadata(shortcode);

    if (!metadata || !metadata.video_versions || metadata.video_versions.length === 0) {
      console.error("❌ [STREAM_TO_BUNNY] No video versions found");
      return NextResponse.json({ error: "Could not find video to stream" }, { status: 500 });
    }

    // Extract metrics and additional metadata
    const metrics = extractMetricsFromMetadata(metadata);
    const additionalMetadata = extractAdditionalMetadata(metadata);

    // Get the best video URL (try smallest first for faster streaming)
    const videoVersions = metadata.video_versions;
    const videoUrl = videoVersions[videoVersions.length - 1]?.url;

    if (!videoUrl) {
      console.error("❌ [STREAM_TO_BUNNY] No video URL found");
      return NextResponse.json({ error: "Could not extract video URL" }, { status: 500 });
    }

    console.log("🎥 [STREAM_TO_BUNNY] Starting direct stream to Bunny CDN...");
    const filename = `instagram-${shortcode}.mp4`;

    // Stream directly to Bunny CDN
    const cdnUrl = await streamToBunnyFromUrl(videoUrl, filename);

    if (!cdnUrl) {
      console.error("❌ [STREAM_TO_BUNNY] Failed to stream to Bunny CDN");
      return NextResponse.json({ error: "Failed to stream video to CDN" }, { status: 500 });
    }

    console.log("✅ [STREAM_TO_BUNNY] Direct stream completed successfully");

    return NextResponse.json({
      success: true,
      platform,
      cdnUrl,
      filename,
      metrics,
      additionalMetadata,
      metadata: {
        originalUrl: url,
        platform,
        streamedAt: new Date().toISOString(),
        method: "direct_stream",
      },
    });
  } catch (error) {
    console.error("❌ [STREAM_TO_BUNNY] Stream error:", error);
    return NextResponse.json(
      {
        error: "Failed to stream video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reels?)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
