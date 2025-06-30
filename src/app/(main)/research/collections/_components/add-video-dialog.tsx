"use client";

import { useState, useCallback } from "react";
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { VideoProcessingStatus } from "./video-processing-status";
import { ProcessingForm } from "./processing-form";
import type { RateLimitResult } from "@/types/video-processing";

interface Collection {
  id: string;
  title: string;
}

interface AddVideoDialogProps {
  collections: Collection[];
  selectedCollectionId?: string;
  onVideoAdded?: () => void;
  children?: React.ReactNode;
}

interface ProcessingJob {
  jobId: string;
  videoUrl: string;
  collectionTitle: string;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
  fallbackUsed?: boolean;
  processingType?: "queue" | "direct";
}

const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("tiktok.com") || hostname.includes("instagram.com")) {
      return { isValid: true };
    }

    return {
      isValid: false,
      error: "Only TikTok and Instagram videos are supported",
    };
  } catch {
    return {
      isValid: false,
      error: "Please enter a valid URL",
    };
  }
};

const handleApiError = (response: Response, data: Record<string, unknown>): string => {
  if (response.status === 401) {
    return "Authentication failed. Please refresh the page and try again.";
  }

  if (response.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (response.status === 404) {
    return "Collection not found. Please refresh the page and try again.";
  }

  return (data.message as string) ?? "An error occurred while processing your video.";
};

const getRateLimitMessage = (rateLimitInfo: RateLimitResult): string => {
  const resetTime = new Date(rateLimitInfo.resetTime);
  const now = new Date();
  const diffInMinutes = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60));
  const minutesRemaining = Math.max(1, diffInMinutes);

  return `Rate limit exceeded. You can try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? "s" : ""}.`;
};

const createProcessingJob = (
  data: any,
  url: string,
  collections: Collection[],
  collectionId: string,
): ProcessingJob => {
  const collection = collections.find((c) => c.id === collectionId);

  return {
    jobId: data.jobId,
    videoUrl: url.trim(),
    collectionTitle: collection?.title ?? "Unknown Collection",
    status: data.processingType === "direct" ? "completed" : "pending",
    message: data.message,
    fallbackUsed: data.fallbackUsed,
    processingType: data.processingType ?? "queue",
  };
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "text-green-800";
    case "failed":
      return "text-red-800";
    default:
      return "text-blue-800";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "failed":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusMessage = (status: string, collectionTitle: string): string => {
  switch (status) {
    case "completed":
      return `Added to "${collectionTitle}"`;
    case "failed":
      return "Processing Failed";
    default:
      return `Adding to "${collectionTitle}"`;
  }
};

const getBackgroundColor = (status: string): string => {
  switch (status) {
    case "completed":
      return "bg-green-50 border-green-200";
    case "failed":
      return "bg-red-50 border-red-200";
    default:
      return "bg-blue-50 border-blue-200";
  }
};

export function AddVideoDialog({ collections, selectedCollectionId, onVideoAdded, children }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);
  const [currentJob, setCurrentJob] = useState<ProcessingJob | null>(null);
  const { user } = useAuth();

  const submitVideoProcessing = useCallback(async (): Promise<void> => {
    if (!user) return;

    const token = await user.getIdToken();
    const response = await fetch("/api/internal/video-processing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        videoUrl: url.trim(),
        collectionId,
        title: title.trim() || undefined,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Success - either queued or processed directly
      const job = createProcessingJob(data, url, collections, collectionId);
      setCurrentJob(job);

      // Clear form but keep dialog open to show status
      setUrl("");
      setTitle("");
      setError(null);

      // If it was processed directly, auto-close after showing success
      if (data.processingType === "direct") {
        setTimeout(() => {
          setIsOpen(false);
          setCurrentJob(null);
          onVideoAdded?.();
        }, 2000);
      }
    } else {
      // Handle different error types
      const errorMessage = handleApiError(response, data);
      setError(errorMessage);

      if (response.status === 429) {
        setRateLimitInfo({
          allowed: false,
          remaining: 0,
          resetTime: data.resetTime ?? new Date(Date.now() + 60000).toISOString(),
          retryAfter: data.retryAfter ?? 60,
        });
      }
    }
  }, [user, url, collectionId, title, collections, onVideoAdded]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || !collectionId || !user) return;

      // Clear previous errors
      setError(null);
      setRateLimitInfo(null);

      // Validate URL
      const urlValidation = validateUrl(url.trim());
      if (!urlValidation.isValid) {
        setError(urlValidation.error ?? "Invalid URL");
        return;
      }

      setIsLoading(true);

      try {
        await submitVideoProcessing();
      } catch (error) {
        console.error("Error submitting video:", error);
        setError("Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [url, collectionId, user, submitVideoProcessing],
  );

  const handleJobComplete = useCallback(() => {
    setCurrentJob((prev) => (prev ? { ...prev, status: "completed" } : null));

    // Wait a moment then close dialog and refresh
    setTimeout(() => {
      setIsOpen(false);
      setCurrentJob(null);
      onVideoAdded?.();
    }, 2000);
  }, [onVideoAdded]);

  const handleJobRetry = useCallback(() => {
    setCurrentJob((prev) => (prev ? { ...prev, status: "processing" } : null));
  }, []);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset all form state when closing
      setUrl("");
      setTitle("");
      setError(null);
      setRateLimitInfo(null);
      setCurrentJob(null);
    }
    setIsOpen(open);
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Video
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="border-border/60 shadow-lg sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">
            {currentJob ? "Video Processing" : "Add Video to Collection"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            {currentJob
              ? `Processing your video from ${currentJob.videoUrl.includes("tiktok") ? "TikTok" : "Instagram"}...`
              : "Paste a TikTok or Instagram video URL to add it to your collection. The video will be analyzed and processed automatically."}
          </DialogDescription>
        </DialogHeader>

        {currentJob ? (
          // Show processing/completion status
          <div className="space-y-4 pt-2">
            <div className={`rounded-lg border p-3 ${getBackgroundColor(currentJob.status)}`}>
              <div className={`mb-2 flex items-center gap-2 ${getStatusColor(currentJob.status)}`}>
                {getStatusIcon(currentJob.status)}
                <span className="text-sm font-medium">
                  {getStatusMessage(currentJob.status, currentJob.collectionTitle)}
                </span>
              </div>
              <div className={`text-xs ${getStatusColor(currentJob.status).replace("800", "700")}`}>
                URL: {currentJob.videoUrl}
              </div>
              {currentJob.message && (
                <div className={`mt-1 text-xs ${getStatusColor(currentJob.status).replace("800", "700")}`}>
                  {currentJob.message}
                  {currentJob.fallbackUsed && " (Using basic processing)"}
                </div>
              )}
            </div>

            {/* Only show processing status for queued jobs */}
            {currentJob.processingType === "queue" && currentJob.status !== "completed" && (
              <VideoProcessingStatus jobId={currentJob.jobId} onComplete={handleJobComplete} onRetry={handleJobRetry} />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="shadow-xs transition-all duration-200 hover:shadow-sm"
              >
                {currentJob.status === "completed" ? "Done" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          <ProcessingForm
            url={url}
            setUrl={setUrl}
            title={title}
            setTitle={setTitle}
            collectionId={collectionId}
            setCollectionId={setCollectionId}
            collections={collections}
            error={error}
            rateLimitInfo={rateLimitInfo}
            getRateLimitMessage={getRateLimitMessage}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onCancel={() => setIsOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
