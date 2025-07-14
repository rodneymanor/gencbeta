"use client";

import { useState, useEffect, useCallback } from "react";

import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  Search,
  Upload,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import type {
  VideoProcessingStatus as VideoProcessingStatusType,
  ProcessingStatusResponse,
} from "@/types/video-processing";

interface VideoProcessingStatusProps {
  jobId: string;
  onComplete?: (result: ProcessingStatusResponse["result"]) => void;
  onRetry?: () => void;
  className?: string;
}

const STATUS_ICONS = {
  queued: Clock,
  processing: RefreshCw,
  downloading: Download,
  transcribing: FileText,
  analyzing: Search,
  uploading: Upload,
  completed: CheckCircle,
  failed: XCircle,
  retrying: RefreshCw,
  cancelled: XCircle,
} as const;

const STATUS_COLORS = {
  queued: "bg-yellow-500",
  processing: "bg-blue-500",
  downloading: "bg-blue-500",
  transcribing: "bg-purple-500",
  analyzing: "bg-green-500",
  uploading: "bg-[#2d93ad]",
  completed: "bg-green-500",
  failed: "bg-red-500",
  retrying: "bg-yellow-500",
  cancelled: "bg-gray-500",
} as const;

const STATUS_LABELS = {
  queued: "Queued",
  processing: "Processing",
  downloading: "Downloading",
  transcribing: "Transcribing",
  analyzing: "Analyzing",
  uploading: "Saving",
  completed: "Completed",
  failed: "Failed",
  retrying: "Retrying",
  cancelled: "Cancelled",
} as const;

// Helper functions to reduce complexity
const shouldStartPolling = (status: VideoProcessingStatusType): boolean => {
  return ["queued", "processing", "downloading", "transcribing", "analyzing", "uploading", "retrying"].includes(status);
};

const isActiveJob = (status: VideoProcessingStatusType): boolean => {
  return ["queued", "processing", "downloading", "transcribing", "analyzing", "uploading", "retrying"].includes(status);
};

export function VideoProcessingStatus({ jobId, onComplete, onRetry, className = "" }: VideoProcessingStatusProps) {
  const [job, setJob] = useState<ProcessingStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const { user } = useAuth();

  const fetchJobStatus = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/internal/video-processing?jobId=${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJob(data);

        // Trigger completion callback
        if (data.status === "completed" && onComplete) {
          onComplete(data.result);
        }
      } else {
        console.error("Failed to fetch job status");
      }
    } catch (error) {
      console.error("Error fetching job status:", error);
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user, onComplete]);

  const handleRetry = async () => {
    if (!user || !job) return;

    setIsRetrying(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/internal/video-processing", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          action: "retry",
        }),
      });

      if (response.ok) {
        // Refresh status
        fetchJobStatus();
        onRetry?.();
      } else {
        console.error("Failed to retry job");
      }
    } catch (error) {
      console.error("Error retrying job:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchJobStatus();

    let pollInterval: NodeJS.Timeout | null = null;

    // Start polling for active jobs
    if (job && shouldStartPolling(job.status)) {
      pollInterval = setInterval(fetchJobStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchJobStatus, job]);

  if (isLoading) {
    return (
      <div className={`bg-secondary/20 animate-pulse rounded-lg p-4 ${className}`}>
        <div className="bg-secondary/40 mb-2 h-4 rounded"></div>
        <div className="bg-secondary/40 h-2 rounded"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Unable to load processing status. Please refresh the page.</AlertDescription>
      </Alert>
    );
  }

  return <StatusDisplay job={job} isRetrying={isRetrying} onRetry={handleRetry} className={className} />;
}

// Separate component to reduce complexity
interface StatusDisplayProps {
  job: ProcessingStatusResponse;
  isRetrying: boolean;
  onRetry: () => void;
  className: string;
}

function StatusDisplay({ job, isRetrying, onRetry, className }: StatusDisplayProps) {
  const StatusIcon = STATUS_ICONS[job.status];
  const isActive = isActiveJob(job.status);

  if (job.status === "completed" && job.result) {
    return (
      <div className={`bg-card space-y-3 rounded-lg border p-4 ${className}`}>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="mb-2 flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Video processed successfully!</span>
          </div>
          <div className="space-y-1 text-xs text-green-700">
            <div>
              <strong>Title:</strong> {job.result.title}
            </div>
            <div>
              <strong>Platform:</strong> {job.result.platform}
            </div>
            <div>
              <strong>Duration:</strong> {job.result.duration}s
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (job.status === "failed" && job.error) {
    return (
      <div className={`bg-card space-y-3 rounded-lg border p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-red-500 p-1">
              <XCircle className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium">Failed</span>
          </div>

          {job.canRetry && (
            <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying} className="h-7 px-2 text-xs">
              {isRetrying ? <RefreshCw className="h-3 w-3 animate-spin" /> : "Retry"}
            </Button>
          )}
        </div>

        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">{job.error.userMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`bg-card space-y-3 rounded-lg border p-4 ${className}`}>
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`rounded-full p-1 ${STATUS_COLORS[job.status]}`}>
            <StatusIcon className={`h-3 w-3 text-white ${isActive ? "animate-spin" : ""}`} />
          </div>
          <span className="text-sm font-medium">{STATUS_LABELS[job.status]}</span>
          <Badge variant="outline" className="text-xs">
            {job.jobId.split("_")[1]}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="space-y-1">
          <Progress value={job.progress.percentage} className="h-2" />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>{job.progress.message}</span>
            <span>{job.progress.percentage}%</span>
          </div>
          {job.estimatedTimeRemaining && (
            <div className="text-muted-foreground text-xs">
              Estimated time remaining: {Math.ceil(job.estimatedTimeRemaining / 1000)}s
            </div>
          )}
        </div>
      )}

      {/* Cancelled State */}
      {job.status === "cancelled" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Processing was cancelled</span>
          </div>
        </div>
      )}
    </div>
  );
}
