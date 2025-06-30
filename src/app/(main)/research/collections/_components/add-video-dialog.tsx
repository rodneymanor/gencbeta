"use client";

import { useState, useCallback } from "react";
import { Plus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function AddVideoDialog({
  collections,
  selectedCollectionId,
  onVideoAdded,
  children,
}: AddVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [collectionId, setCollectionId] = useState(selectedCollectionId ?? "");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim() || !collectionId) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/add-video-to-collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url.trim(),
            collectionId,
          }),
        });

        if (response.ok) {
          setUrl("");
          setIsOpen(false);
          onVideoAdded?.();
        } else {
          console.error("Failed to add video");
        }
      } catch (error) {
        console.error("Error adding video:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [url, collectionId, onVideoAdded],
  );

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Video
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md shadow-lg border-border/60">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Add Video to Collection</DialogTitle>
          <DialogDescription className="text-muted-foreground leading-relaxed">
            Paste a TikTok or Instagram video URL to add it to your collection. The video will be analyzed and processed automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="video-url" className="text-sm font-medium">
              Video URL
            </Label>
            <Input
              id="video-url"
              type="url"
              placeholder="https://www.tiktok.com/@username/video/123..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="shadow-xs focus:shadow-sm transition-all duration-200 border-border/60 focus:border-border bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-select" className="text-sm font-medium">
              Collection
            </Label>
            <Select value={collectionId} onValueChange={setCollectionId} required>
              <SelectTrigger 
                id="collection-select"
                className="shadow-xs focus:shadow-sm transition-all duration-200 border-border/60 focus:border-border bg-background"
              >
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent className="shadow-lg border-border/60">
                {collections.map((collection) => (
                  <SelectItem 
                    key={collection.id} 
                    value={collection.id}
                    className="cursor-pointer hover:bg-secondary/60 focus:bg-secondary/60"
                  >
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!url.trim() || !collectionId || isLoading}
              className="shadow-xs hover:shadow-sm transition-all duration-200 min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Adding...
                </div>
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
