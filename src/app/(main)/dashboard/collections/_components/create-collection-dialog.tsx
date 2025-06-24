"use client";

import { useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService } from "@/lib/collections";

interface CreateCollectionDialogProps {
  onCollectionCreated?: () => void;
}

export function CreateCollectionDialog({ onCollectionCreated }: CreateCollectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();

  const handleCreateCollection = async () => {
    if (!title.trim() || !user) return;

    setIsCreating(true);
    try {
      await CollectionsService.createCollection(title.trim(), user.uid, description.trim());

      // Reset form
      setTitle("");
      setDescription("");
      setIsOpen(false);

      // Notify parent component
      onCollectionCreated?.();
    } catch (error) {
      console.error("Error creating collection:", error);
      // TODO: Add toast notification for error
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateCollection();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold">Create New Collection</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a collection to organize your favorite videos and content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="collection-title" className="text-sm font-medium">
              Collection Title
            </Label>
            <Input
              id="collection-title"
              placeholder="Enter collection title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-description" className="text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="collection-description"
              placeholder="Describe your collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          <Button
            onClick={handleCreateCollection}
            disabled={!title.trim() || isCreating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {isCreating ? "Creating..." : "Create Collection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
