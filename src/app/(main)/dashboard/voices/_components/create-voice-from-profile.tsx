"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  Play,
  Pause,
  Square,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Video,
  FileText,
  Sparkles,
  Users,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ProcessingStatus {
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
  metadata?: {
    platform: string;
    username: string;
    voiceName: string;
    videoCount: number;
  };
}

interface CreateVoiceFromProfileProps {
  onVoiceCreated?: (voiceId: string) => void;
  onCollectionCreated?: (collectionId: string) => void;
}

export function CreateVoiceFromProfile({ onVoiceCreated, onCollectionCreated }: CreateVoiceFromProfileProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [voiceName, setVoiceName] = useState("");
  const [videoCount, setVideoCount] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const extractUsername = (url: string): string => {
    const cleaned = url.replace("@", "").trim();

    if (!cleaned.includes("/") && !cleaned.includes(".")) {
      return cleaned;
    }

    if (platform === "tiktok") {
      const match = cleaned.match(/(?:tiktok\.com\/@|@)([a-zA-Z0-9._-]+)/);
      return match ? match[1] : cleaned;
    } else {
      const match = cleaned.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._-]+)/);
      return match ? match[1] : cleaned;
    }
  };

  const validateInputs = (): boolean => {
    if (!profileUrl.trim()) {
      setError("Profile URL or username is required");
      return false;
    }

    if (videoCount < 10 || videoCount > 200) {
      setError("Video count must be between 10 and 200");
      return false;
    }

    const username = extractUsername(profileUrl);
    if (!username) {
      setError("Could not extract username from profile URL");
      return false;
    }

    setError(null);
    return true;
  };

  const startProcessing = async () => {
    if (!validateInputs()) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStatus(null);

    try {
      const username = extractUsername(profileUrl);
      const finalVoiceName = voiceName.trim() || `${username} Voice`;

      const response = await fetch("/api/voices/process-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileUrl,
          platform,
          voiceName: finalVoiceName,
          videoCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start processing");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to start processing");
      }

      setCurrentJobId(data.jobId);

      // Notify about collection creation
      if (onCollectionCreated && data.collectionId) {
        onCollectionCreated(data.collectionId);
      }

      // Start polling for status updates
      startStatusPolling(data.jobId);

      toast.success(
        `Processing Started: ${username}'s ${platform} profile. This may take ${Math.ceil(data.estimatedProcessingTime / 60)} minutes.`,
      );
    } catch (error) {
      console.error("Failed to start processing:", error);
      setError(error instanceof Error ? error.message : "Failed to start processing");
      setIsProcessing(false);
    }
  };

  const startStatusPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/voices/processing-status/${jobId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setProcessingStatus(data);

          // Check if processing is complete
          if (data.status === "completed") {
            clearInterval(interval);
            setIsProcessing(false);

            if (onVoiceCreated && data.voiceId) {
              onVoiceCreated(data.voiceId);
            }

            toast.success(
              `Voice Created Successfully! Your AI voice "${data.metadata?.voiceName}" has been created and is ready to use.`,
            );
          } else if (data.status === "failed") {
            clearInterval(interval);
            setIsProcessing(false);
            setError(data.error || "Processing failed");

            toast.error(data.error || "An error occurred during processing");
          }
        }
      } catch (error) {
        console.error("Failed to fetch status:", error);
      }
    }, 5000); // Poll every 5 seconds

    setPollingInterval(interval);
  };

  const cancelProcessing = async () => {
    if (!currentJobId) return;

    try {
      const response = await fetch(`/api/voices/processing-status/${currentJobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        setIsProcessing(false);
        setProcessingStatus(null);
        setCurrentJobId(null);

        toast.success("Processing Cancelled: Voice creation has been cancelled.");
      }
    } catch (error) {
      console.error("Failed to cancel processing:", error);
    }
  };

  const formatTimeRemaining = (estimatedCompletionAt?: string): string => {
    if (!estimatedCompletionAt) return "Calculating...";

    const remaining = new Date(estimatedCompletionAt).getTime() - Date.now();
    if (remaining <= 0) return "Almost done...";

    const minutes = Math.ceil(remaining / 60000);
    return `~${minutes} minute${minutes !== 1 ? "s" : ""} remaining`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "discovering_videos":
        return <Video className="h-4 w-4" />;
      case "processing_videos":
        return <Play className="h-4 w-4" />;
      case "waiting_transcriptions":
        return <FileText className="h-4 w-4" />;
      case "generating_templates":
        return <Sparkles className="h-4 w-4" />;
      case "creating_voice":
        return <Users className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isProcessing && processingStatus) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(processingStatus.status)}
            Creating AI Voice
          </CardTitle>
          <CardDescription>
            Processing @{processingStatus.metadata?.username}'s {processingStatus.metadata?.platform} profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Step {processingStatus.currentStep} of {processingStatus.totalSteps}: {processingStatus.stepName}
              </span>
              <span className="text-muted-foreground text-sm">{processingStatus.progress}%</span>
            </div>
            <Progress value={processingStatus.progress} className="h-2" />
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Started {new Date(processingStatus.startedAt).toLocaleTimeString()}</span>
              <span>{formatTimeRemaining(processingStatus.estimatedCompletionAt)}</span>
            </div>
          </div>

          <Separator />

          {/* Detailed Progress */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Videos Discovered</span>
              </div>
              <div className="text-2xl font-bold">{processingStatus.videosDiscovered || 0}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">Videos Processed</span>
              </div>
              <div className="text-2xl font-bold">{processingStatus.videosProcessed || 0}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Transcriptions</span>
              </div>
              <div className="text-2xl font-bold">
                {processingStatus.transcriptionsCompleted || 0}
                {processingStatus.totalVideos ? ` / ${processingStatus.totalVideos}` : ""}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Templates Generated</span>
              </div>
              <div className="text-2xl font-bold">{processingStatus.templatesGenerated || 0}</div>
            </div>
          </div>

          {/* Collection Link */}
          {processingStatus.collectionId && (
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Collection "{processingStatus.collectionName}" has been created</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/research/collections/${processingStatus.collectionId}`)}
                >
                  View Collection <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={cancelProcessing}
              disabled={processingStatus.status === "completed" || processingStatus.status === "failed"}
            >
              <Square className="mr-2 h-4 w-4" />
              Cancel Processing
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create AI Voice from Profile</CardTitle>
        <CardDescription>
          Analyze a social media profile to create a custom AI voice that matches their content style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(value: "tiktok" | "instagram") => setPlatform(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profileUrl">Profile URL or Username</Label>
            <Input
              id="profileUrl"
              placeholder={
                platform === "tiktok" ? "@username or tiktok.com/@username" : "@username or instagram.com/username"
              }
              value={profileUrl}
              onChange={(e) => setProfileUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voiceName">Voice Name (Optional)</Label>
            <Input
              id="voiceName"
              placeholder="Enter a custom name for this voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoCount">Number of Videos to Analyze</Label>
            <Select value={videoCount.toString()} onValueChange={(value) => setVideoCount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 videos (~2-3 minutes)</SelectItem>
                <SelectItem value="20">20 videos (~5-7 minutes)</SelectItem>
                <SelectItem value="30">30 videos (~8-10 minutes)</SelectItem>
                <SelectItem value="50">50 videos (~12-15 minutes)</SelectItem>
                <SelectItem value="100">100 videos (~25-30 minutes)</SelectItem>
                <SelectItem value="200">200 videos (~50-60 minutes)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-muted/50 space-y-2 rounded-lg p-4">
          <h4 className="font-medium">What happens next:</h4>
          <ul className="text-muted-foreground space-y-1 text-sm">
            <li>• Videos are discovered and analyzed from the profile</li>
            <li>• A collection is created with all the videos for your review</li>
            <li>• Videos are transcribed and analyzed for content patterns</li>
            <li>• AI templates are generated based on the creator's style</li>
            <li>• Your custom voice is created and ready to use</li>
          </ul>
        </div>

        <Button onClick={startProcessing} disabled={isProcessing || !profileUrl.trim()} className="w-full">
          {isProcessing ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Processing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Processing
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
