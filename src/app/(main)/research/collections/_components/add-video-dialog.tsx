"use client";

import { useState } from "react";

import { Plus } from "lucide-react";
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
import { useAppState } from "@/contexts/app-state-context";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService } from "@/lib/collections";

import {
  downloadVideo,
  transcribeVideo,
  extractVideoThumbnail,
  createVideoObject,
  validateUrl,
} from "./video-processing";

interface AddVideoDialogProps {
  collections: Array<{ id: string; title: string }>;
  selectedCollectionId?: string;
  onVideoAdded: () => void;
}

export function AddVideoDialog({ collections, selectedCollectionId, onVideoAdded }: AddVideoDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const { user } = useAuth();
  const { setVideoProcessing } = useAppState();

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
    setVideoProcessing(true);

    try {
      // Step 1: Download video
      setProcessingStep("Downloading video...");
      console.log("🚀 [ADD_VIDEO] Starting download for:", url);
      const downloadResponse = await downloadVideo(url);
      console.log("✅ [ADD_VIDEO] Download completed:", downloadResponse);

      // Step 2: Transcribe video
      setProcessingStep("Analyzing video content...");
      console.log("🎬 [ADD_VIDEO] Starting transcription...");
      const transcriptionResponse = await transcribeVideo(downloadResponse);
      console.log("✅ [ADD_VIDEO] Transcription completed:", transcriptionResponse);

      // Step 3: Generate thumbnail
      setProcessingStep("Generating thumbnail...");
      console.log("🖼️ [ADD_VIDEO] Generating thumbnail...");
      const thumbnailUrl = await extractVideoThumbnail(downloadResponse);
      console.log("✅ [ADD_VIDEO] Thumbnail generated:", thumbnailUrl.substring(0, 50) + "...");

      // Step 4: Save to collection
      setProcessingStep("Saving to collection...");
      console.log("💾 [ADD_VIDEO] Saving to collection...");

      // Determine which collection to use
      const targetCollectionId = collectionId && collectionId.trim() !== "" ? collectionId : "all-videos";
      console.log("🎯 [ADD_VIDEO] Target collection:", targetCollectionId);

      // Create video object with all the processed data
      const videoToAdd = createVideoObject(downloadResponse, transcriptionResponse, thumbnailUrl, url);
      console.log("📦 [ADD_VIDEO] Video object created:", Object.keys(videoToAdd));
      console.log("🔍 [ADD_VIDEO] User ID:", user.uid);
      console.log("🔍 [ADD_VIDEO] Target collection ID:", targetCollectionId);

      await CollectionsService.addVideoToCollection(user.uid, targetCollectionId, videoToAdd);
      console.log("✅ [ADD_VIDEO] Video added to collection successfully");

      toast.success("Video added successfully!");
      setOpen(false);
      setUrl("");
      setCollectionId("");
      onVideoAdded();
    } catch (error) {
      console.error("❌ [ADD_VIDEO] Error processing video:", error);
      console.error("❌ [ADD_VIDEO] Error stack:", error instanceof Error ? error.stack : "No stack trace");
      toast.error(error instanceof Error ? error.message : "Failed to process video");
    } finally {
      setIsProcessing(false);
      setVideoProcessing(false);
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
              placeholder="https://www.tiktok.com/@user/video/123..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection">Collection (Optional)</Label>
            <Select value={collectionId} onValueChange={setCollectionId} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collection or leave empty for All Videos" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isProcessing && (
            <div className="space-y-2 text-center">
              <div className="border-primary mx-auto h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
              <p className="text-muted-foreground text-sm">{processingStep}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing || !url.trim()}>
              {isProcessing ? "Processing..." : "Add Video"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
