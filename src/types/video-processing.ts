// Video processing types for production-ready collection system

export interface VideoProcessingJob {
  id: string;
  userId: string;
  collectionId: string;
  videoUrl: string;
  title?: string;
  status: VideoProcessingStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: VideoProcessingError;
  progress: ProcessingProgress;
  result?: ProcessedVideoResult;
}

export type VideoProcessingStatus =
  | "queued"
  | "processing"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "uploading"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled";

export type JobPriority = "low" | "normal" | "high" | "urgent";

export interface VideoProcessingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  retryable: boolean;
  userMessage: string;
}

export interface ProcessingProgress {
  stage: VideoProcessingStatus;
  percentage: number;
  message: string;
  estimatedTimeRemaining?: number;
}

export interface ProcessedVideoResult {
  videoId: string;
  url: string;
  thumbnailUrl: string;
  title: string;
  author: string;
  platform: string;
  duration: number;
  transcript?: string;
  components?: VideoComponents;
  insights?: VideoInsights;
  fileSize: number;
  metadata: VideoMetadata;
}

export interface VideoComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface VideoInsights {
  engagementRate: number;
  contentType: string;
  keyTopics: string[];
  sentiment: "positive" | "negative" | "neutral";
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface VideoMetadata {
  originalUrl: string;
  platform: string;
  downloadedAt: string;
  processedAt: string;
  cdnUrl?: string;
  iframeUrl?: string;
  metrics: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
}

// Rate limiting types
export interface RateLimitInfo {
  userId: string;
  endpoint: string;
  requestCount: number;
  windowStart: string;
  windowDuration: number; // in seconds
  limit: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: string;
  retryAfter?: number;
}

// Processing queue types
export interface ProcessingQueueStatus {
  totalJobs: number;
  queuedJobs: number;
  processingJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  estimatedWaitTime: number;
}

export interface UserProcessingStats {
  userId: string;
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  recentJobs: VideoProcessingJob[];
  rateLimitStatus: RateLimitResult;
}

// API Response types
export interface VideoProcessingResponse {
  success: boolean;
  jobId: string;
  message: string;
  estimatedTime: number;
  queuePosition: number;
  job: VideoProcessingJob;
}

export interface ProcessingStatusResponse {
  jobId: string;
  status: VideoProcessingStatus;
  progress: ProcessingProgress;
  result?: ProcessedVideoResult;
  error?: VideoProcessingError;
  canRetry: boolean;
  estimatedTimeRemaining?: number;
}

// Error codes for better error handling
export const VIDEO_PROCESSING_ERRORS = {
  INVALID_URL: "INVALID_URL",
  UNSUPPORTED_PLATFORM: "UNSUPPORTED_PLATFORM",
  DOWNLOAD_FAILED: "DOWNLOAD_FAILED",
  TRANSCRIPTION_FAILED: "TRANSCRIPTION_FAILED",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  RATE_LIMITED: "RATE_LIMITED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  NETWORK_ERROR: "NETWORK_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  COLLECTION_NOT_FOUND: "COLLECTION_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;

export type VideoProcessingErrorCode = (typeof VIDEO_PROCESSING_ERRORS)[keyof typeof VIDEO_PROCESSING_ERRORS];
