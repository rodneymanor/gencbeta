"use client";

import { useState } from "react";

import { CheckCircle, Loader2, MoveRight, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";

interface MoveCopyVideosDialogProps {
  collections: Collection[];
  selectedVideos: string[];
  currentCollectionId: string | null;
  onCompleted: () => void;
  children: React.ReactNode;
  // Optional props for single video mode
  singleVideoTitle?: string;
  defaultAction?: "move" | "copy";
  // External control props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/* eslint-disable complexity */
export function MoveCopyVideosDialog({
  collections,
  selectedVideos,
  currentCollectionId,
  onCompleted,
  children,
  singleVideoTitle,
  defaultAction = "move",
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: MoveCopyVideosDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [targetCollectionId, setTargetCollectionId] = useState<string>("");
  const [action, setAction] = useState<"move" | "copy">(defaultAction);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  const isSingleVideo = selectedVideos.length === 1 && singleVideoTitle;
  const videoCount = selectedVideos.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!targetCollectionId) {
      setError("Please select a target collection");
      return;
    }
    if (selectedVideos.length === 0) {
      setError("No videos selected");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const batchSize = 5;
      for (let i = 0; i < selectedVideos.length; i += batchSize) {
        const batch = selectedVideos.slice(i, i + batchSize);
        await Promise.all(
          batch.map((videoId) => {
            if (action === "move") {
              return CollectionsService.moveVideo(user.uid, videoId, targetCollectionId);
            }
            return CollectionsService.copyVideo(user.uid, videoId, targetCollectionId);
          }),
        );
      }

      if (isSingleVideo) {
        toast.success(action === "move" ? "Video moved successfully" : "Video copied successfully");
      } else {
        toast.success(action === "move" ? "Videos moved successfully" : "Videos copied successfully to collection");
      }
      setSuccess("Operation completed successfully");
      onCompleted();
      setOpen(false);
    } catch (err) {
      console.error("Error in move/copy videos:", err);
      const msg = err instanceof Error ? err.message : "Failed to process videos";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const availableCollections = collections.filter((c) => c.id && c.id !== currentCollectionId);

  const resetForm = () => {
    setTargetCollectionId("");
    setAction(defaultAction);
    setError(null);
    setSuccess(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {externalOpen === undefined && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isSingleVideo
              ? `${action === "move" ? "Move" : "Copy"} Video`
              : `${action === "move" ? "Move" : "Copy"} Videos`}
          </DialogTitle>
          <DialogDescription>
            {isSingleVideo
              ? `${action === "move" ? "Move" : "Copy"} "${singleVideoTitle}" to another collection.`
              : `Select the target collection and action for the ${videoCount} selected video${videoCount > 1 ? "s" : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type */}
          <div className="space-y-2">
            <Label>Action</Label>
            <RadioGroup
              value={action}
              onValueChange={(val) => setAction(val as "move" | "copy")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="move" id="move" />
                <Label htmlFor="move" className="flex items-center gap-1">
                  <MoveRight className="h-4 w-4" /> Move
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="copy" id="copy" />
                <Label htmlFor="copy" className="flex items-center gap-1">
                  <Copy className="h-4 w-4" /> Copy
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Collection select */}
          <div className="space-y-2">
            <Label>Target Collection *</Label>
            <Select value={targetCollectionId} onValueChange={setTargetCollectionId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {availableCollections.map((c) => (
                  <SelectItem key={c.id} value={c.id!}>
                    {c.title}
                  </SelectItem>
                ))}
                <SelectItem value="all-videos">All Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error / success */}
          {error && (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">
                {isSingleVideo ? "Processing video..." : "Processing videos..."}
              </span>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !targetCollectionId}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                </span>
              ) : action === "move" ? (
                <span className="flex items-center gap-2">
                  <MoveRight className="h-4 w-4" /> Move
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Copy className="h-4 w-4" /> Copy
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
