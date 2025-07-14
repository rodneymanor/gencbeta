import { NextRequest, NextResponse } from "next/server";

import { CreatorService } from "../../../../../lib/creator-service";
import { VideoService } from "../../../../../lib/video-service";

interface GetCreatorVideosResponse {
  success: boolean;
  videos?: any[];
  total?: number;
  message: string;
  error?: string;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ creatorId: string }> }) {
  try {
    const { creatorId } = await params;

    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator ID is required",
        },
        { status: 400 },
      );
    }

    console.log(`🔍 [CREATOR_VIDEOS] Fetching videos for creator: ${creatorId}`);

    // Verify creator exists
    const creator = await CreatorService.getCreatorById(creatorId);
    if (!creator) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 },
      );
    }

    // Get videos for the creator
    const videos = await VideoService.getVideosByCreatorId(creatorId);

    console.log(`📊 [CREATOR_VIDEOS] Found ${videos.length} videos for creator ${creatorId}`);

    const response: GetCreatorVideosResponse = {
      success: true,
      videos,
      total: videos.length,
      message: `Found ${videos.length} videos for @${creator.username}`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [CREATOR_VIDEOS] Failed to fetch creator videos:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch creator videos",
      },
      { status: 500 },
    );
  }
}
