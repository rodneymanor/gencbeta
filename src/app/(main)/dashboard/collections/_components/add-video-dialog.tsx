"use client";

import { useState } from "react";

import { Plus, Link, AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Textarea } from "@/components/ui/textarea";
import { CollectionsService, type Collection } from "@/lib/collections";

interface AddVideoDialogProps {
  collections: Collection[];
  onVideoAdded?: () => void;
  children?: React.ReactNode;
}

export function AddVideoDialog({ collections, onVideoAdded, children }: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [urlError, setUrlError] = useState("");

  const validateUrl = (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setUrlError("");
      return;
    }

    const validation = CollectionsService.validateVideoUrl(inputUrl);
    if (!validation.isValid) {
      setUrlError("Please enter a valid TikTok or Instagram Reel URL");
    } else {
      setUrlError("");
    }
  };

  const handleUrlChange = (inputUrl: string) => {
    setUrl(inputUrl);
    validateUrl(inputUrl);
  };

  const handleAddVideo = async () => {
    if (!url.trim() || !title.trim() || !selectedCollectionId || urlError) return;

    const validation = CollectionsService.validateVideoUrl(url);
    if (!validation.isValid || !validation.platform) {
      setUrlError("Please enter a valid TikTok or Instagram Reel URL");
      return;
    }

    setIsAdding(true);
    try {
      await CollectionsService.addVideoToCollection(selectedCollectionId, {
        url: url.trim(),
        platform: validation.platform,
        title: title.trim(),
        description: description.trim(),
      });

      // Reset form
      setUrl("");
      setTitle("");
      setDescription("");
      setSelectedCollectionId("");
      setUrlError("");
      setIsOpen(false);

      // Notify parent component
      onVideoAdded?.();
    } catch (error) {
      console.error("Error adding video:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsAdding(false);
    }
  };

  const trigger = children ?? (
    <Button variant="outline" size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Add Video
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Add Video to Collection</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a TikTok or Instagram Reel to your collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="video-url" className="text-sm font-medium">
              Video URL
            </Label>
            <div className="relative">
              <Link className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="video-url"
                placeholder="https://www.tiktok.com/... or https://www.instagram.com/reel/..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className={`min-h-[44px] pl-10 ${urlError ? "border-destructive" : ""}`}
              />
            </div>
            {urlError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{urlError}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-title" className="text-sm font-medium">
              Video Title
            </Label>
            <Input
              id="video-title"
              placeholder="Enter video title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection-select" className="text-sm font-medium">
              Collection
            </Label>
            <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id!}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="video-description"
              placeholder="Add a description for this video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>

          <Button
            onClick={handleAddVideo}
            disabled={!url.trim() || !title.trim() || !selectedCollectionId || urlError !== "" || isAdding}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {isAdding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isAdding ? "Adding..." : "Add Video"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
