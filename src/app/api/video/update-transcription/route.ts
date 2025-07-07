import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

interface TranscriptionUpdateRequest {
  videoUrl: string;
  transcript: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext: string;
}

export async function POST(request: NextRequest) {
  console.log("🔄 [UPDATE_TRANSCRIPTION] Starting video transcription update...");

  try {
    // Check if Admin SDK is initialized
    
    if (!isAdminInitialized || !adminDb) {
      console.error("❌ [UPDATE_TRANSCRIPTION] Firebase Admin SDK not initialized");
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Parse request body
    const updateData: TranscriptionUpdateRequest = await request.json();
    const { videoUrl, transcript, components, contentMetadata, visualContext } = updateData;

    if (!videoUrl || !transcript) {
      console.error("❌ [UPDATE_TRANSCRIPTION] Missing required fields");
      return NextResponse.json({ error: "videoUrl and transcript are required" }, { status: 400 });
    }

    console.log("🔍 [UPDATE_TRANSCRIPTION] Searching for video with URL:", videoUrl);

    // Find the video document by URL
    const videosRef = adminDb.collection("videos");
    const querySnapshot = await videosRef.where("url", "==", videoUrl).get();

    if (querySnapshot.empty) {
      console.log("⚠️ [UPDATE_TRANSCRIPTION] No video found with URL:", videoUrl);
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Update all matching videos (there should typically be only one)
    const updatePromises = querySnapshot.docs.map(async (doc) => {
      const videoId = doc.id;
      const existingData = doc.data();

      console.log("📝 [UPDATE_TRANSCRIPTION] Updating video:", videoId);
      console.log("📊 [UPDATE_TRANSCRIPTION] Current transcript length:", existingData.transcript?.length ?? 0);
      console.log("📊 [UPDATE_TRANSCRIPTION] New transcript length:", transcript.length);

      // Prepare update data
      const updateFields = {
        transcript,
        components,
        contentMetadata,
        visualContext,
        transcriptionStatus: "completed",
        transcriptionCompletedAt: new Date().toISOString(),
        updatedAt: new Date(),
      };

      // Update the video document
      await doc.ref.update(updateFields);

      console.log("✅ [UPDATE_TRANSCRIPTION] Successfully updated video:", videoId);
      return videoId;
    });

    const updatedVideoIds = await Promise.all(updatePromises);

    console.log("🎉 [UPDATE_TRANSCRIPTION] Transcription update completed successfully");
    console.log("📊 [UPDATE_TRANSCRIPTION] Updated videos:", updatedVideoIds.length);

    return NextResponse.json({
      success: true,
      message: "Video transcription updated successfully",
      updatedVideos: updatedVideoIds.length,
      videoIds: updatedVideoIds,
      transcriptLength: transcript.length,
      platform: contentMetadata.platform,
    });
  } catch (error) {
    console.error("❌ [UPDATE_TRANSCRIPTION] Update failed:", error);
    return NextResponse.json(
      {
        error: "Failed to update video transcription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
