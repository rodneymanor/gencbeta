import { NextRequest, NextResponse } from "next/server";

import { processCreatorProfile, ProcessCreatorRequest, ProcessCreatorResponse } from "@/lib/process-creator-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [PROCESS_CREATOR] Starting profile processing...");

    // Validate request has content
    const contentLength = request.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return NextResponse.json(
        {
          success: false,
          error: "Empty request body. Please provide username, platform, and videoCount.",
        },
        { status: 400 },
      );
    }

    let body: ProcessCreatorRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }
    const { username, platform, videoCount } = body;

    // Validate input
    if (!username || !platform || !videoCount) {
      return NextResponse.json(
        {
          success: false,
          error: "Username, platform, and video count are required",
        },
        { status: 400 },
      );
    }

    if (!["tiktok", "instagram"].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "Platform must be 'tiktok' or 'instagram'",
        },
        { status: 400 },
      );
    }

    if (videoCount < 1 || videoCount > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Video count must be between 1 and 200",
        },
        { status: 400 },
      );
    }

    console.log(`🔍 [PROCESS_CREATOR] Processing ${platform} profile: @${username}`);

    // Use the shared utility function
    const result = await processCreatorProfile(username, platform, videoCount);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to process profile",
        },
        { status: 404 },
      );
    }

    console.log(`✅ [PROCESS_CREATOR] Successfully extracted ${result.extractedVideos.length} videos`);

    const response: ProcessCreatorResponse = {
      success: true,
      extractedVideos: result.extractedVideos,
      totalFound: result.totalFound,
      message: `Successfully extracted ${result.extractedVideos.length} videos from @${username}'s ${platform} profile. Use /api/process-creator/download-all to download and transcribe these videos.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [PROCESS_CREATOR] Failed to process profile:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process profile",
      },
      { status: 500 },
    );
  }
}
