import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";

interface ProcessingStatusResponse {
  success: boolean;
  jobId: string;
  status:
    | "discovering_videos"
    | "processing_videos"
    | "waiting_transcriptions"
    | "generating_templates"
    | "creating_voice"
    | "completed"
    | "failed";
  progress: number;
  currentStep: number;
  totalSteps: number;
  stepName: string;
  startedAt: string;
  estimatedCompletionAt?: string;
  completedAt?: string;
  videosDiscovered?: number;
  videosProcessed?: number;
  transcriptionsCompleted?: number;
  totalVideos?: number;
  templatesGenerated?: number;
  voiceId?: string;
  collectionId?: string;
  collectionName?: string;
  error?: string;
  metadata?: any;
}

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    console.log(`📊 [STATUS] Checking status for job: ${jobId}`);

    // Get job document
    const jobDoc = await adminDb.collection("voice_creation_jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();

    // Verify user owns this job
    if (jobData?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Calculate estimated completion time if still processing
    let estimatedCompletionAt = jobData?.estimatedCompletionAt;
    if (jobData?.status !== "completed" && jobData?.status !== "failed" && jobData?.startedAt) {
      const startTime = new Date(jobData.startedAt).getTime();
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progressPercent = jobData?.progress || 0;

      if (progressPercent > 0) {
        const estimatedTotal = (elapsed / progressPercent) * 100;
        const remaining = estimatedTotal - elapsed;
        estimatedCompletionAt = new Date(currentTime + remaining).toISOString();
      }
    }

    const response: ProcessingStatusResponse = {
      success: true,
      jobId,
      status: jobData?.status || "unknown",
      progress: jobData?.progress || 0,
      currentStep: jobData?.currentStep || 1,
      totalSteps: jobData?.totalSteps || 4,
      stepName: jobData?.stepName || "Processing",
      startedAt: jobData?.startedAt,
      estimatedCompletionAt,
      completedAt: jobData?.completedAt,
      videosDiscovered: jobData?.videosDiscovered,
      videosProcessed: jobData?.videosProcessed,
      transcriptionsCompleted: jobData?.transcriptionsCompleted,
      totalVideos: jobData?.totalVideos,
      templatesGenerated: jobData?.templatesGenerated,
      voiceId: jobData?.voiceId,
      collectionId: jobData?.collectionId,
      collectionName: jobData?.metadata?.collectionName,
      error: jobData?.error,
      metadata: {
        platform: jobData?.platform,
        username: jobData?.username,
        voiceName: jobData?.voiceName,
        videoCount: jobData?.videoCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [STATUS] Failed to get processing status:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get processing status",
      },
      { status: 500 },
    );
  }
}

// Optional: Add a DELETE endpoint to cancel processing jobs
export async function DELETE(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    const { jobId } = params;

    console.log(`🛑 [CANCEL] Cancelling job: ${jobId}`);

    // Get job document
    const jobDoc = await adminDb.collection("voice_creation_jobs").doc(jobId).get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data();

    // Verify user owns this job
    if (jobData?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only allow cancellation of active jobs
    if (jobData?.status === "completed" || jobData?.status === "failed") {
      return NextResponse.json({ error: "Cannot cancel completed or failed jobs" }, { status: 400 });
    }

    // Update job status to cancelled
    await adminDb.collection("voice_creation_jobs").doc(jobId).update({
      status: "cancelled",
      completedAt: new Date().toISOString(),
      progress: 100,
      error: "Job cancelled by user",
    });

    console.log(`✅ [CANCEL] Successfully cancelled job: ${jobId}`);

    return NextResponse.json({
      success: true,
      message: "Job cancelled successfully",
      jobId,
    });
  } catch (error) {
    console.error("🔥 [CANCEL] Failed to cancel job:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel job",
      },
      { status: 500 },
    );
  }
}
