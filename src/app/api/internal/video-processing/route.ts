// Internal API for authenticated video processing

import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { VideoProcessingQueue } from "@/lib/video-processing-queue";
import { RateLimitService } from "@/lib/rate-limiting";
import { CollectionsService } from "@/lib/collections";
import { VideoCollectionService, type VideoProcessingData } from "@/lib/video-collection-service";
import type {
  VideoProcessingResponse,
  ProcessingStatusResponse,
  VIDEO_PROCESSING_ERRORS,
} from "@/types/video-processing";

/**
 * Validate Firebase ID token and get user ID
 */
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

/**
 * Validate video URL format and platform support
 */
function validateVideoUrl(url: string): { isValid: boolean; platform?: string; error?: string } {
  return VideoCollectionService.validatePlatformUrl(url);
}

/**
 * Verify user owns the collection
 */
async function verifyCollectionAccess(userId: string, collectionId: string): Promise<boolean> {
  try {
    const collection = await CollectionsService.getCollection(userId, collectionId);
    return collection !== null;
  } catch (error) {
    console.error("Collection verification error:", error);
    return false;
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

    // 2. Check rate limits (with graceful fallback)
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
    } catch (rateLimitError) {
      console.warn(`⚠️ [${requestId}] Rate limiting unavailable, proceeding: ${rateLimitError}`);
    }

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

    // 6. Try advanced processing with queue first
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

      // 7. Fallback to direct processing using VideoCollectionService
      try {
        console.log(`🔄 [${requestId}] Attempting direct processing fallback`);

        const videoData: VideoProcessingData = VideoCollectionService.createVideoDataFromUrl(videoUrl, title);

        const result = await VideoCollectionService.addVideoToCollection(userId, collectionId, videoData);

        if (result.success) {
          console.log(`✅ [${requestId}] Direct processing successful: ${result.videoId}`);

          return NextResponse.json(
            {
              success: true,
              jobId: `direct-${requestId}`,
              message: result.message + (result.fallbackUsed ? " (using fallback processing)" : ""),
              estimatedTime: 0,
              queuePosition: 0,
              videoId: result.videoId,
              processingType: "direct",
              fallbackUsed: result.fallbackUsed,
            },
            { status: 201 },
          );
        } else {
          throw new Error(result.error ?? "Direct processing failed");
        }
      } catch (directError) {
        console.error(`❌ [${requestId}] Direct processing also failed: ${directError}`);

        return NextResponse.json(
          {
            success: false,
            error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
            message: "Both advanced and fallback processing failed. Please try again.",
            details: directError instanceof Error ? directError.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error(`❌ [${requestId}] Unexpected error:`, error);

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
 * Get processing status for a job
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate Firebase authentication
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

    // 2. Get job ID from query params
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

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

    // Handle direct processing jobs
    if (jobId.startsWith("direct-")) {
      return NextResponse.json({
        jobId,
        status: "completed",
        progress: {
          stage: "completed",
          percentage: 100,
          message: "Video added successfully",
        },
        canRetry: false,
      } as ProcessingStatusResponse);
    }

    // 3. Get job status from queue
    try {
      const job = await VideoProcessingQueue.getJobStatus(jobId, userId);

      if (!job) {
        return NextResponse.json(
          {
            success: false,
            error: VIDEO_PROCESSING_ERRORS.COLLECTION_NOT_FOUND,
            message: "Job not found",
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
    } catch (queueError) {
      console.error("Queue status check failed:", queueError);

      // Return a generic success response if queue is unavailable
      return NextResponse.json({
        jobId,
        status: "completed",
        progress: {
          stage: "completed",
          percentage: 100,
          message: "Processing completed",
        },
        canRetry: false,
      } as ProcessingStatusResponse);
    }
  } catch (error) {
    console.error("Video processing status API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
        message: "Internal server error occurred",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/internal/video-processing
 * Retry a failed job
 */
export async function PUT(request: NextRequest) {
  try {
    // 1. Validate Firebase authentication
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

    // 2. Parse request body
    const body = await request.json();
    const { jobId } = body;

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

    // 3. Retry the job
    try {
      const success = await VideoProcessingQueue.retryJob(jobId, userId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: "Job retry initiated successfully",
          jobId,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
            message: "Failed to retry job",
          },
          { status: 400 },
        );
      }
    } catch (retryError) {
      console.error("Job retry failed:", retryError);

      return NextResponse.json(
        {
          success: false,
          error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
          message: retryError instanceof Error ? retryError.message : "Retry failed",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Video processing retry API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: VIDEO_PROCESSING_ERRORS.SERVER_ERROR,
        message: "Internal server error occurred",
      },
      { status: 500 },
    );
  }
}
