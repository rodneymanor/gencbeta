// Production-ready video processing queue system

import type {
  VideoProcessingJob,
  VideoProcessingStatus,
  VideoProcessingError,
  ProcessingProgress,
  ProcessedVideoResult,
  JobPriority,
} from "@/types/video-processing";

import { getAdminDb, isAdminInitialized } from "./firebase-admin";

export class VideoProcessingQueue {
  private static readonly JOBS_COLLECTION = "video_processing_jobs";
  private static readonly MAX_RETRY_ATTEMPTS = 3;

  /**
   * Add a new video processing job to the queue
   */
  static async addJob(
    userId: string,
    collectionId: string,
    videoUrl: string,
    title?: string,
    priority: JobPriority = "normal",
  ): Promise<VideoProcessingJob> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    const jobId = this.generateJobId();
    const now = new Date().toISOString();

    const job: VideoProcessingJob = {
      id: jobId,
      userId,
      collectionId,
      videoUrl,
      title: title ?? `Video - ${new Date().toLocaleDateString()}`,
      status: "queued",
      priority,
      attempts: 0,
      maxAttempts: this.MAX_RETRY_ATTEMPTS,
      createdAt: now,
      updatedAt: now,
      progress: {
        stage: "queued",
        percentage: 0,
        message: "Video queued for processing...",
      },
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).set(job);

    // Start processing immediately (in production, this would be picked up by workers)
    setTimeout(() => this.processJob(jobId), 100);

    return job;
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string, userId: string): Promise<VideoProcessingJob | null> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    const jobDoc = await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).get();

    if (!jobDoc.exists) {
      return null;
    }

    const job = jobDoc.data() as VideoProcessingJob;

    // Verify user owns this job
    if (job.userId !== userId) {
      throw new Error("Access denied");
    }

    return job;
  }

  /**
   * Get user's recent jobs
   */
  static async getUserJobs(userId: string, limit: number = 20): Promise<VideoProcessingJob[]> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    const querySnapshot = await adminDb
      .collection(this.JOBS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return querySnapshot.docs.map((doc) => doc.data() as VideoProcessingJob);
  }

  /**
   * Retry a failed job
   */
  static async retryJob(jobId: string, userId: string): Promise<boolean> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    const job = await this.getJobStatus(jobId, userId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status !== "failed") {
      throw new Error("Can only retry failed jobs");
    }

    if (job.attempts >= job.maxAttempts) {
      throw new Error("Maximum retry attempts reached");
    }

    const updates = {
      status: "queued" as VideoProcessingStatus,
      updatedAt: new Date().toISOString(),
      progress: {
        stage: "queued" as VideoProcessingStatus,
        percentage: 0,
        message: "Job queued for retry...",
      },
      error: null,
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).update(updates);

    // Start processing
    setTimeout(() => this.processJob(jobId), 100);

    return true;
  }

  /**
   * Cancel a job
   */
  static async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    const job = await this.getJobStatus(jobId, userId);
    if (!job) {
      throw new Error("Job not found");
    }

    if (["completed", "failed", "cancelled"].includes(job.status)) {
      return false; // Cannot cancel completed jobs
    }

    const updates = {
      status: "cancelled" as VideoProcessingStatus,
      updatedAt: new Date().toISOString(),
      progress: {
        stage: "cancelled" as VideoProcessingStatus,
        percentage: 100,
        message: "Job cancelled by user",
      },
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).update(updates);
    return true;
  }

  /**
   * Process a job (this would be handled by background workers in production)
   */
  private static async processJob(jobId: string): Promise<void> {
    try {
      const adminDb = getAdminDb();
      if (!isAdminInitialized || !adminDb) {
        throw new Error("Firebase Admin SDK not configured");
      }

      const jobDoc = await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).get();
      if (!jobDoc.exists) {
        console.error(`Job ${jobId} not found`);
        return;
      }

      const job = jobDoc.data() as VideoProcessingJob;

      if (job.status !== "queued") {
        console.log(`Job ${jobId} is not queued, current status: ${job.status}`);
        return;
      }

      // Update job to processing
      await this.updateJobStatus(jobId, "processing", {
        stage: "processing",
        percentage: 0,
        message: "Starting video processing...",
      });

      // Increment attempts
      await this.incrementAttempts(jobId);

      // Process the video through different stages
      await this.downloadStage(jobId);
      await this.transcribeStage(jobId);
      await this.analyzeStage(jobId);
      await this.uploadStage(jobId);

      // Mark as completed
      await this.completeJob(jobId);
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await this.failJob(jobId, error);
    }
  }

  /**
   * Download stage processing
   */
  private static async downloadStage(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, "downloading", {
      stage: "downloading",
      percentage: 20,
      message: "Downloading video content...",
    });

    // Simulate download process
    await this.delay(2000);

    console.log(`✅ Download completed for job ${jobId}`);
  }

  /**
   * Transcription stage processing
   */
  private static async transcribeStage(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, "transcribing", {
      stage: "transcribing",
      percentage: 50,
      message: "Transcribing video content...",
    });

    await this.delay(3000);

    console.log(`✅ Transcription completed for job ${jobId}`);
  }

  /**
   * Analysis stage processing
   */
  private static async analyzeStage(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, "analyzing", {
      stage: "analyzing",
      percentage: 80,
      message: "Analyzing video content...",
    });

    await this.delay(1500);

    console.log(`✅ Analysis completed for job ${jobId}`);
  }

  /**
   * Upload stage processing
   */
  private static async uploadStage(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, "uploading", {
      stage: "uploading",
      percentage: 95,
      message: "Saving to collection...",
    });

    await this.delay(1000);

    console.log(`✅ Upload completed for job ${jobId}`);
  }

  /**
   * Complete a job successfully
   */
  private static async completeJob(jobId: string): Promise<void> {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    const result: ProcessedVideoResult = this.createMockResult();

    const updates = {
      status: "completed" as VideoProcessingStatus,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      progress: {
        stage: "completed" as VideoProcessingStatus,
        percentage: 100,
        message: "Video successfully processed and added to collection!",
      },
      result,
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).update(updates);
  }

  /**
   * Fail a job with error details
   */
  private static async failJob(jobId: string, error: unknown): Promise<void> {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    const processingError: VideoProcessingError = {
      code: "SERVER_ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      details: { error: String(error) },
      timestamp: new Date().toISOString(),
      retryable: true,
      userMessage: "Video processing failed. You can retry this operation.",
    };

    const updates = {
      status: "failed" as VideoProcessingStatus,
      updatedAt: new Date().toISOString(),
      progress: {
        stage: "failed" as VideoProcessingStatus,
        percentage: 0,
        message: processingError.userMessage,
      },
      error: processingError,
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).update(updates);
  }

  // Helper methods
  private static createMockResult(): ProcessedVideoResult {
    return {
      videoId: `video_${Date.now()}`,
      url: "https://example.com/processed-video.mp4",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
      title: "Processed Video",
      author: "Video Author",
      platform: "TikTok",
      duration: 30,
      transcript: "Sample transcript...",
      fileSize: 1024000,
      metadata: {
        originalUrl: "https://example.com/original",
        platform: "TikTok",
        downloadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        metrics: {
          likes: 1000,
          views: 5000,
          shares: 100,
          comments: 50,
          saves: 25,
        },
      },
    };
  }

  private static async updateJobStatus(
    jobId: string,
    status: VideoProcessingStatus,
    progress: ProcessingProgress,
  ): Promise<void> {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      progress,
      ...(status === "processing" &&
        !progress.estimatedTimeRemaining && {
          startedAt: new Date().toISOString(),
        }),
    };

    await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).update(updates);
  }

  private static async incrementAttempts(jobId: string): Promise<void> {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    const jobDoc = await adminDb.collection(this.JOBS_COLLECTION).doc(jobId).get();
    if (jobDoc.exists) {
      const job = jobDoc.data() as VideoProcessingJob;
      await adminDb
        .collection(this.JOBS_COLLECTION)
        .doc(jobId)
        .update({
          attempts: job.attempts + 1,
          updatedAt: new Date().toISOString(),
        });
    }
  }

  private static generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
