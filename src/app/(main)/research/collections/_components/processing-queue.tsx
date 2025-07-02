"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, CheckCircle, XCircle, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { VideoProcessingStatus } from "./video-processing-status";
import type { VideoProcessingJob } from "@/types/video-processing";

interface ProcessingQueueProps {
  onVideoAdded?: () => void;
  className?: string;
}

const STATUS_COLORS = {
  queued: "bg-yellow-100 text-yellow-800 border-yellow-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  downloading: "bg-blue-100 text-blue-800 border-blue-200",
  transcribing: "bg-purple-100 text-purple-800 border-purple-200",
  analyzing: "bg-green-100 text-green-800 border-green-200",
  uploading: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  retrying: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

export function ProcessingQueue({ onVideoAdded, className = "" }: ProcessingQueueProps) {
  const [jobs, setJobs] = useState<VideoProcessingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchUserJobs = useCallback(async () => {
    if (!user) return;

    try {
      // For now, we'll use a placeholder since we don't have a get user jobs endpoint yet
      // In production, you'd call: /api/internal/video-processing/jobs

      // Placeholder data for demonstration
      const placeholderJobs: VideoProcessingJob[] = [
        {
          id: "job_1234567890_abc123",
          userId: user.uid,
          collectionId: "collection_1",
          videoUrl: "https://www.tiktok.com/@example/video/123",
          title: "Sample TikTok Video",
          status: "processing",
          priority: "normal",
          attempts: 1,
          maxAttempts: 3,
          createdAt: new Date(Date.now() - 30000).toISOString(),
          updatedAt: new Date().toISOString(),
          startedAt: new Date(Date.now() - 20000).toISOString(),
          progress: {
            stage: "downloading",
            percentage: 45,
            message: "Downloading video content...",
            estimatedTimeRemaining: 15000,
          },
        },
      ];

      setJobs(placeholderJobs);
    } catch (error) {
      console.error("Error fetching user jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggleJobDetails = (jobId: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const getJobUrl = (job: VideoProcessingJob) => {
    const url = new URL(job.videoUrl);
    const platform = url.hostname.includes("tiktok") ? "TikTok" : "Instagram";
    const shortUrl = `${platform}: ${url.pathname.split("/").pop()?.substring(0, 12) ?? "unknown"}...`;
    return { platform, shortUrl };
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleJobComplete = useCallback(() => {
    onVideoAdded?.();
    fetchUserJobs(); // Refresh the jobs list
  }, [onVideoAdded, fetchUserJobs]);

  useEffect(() => {
    fetchUserJobs();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchUserJobs, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUserJobs]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-secondary/20 animate-pulse rounded-lg p-4">
                <div className="bg-secondary/40 mb-2 h-4 rounded"></div>
                <div className="bg-secondary/40 h-2 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Processing Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No videos in processing queue</p>
            <p className="text-sm">Videos you add will appear here while being processed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeJobs = jobs.filter((job) =>
    ["queued", "processing", "downloading", "transcribing", "analyzing", "uploading", "retrying"].includes(job.status),
  );

  const completedJobs = jobs.filter((job) => ["completed", "failed", "cancelled"].includes(job.status));

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Processing Queue</CardTitle>
        <Badge variant="outline" className="text-xs">
          {activeJobs.length} active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Active Jobs */}
        {activeJobs.map((job) => {
          const { platform, shortUrl } = getJobUrl(job);
          const isExpanded = expandedJobs.has(job.id);

          return (
            <div key={job.id} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                  <Badge className={STATUS_COLORS[job.status]}>{job.status}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{job.title ?? shortUrl}</div>
                    <div className="text-muted-foreground text-xs">
                      {platform} • {getTimeAgo(job.createdAt)}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleJobDetails(job.id)} className="h-7 w-7 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>

              {/* Quick Progress */}
              <div className="space-y-1">
                <Progress value={job.progress.percentage} className="h-1" />
                <div className="text-muted-foreground text-xs">
                  {job.progress.message} ({job.progress.percentage}%)
                </div>
              </div>

              {/* Detailed Status */}
              {isExpanded && (
                <div className="border-t pt-2">
                  <VideoProcessingStatus jobId={job.id} onComplete={handleJobComplete} className="bg-secondary/20" />
                </div>
              )}
            </div>
          );
        })}

        {/* Completed Jobs (last 3) */}
        {completedJobs.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-muted-foreground mb-3 text-sm font-medium">Recent Completed</h4>
            <div className="space-y-2">
              {completedJobs.slice(0, 3).map((job) => {
                const { platform, shortUrl } = getJobUrl(job);

                return (
                  <div key={job.id} className="bg-secondary/10 flex items-center justify-between rounded p-2">
                    <div className="flex flex-1 items-center gap-3">
                      {job.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{job.title ?? shortUrl}</div>
                        <div className="text-muted-foreground text-xs">
                          {platform} • {getTimeAgo(job.completedAt ?? job.updatedAt)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={job.status === "completed" ? "text-green-600" : "text-red-600"}>
                      {job.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="border-t pt-3">
          <Button variant="outline" size="sm" onClick={fetchUserJobs} className="w-full">
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh Queue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
