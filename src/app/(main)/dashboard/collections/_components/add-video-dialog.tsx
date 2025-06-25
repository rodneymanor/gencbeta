"use client";

import { useState } from "react";

import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService } from "@/lib/collections";

interface AddVideoDialogProps {
  collections: Array<{ id: string; title: string }>;
  selectedCollectionId?: string;
  onVideoAdded: () => void;
}

interface VideoDownloadResponse {
  success: boolean;
  platform: string;
  videoData: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  metrics: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
  metadata: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    readyForTranscription: boolean;
  };
}

interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  platform: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext: string;
  transcriptionMetadata: {
    method: string;
    fileSize: number;
    fileName: string;
    processedAt: string;
  };
}

export function AddVideoDialog({ collections, selectedCollectionId, onVideoAdded }: AddVideoDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const { user } = useAuth();

  const validateUrl = (url: string): boolean => {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) return false;

    const supportedPlatforms = ["tiktok.com", "instagram.com"];
    return supportedPlatforms.some((platform) => url.toLowerCase().includes(platform));
  };

  const downloadVideo = async (videoUrl: string): Promise<VideoDownloadResponse> => {
    const response = await fetch("/api/download-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to download video");
    }

    const data = await response.json();
    console.log("📥 [ADD_VIDEO] Download response received:", data);
    console.log("🔍 [DEBUG] Download metrics:", data.metrics);
    console.log("🔍 [DEBUG] Full response structure:", JSON.stringify(data, null, 2));
    return data;
  };

  const transcribeVideo = async (videoData: VideoDownloadResponse["videoData"]): Promise<TranscriptionResponse> => {
    // Convert the buffer array back to a File object
    const uint8Array = new Uint8Array(videoData.buffer);
    const blob = new Blob([uint8Array], { type: videoData.mimeType });
    const file = new File([blob], videoData.filename, { type: videoData.mimeType });

    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch("/api/transcribe-video", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to transcribe video");
    }

    return response.json();
  };

  const extractVideoThumbnail = async (videoData: VideoDownloadResponse["videoData"]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(videoData.buffer);
      const blob = new Blob([uint8Array], { type: videoData.mimeType });
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
          URL.revokeObjectURL(video.src);
          resolve(thumbnailUrl);
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video"));
      };

      video.src = URL.createObjectURL(blob);
    });
  };

  const createVideoObject = (
    downloadResponse: VideoDownloadResponse,
    transcriptionResponse: TranscriptionResponse,
    thumbnailUrl: string,
  ) => {
    const engagementRate =
      downloadResponse.metrics.views > 0
        ? ((downloadResponse.metrics.likes + downloadResponse.metrics.comments + downloadResponse.metrics.shares) /
            downloadResponse.metrics.views) *
          100
        : 0;

    return {
      url: url,
      platform: downloadResponse.platform,
      thumbnailUrl: thumbnailUrl,
      title: transcriptionResponse.contentMetadata.description || "Untitled Video",
      author: transcriptionResponse.contentMetadata.author || "Unknown",
      transcript: transcriptionResponse.transcript,
      components: transcriptionResponse.components,
      contentMetadata: transcriptionResponse.contentMetadata,
      visualContext: transcriptionResponse.visualContext,
      insights: {
        likes: downloadResponse.metrics.likes,
        comments: downloadResponse.metrics.comments,
        shares: downloadResponse.metrics.shares,
        views: downloadResponse.metrics.views,
        saves: downloadResponse.metrics.saves,
        engagementRate,
      },
      addedAt: new Date().toISOString(),
      fileSize: downloadResponse.videoData.size,
      duration: 0, // Would be extracted from video metadata
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    if (!validateUrl(url)) {
      toast.error("Please enter a valid TikTok or Instagram video URL");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add videos");
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Download video
      setProcessingStep("Downloading video...");
      const downloadResponse = await downloadVideo(url);

      // Step 2: Transcribe video
      setProcessingStep("Analyzing video content...");
      const transcriptionResponse = await transcribeVideo(downloadResponse.videoData);

      // Step 3: Generate thumbnail
      setProcessingStep("Generating thumbnail...");
      const thumbnailUrl = await extractVideoThumbnail(downloadResponse.videoData);

      // Step 4: Save to collection
      setProcessingStep("Saving to collection...");

      // Determine which collection to use
      const targetCollectionId = collectionId && collectionId.trim() !== "" ? collectionId : "all-videos";

      // Create video object with all the processed data
      const videoToAdd = createVideoObject(downloadResponse, transcriptionResponse, thumbnailUrl);

      await CollectionsService.addVideoToCollection(user.uid, targetCollectionId, videoToAdd);

      toast.success("Video added successfully!");
      setOpen(false);
      setUrl("");
      setCollectionId("");
      onVideoAdded();
    } catch (error) {
      console.error("Error processing video:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process video");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Video to Collection</DialogTitle>
          <DialogDescription>
            Enter a TikTok or Instagram video URL to automatically process and add it to your collection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Video URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://www.tiktok.com/@user/video/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
              required
            />
          </div>

          {collections.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="collection">Collection (Optional)</Label>
              <Select value={collectionId} onValueChange={setCollectionId} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection or leave empty for All Videos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-videos">All Videos</SelectItem>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isProcessing && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {processingStep}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !url.trim()}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Add Video"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
