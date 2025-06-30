"use client";

import { useState } from "react";
import { Plus, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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
import { processAndAddVideo, validateUrl, detectPlatform } from "./simple-video-processing";

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

export function AddVideoDialog({ collections, selectedCollectionId, onVideoAdded, children }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const processVideo = async () => {
    console.log("🚀 [ADD_VIDEO] Starting video processing...");
    const result = await processAndAddVideo(url.trim(), collectionId, title.trim() || undefined);

    if (result.success) {
      console.log("✅ [ADD_VIDEO] Processing successful:", result);
      const platform = result.platform ?? detectPlatform(url);
      const collection = collections.find(c => c.id === collectionId);
      
      setSuccess(`${platform.toUpperCase()} video added to "${collection?.title}"! ${result.message ?? ''}`);
      
      // Clear form
      setUrl("");
      setTitle("");
      
      // Auto-close after 2 seconds and refresh collections
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        onVideoAdded?.();
      }, 2000);
      
    } else {
      console.error("❌ [ADD_VIDEO] Processing failed:", result);
      setError(result.error ?? "Failed to process video");
      
      if (result.details) {
        console.error("❌ [ADD_VIDEO] Error details:", result.details);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !collectionId) {
      setError("Please enter a video URL and select a collection");
      return;
    }

    if (!validateUrl(url.trim())) {
      setError("Please enter a valid TikTok or Instagram video URL");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await processVideo();
    } catch (error) {
      console.error("❌ [ADD_VIDEO] Unexpected error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setUrl("");
      setTitle("");
      setError(null);
      setSuccess(null);
      setCollectionId(selectedCollectionId ?? "");
    }
  };

  const getUrlPlaceholder = () => {
    return "https://www.tiktok.com/@user/video/... or https://www.instagram.com/reels/...";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Video to Collection</DialogTitle>
          <DialogDescription>
            Add a TikTok or Instagram video to your collection. The video will be automatically downloaded, 
            streamed to our CDN, and transcribed for analysis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="video-url">Video URL *</Label>
            <Input
              id="video-url"
              type="url"
              placeholder={getUrlPlaceholder()}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="video-title">Video Title (Optional)</Label>
            <Input
              id="video-title"
              type="text"
              placeholder="Leave blank to auto-generate from video content"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Collection Selection */}
          <div className="space-y-2">
            <Label htmlFor="collection">Collection *</Label>
            <Select value={collectionId} onValueChange={setCollectionId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
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

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}

          {/* Loading Display */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-800">
                Processing video... This may take a few moments for download, streaming, and transcription.
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !url.trim() || !collectionId}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
