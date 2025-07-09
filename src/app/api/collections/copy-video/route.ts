import { NextRequest, NextResponse } from "next/server";

import { CollectionsService } from "@/lib/collections";
import { verifyVideoOwnership } from "@/lib/collections-helpers";

/**
 * POST /api/collections/copy-video
 * Body: { userId: string; videoId: string; targetCollectionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, targetCollectionId } = await request.json();

    if (!userId || !videoId || targetCollectionId === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify ownership
    const ownership = await verifyVideoOwnership(userId, videoId);
    if (!ownership.exists) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const newVideoId = await CollectionsService.copyVideo(userId, videoId, targetCollectionId);

    return NextResponse.json({ success: true, message: "Video copied successfully", newVideoId });
  } catch (error) {
    console.error("Error copying video:", error);
    return NextResponse.json(
      { error: "Failed to copy video", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
