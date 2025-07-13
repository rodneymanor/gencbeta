import { NextRequest, NextResponse } from "next/server";

import { VideoDownloader } from "@/core/video/downloader";
import { authenticateApiKey } from "@/lib/api-key-auth";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (keeping existing auth)
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // User authenticated successfully

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    console.log("🎥 [DOWNLOAD] Processing video download request...");

    const result = await VideoDownloader.download(url);

    if (!result) {
      return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
    }

    console.log("✅ [DOWNLOAD] Video download completed successfully");

    return NextResponse.json({
      success: true,
      videoData: result.videoData,
      metrics: result.metrics,
      additionalMetadata: result.additionalMetadata,
    });
  } catch (error) {
    console.error("❌ [DOWNLOAD] Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
