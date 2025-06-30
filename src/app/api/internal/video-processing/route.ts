// Internal API for authenticated video processing

import { NextRequest, NextResponse } from "next/server";

import { verifyCollectionOwnershipAdmin } from "@/lib/collections-admin-helpers";
import { getAdminAuth } from "@/lib/firebase-admin";
import { RateLimitService } from "@/lib/rate-limiting";
import { VideoCollectionService, type VideoProcessingData } from "@/lib/video-collection-service";
import { VideoProcessingQueue } from "@/lib/video-processing-queue";
import {
  VIDEO_PROCESSING_ERRORS,
  type VideoProcessingResponse,
  type ProcessingStatusResponse,
} from "@/types/video-processing";

// Helper functions for cleaner code organization
async function validateUserToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const idToken = authHeader.substring(7);
    const adminAuth = getAdminAuth();

    if (!adminAuth) {
      console.error("Firebase Admin Auth not initialized");
      return null;
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("Token validation error:", error);
    return null;
  }
}

function validateVideoUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
  return VideoCollectionService.validatePlatformUrl(url);
}

async function verifyCollectionAccess(userId: string, collectionId: string): Promise<boolean> {
  try {
    const ownership = await verifyCollectionOwnershipAdmin(userId, collectionId);
    return ownership.exists;
  } catch (error) {
    console.error("Collection verification error:", error);
    return false;
  }
}

async function handleRateLimit(userId: string, requestId: string) {
  try {
    const rateLimitResult = await RateLimitService.checkMultipleRateLimits(userId, "video-processing", [
      "video-processing",
      "video-processing-burst",
    ]);

    if (!rateLimitResult.allowed) {
      const burstLimit = rateLimitResult.results["video-processing-burst"];
      const hourlyLimit = rateLimitResult.results["video-processing"];
      const retryAfter = Math.min(burstLimit.retryAfter ?? Infinity, hourlyLimit.retryAfter ?? Infinity);

      console.log(`⏱️ [${requestId}] Rate limit exceeded, retry after: ${retryAfter}s`);

      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.RATE_LIMITED,
          message: "Rate limit exceeded. Please try again later.",
          retryAfter,
          rateLimits: rateLimitResult.results,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": String(Math.min(burstLimit.remaining, hourlyLimit.remaining)),
          },
        },
      );
    }

    console.log(`✅ [${requestId}] Rate limit check passed`);
    return null;
  } catch (rateLimitError) {
    console.warn(`⚠️ [${requestId}] Rate limiting unavailable, proceeding: ${rateLimitError}`);
    return null;
  }
}

async function tryAdvancedProcessing(
  requestId: string,
  userId: string,
  collectionId: string,
  videoUrl: string,
  title?: string,
): Promise<NextResponse | null> {
  try {
    console.log(`🔄 [${requestId}] Attempting advanced processing via queue`);

    const job = await VideoProcessingQueue.addJob(userId, collectionId, videoUrl, title, "normal");
    const userJobs = await VideoProcessingQueue.getUserJobs(userId, 5);
    const queuePosition =
      userJobs.filter((j) => ["queued", "processing"].includes(j.status) && j.createdAt < job.createdAt).length + 1;

    console.log(`✅ [${requestId}] Advanced processing job created: ${job.id}`);

    const response: VideoProcessingResponse = {
      success: true,
      jobId: job.id,
      message: "Video queued for processing successfully",
      estimatedTime: 45,
      queuePosition,
      job,
    };

    return NextResponse.json(response, { status: 202 });
  } catch (queueError) {
    console.warn(`⚠️ [${requestId}] Queue processing failed, falling back to direct processing: ${queueError}`);
    return null;
  }
}

async function tryDirectProcessing(
  requestId: string,
  userId: string,
  collectionId: string,
  videoUrl: string,
  title?: string,
): Promise<NextResponse> {
  try {
    console.log(`🔄 [${requestId}] Attempting direct processing fallback`);

    const videoData: VideoProcessingData = VideoCollectionService.createVideoDataFromUrl(videoUrl, title);
    const result = await VideoCollectionService.addVideoToCollection(userId, collectionId, videoData);

    if (result.success) {
      console.log(`✅ [${requestId}] Direct processing successful`);
      return NextResponse.json({
        success: true,
        jobId: Math.random().toString(36).substring(7),
        message: result.message,
        processingType: "direct",
        fallbackUsed: result.fallbackUsed,
        videoId: result.videoId,
      });
    } else {
      console.log(`❌ [${requestId}] Direct processing failed: ${result.message}`);
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.DOWNLOAD_FAILED,
          message: result.message,
        },
        { status: 500 },
      );
    }
  } catch (directError) {
    console.error(`❌ [${requestId}] Direct processing failed: ${directError}`);
    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
        message: "Processing fallback failed",
        details: directError instanceof Error ? directError.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/internal/video-processing
 * Add a video to collection with guaranteed success through fallback processing
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🚀 [${requestId}] Internal video processing request started`);

  try {
    // 1. Validate Firebase authentication
    const userId = await validateUserToken(request);
    if (!userId) {
      console.log(`❌ [${requestId}] Authentication failed`);
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.INSUFFICIENT_PERMISSIONS,
          message: "Authentication required",
        },
        { status: 401 },
      );
    }
    console.log(`✅ [${requestId}] User authenticated: ${userId}`);

    // 2. Check rate limits
    const rateLimitResponse = await handleRateLimit(userId, requestId);
    if (rateLimitResponse) return rateLimitResponse;

    // 3. Parse and validate request body
    const body = await request.json();
    const { videoUrl, collectionId, title } = body;

    if (!videoUrl || !collectionId) {
      console.log(`❌ [${requestId}] Missing required fields`);
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.INVALID_URL,
          message: "Video URL and collection ID are required",
        },
        { status: 400 },
      );
    }
    console.log(`📋 [${requestId}] Request validated - URL: ${videoUrl}, Collection: ${collectionId}`);

    // 4. Validate video URL
    const urlValidation = validateVideoUrl(videoUrl);
    if (!urlValidation.isValid) {
      console.log(`❌ [${requestId}] URL validation failed: ${urlValidation.error}`);
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.UNSUPPORTED_PLATFORM,
          message: urlValidation.error,
        },
        { status: 400 },
      );
    }
    console.log(`✅ [${requestId}] URL validated for platform: ${urlValidation.platform}`);

    // 5. Verify collection access
    const hasAccess = await verifyCollectionAccess(userId, collectionId);
    if (!hasAccess) {
      console.log(`❌ [${requestId}] Collection access denied`);
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.COLLECTION_NOT_FOUND,
          message: "Collection not found or access denied",
        },
        { status: 404 },
      );
    }
    console.log(`✅ [${requestId}] Collection access verified`);

    // 6. Try advanced processing first
    const advancedResult = await tryAdvancedProcessing(requestId, userId, collectionId, videoUrl, title);
    if (advancedResult) return advancedResult;

    // 7. Fallback to direct processing
    return await tryDirectProcessing(requestId, userId, collectionId, videoUrl, title);
  } catch (error) {
    console.error(`❌ [${requestId}] Unexpected error: ${error}`);
    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
        message: "Internal server error occurred",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/internal/video-processing?jobId=xxx
 * Check processing status of a specific job
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🔍 [${requestId}] Processing status check for job: ${jobId}`);

  if (!jobId) {
    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.INVALID_URL,
        message: "Job ID is required",
      },
      { status: 400 },
    );
  }

  try {
    const userId = await validateUserToken(request);
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.INSUFFICIENT_PERMISSIONS,
          message: "Authentication required",
        },
        { status: 401 },
      );
    }

    const job = await VideoProcessingQueue.getJob(jobId);

    if (!job || job.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.USER_NOT_FOUND,
          message: "Job not found or access denied",
        },
        { status: 404 },
      );
    }

    const response: ProcessingStatusResponse = {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      canRetry: job.status === "failed" && job.attempts < job.maxAttempts,
      estimatedTimeRemaining: job.progress.estimatedTimeRemaining,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ [${requestId}] Status check failed: ${error}`);
    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
        message: "Failed to check job status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
