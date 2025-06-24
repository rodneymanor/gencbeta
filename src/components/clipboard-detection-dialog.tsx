"use client";

import { useState } from "react";

import { Video, FileText, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import type { ClipboardDetectionResult } from "@/lib/clipboard-detector";
import { CollectionsService, type Collection } from "@/lib/collections";

interface ClipboardDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  detectedUrl: ClipboardDetectionResult | null;
  collections: Collection[];
  onRefreshCollections: () => void;
}

export function ClipboardDetectionDialog({
  isOpen,
  onClose,
  detectedUrl,
  collections,
  onRefreshCollections,
}: ClipboardDetectionDialogProps) {
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isAddingToCollection, setIsAddingToCollection] = useState(false);
  const [isAddingToNote, setIsAddingToNote] = useState(false);
  const { user } = useAuth();

  if (!detectedUrl) return null;

  const handleAddToCollection = async () => {
    if (!user || !selectedCollection || !detectedUrl) return;

    setIsAddingToCollection(true);
    try {
      // Generate a title based on the platform and URL
      const title = `${getPlatformName()} Video - ${detectedUrl.formattedUrl}`;
      
      await CollectionsService.addVideoToCollection(selectedCollection, {
        url: detectedUrl.url,
        platform: detectedUrl.platform as "tiktok" | "instagram",
        title,
        description: `Added from clipboard on ${new Date().toLocaleDateString()}`,
      });
      
      onRefreshCollections();
      onClose();
    } catch (error) {
      console.error("Error adding video to collection:", error);
      // TODO: Show error toast
    } finally {
      setIsAddingToCollection(false);
    }
  };

  const handleAddToNote = async () => {
    if (!user || !detectedUrl) return;

    setIsAddingToNote(true);
    try {
      // TODO: Implement note creation logic
      // For now, we'll just log it and close the dialog
      console.log("Adding to note:", detectedUrl.url);
      onClose();
    } catch (error) {
      console.error("Error adding to note:", error);
      // TODO: Show error toast
    } finally {
      setIsAddingToNote(false);
    }
  };

  const getPlatformIcon = () => {
    return <Video className="h-6 w-6" />;
  };

  const getPlatformName = () => {
    return detectedUrl.platform.charAt(0).toUpperCase() + detectedUrl.platform.slice(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlatformIcon()}
              <div>
                <DialogTitle>Video Link Detected!</DialogTitle>
                <DialogDescription>
                  Found a {getPlatformName()} video in your clipboard
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* URL Preview */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-mono break-all text-muted-foreground">
              {detectedUrl.formattedUrl}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Add to Collection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="text-sm font-medium">Add to Collection</span>
              </div>
              
              {collections.length > 0 ? (
                <div className="flex gap-2">
                  <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose collection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collections.map((collection) => 
                        collection.id ? (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.title}
                          </SelectItem>
                        ) : null
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddToCollection}
                    disabled={!selectedCollection || isAddingToCollection}
                    size="sm"
                  >
                    {isAddingToCollection ? "Adding..." : "Add"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No collections found. Create a collection first.
                </p>
              )}
            </div>

            {/* Add to Note */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">Add to Note</span>
              </div>
              <Button
                onClick={handleAddToNote}
                disabled={isAddingToNote}
                variant="outline"
                className="w-full"
                size="sm"
              >
                {isAddingToNote ? "Adding..." : "Create Note with Link"}
              </Button>
            </div>
          </div>

          {/* Dismiss Button */}
          <div className="pt-2">
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 