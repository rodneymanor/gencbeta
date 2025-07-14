import { NextRequest, NextResponse } from "next/server";

import { CreatorMediaService } from "@/lib/creator-media-service";
import { CreatorService } from "@/lib/creator-service";

interface UploadCreatorMediaRequest {
  creatorId: string;
  adminKey?: string;
}

// In-memory lock to prevent concurrent uploads for the same creator
const uploadLocks = new Map<string, Promise<any>>();

// Timeout for upload operations (10 minutes)
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    console.log("🎬 [CREATOR_MEDIA] Starting creator media upload to Bunny.net...");

    // Parse request body
    let body: UploadCreatorMediaRequest;
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

    const { creatorId, adminKey } = body;

    // Basic admin authentication check
    if (adminKey !== process.env.ADMIN_SYNC_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid admin key",
        },
        { status: 401 },
      );
    }

    if (!creatorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator ID is required",
        },
        { status: 400 },
      );
    }

    console.log(`🔍 [CREATOR_MEDIA] Processing media for creator: ${creatorId}`);

    // Check if there's already an upload in progress for this creator
    if (uploadLocks.has(creatorId)) {
      console.log(`⏳ [CREATOR_MEDIA] Upload already in progress for creator ${creatorId}, waiting...`);
      try {
        const existingUpload = await uploadLocks.get(creatorId);
        console.log(`✅ [CREATOR_MEDIA] Existing upload completed, returning result`);
        return existingUpload;
      } catch (error) {
        console.error(`❌ [CREATOR_MEDIA] Existing upload failed:`, error);
        uploadLocks.delete(creatorId);
      }
    }

    // Create a new upload promise with timeout and add it to the lock
    const uploadPromise = Promise.race([
      (async () => {
      try {
        // Get creator profile
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

        console.log(`✅ [CREATOR_MEDIA] Found creator @${creator.username} on ${creator.platform}`);

        // Check if creator already has Bunny media to avoid re-processing
        const hasExistingMedia = await CreatorMediaService.hasCreatorBunnyMedia(creatorId);
        if (hasExistingMedia) {
          console.log(`ℹ️ [CREATOR_MEDIA] Creator already has Bunny media, retrieving existing URLs...`);
          const existingMedia = await CreatorMediaService.getCreatorBunnyMedia(creatorId);

          return NextResponse.json({
            success: true,
            creator: {
              id: creator.id,
              username: creator.username,
              platform: creator.platform,
            },
            results: existingMedia,
            message: `Using existing Bunny media for @${creator.username}`,
            cached: true,
          });
        }

        // Upload all media using the service
        const results = await CreatorMediaService.uploadCreatorMediaToBunny(creatorId);

        if (!results) {
          return NextResponse.json(
            {
              success: false,
              error: `Failed to upload media for @${creator.username}`,
            },
            { status: 500 },
          );
        }

        console.log(`🎉 [CREATOR_MEDIA] Upload completed for @${creator.username}`);

        return NextResponse.json({
          success: true,
          creator: {
            id: creator.id,
            username: creator.username,
            platform: creator.platform,
          },
          results,
          message: `Successfully processed media for @${creator.username}`,
          cached: false,
        });
      } finally {
        // Always clean up the lock when done
        uploadLocks.delete(creatorId);
        console.log(`🧹 [CREATOR_MEDIA] Cleaned up upload lock for creator: ${creatorId}`);
      }
    })(),
    // Timeout promise
    new Promise((_, reject) => 
      setTimeout(() => {
        uploadLocks.delete(creatorId);
        reject(new Error(`Upload timeout after ${UPLOAD_TIMEOUT_MS / 1000} seconds`));
      }, UPLOAD_TIMEOUT_MS)
    )
  ]);

    // Add the promise to the lock map
    uploadLocks.set(creatorId, uploadPromise);

    // Wait for and return the result
    return await uploadPromise;
  } catch (error) {
    console.error("🔥 [CREATOR_MEDIA] Failed to upload creator media:", error);
    
    // Clean up lock in case of error
    if (creatorId) {
      uploadLocks.delete(creatorId);
      console.log(`🧹 [CREATOR_MEDIA] Cleaned up upload lock after error for creator: ${creatorId}`);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload creator media",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Use POST method to upload creator media",
      usage: {
        method: "POST",
        body: {
          creatorId: "string (required) - Creator ID to process media for",
          adminKey: "string (required) - Admin authentication key",
        },
        example: {
          creatorId: "creator123",
          adminKey: "your-admin-key",
        },
      },
    },
    { status: 405 },
  );
}
