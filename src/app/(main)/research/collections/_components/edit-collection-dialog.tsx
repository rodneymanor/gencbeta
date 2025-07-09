"use client";

import { useState } from "react";

import { Edit3, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { COLLECTION_LIMITS, CollectionsService, type Collection } from "@/lib/collections";

interface EditCollectionDialogProps {
  collection: Collection;
  onCollectionUpdated: () => void;
  children: React.ReactNode;
}

export function EditCollectionDialog({ collection, onCollectionUpdated, children }: EditCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(collection.title);
  const [description, setDescription] = useState(collection.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";

  const resetState = () => {
    setTitle(collection.title);
    setDescription(collection.description ?? "");
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    setOpen(isOpen);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !collection.id) return;

    // Basic validation
    if (title.trim().length === 0) {
      setError("Title is required");
      return;
    }
    if (title.trim().length > COLLECTION_LIMITS.MAX_TITLE_LENGTH) {
      setError(`Title must be ${COLLECTION_LIMITS.MAX_TITLE_LENGTH} characters or less`);
      return;
    }
    if (description.trim().length > COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await CollectionsService.updateCollection(user.uid, collection.id, {
        title: title.trim(),
        description: description.trim(),
      });

      toast.success("Collection updated successfully");
      setOpen(false);
      onCollectionUpdated();
    } catch (err) {
      console.error("Error updating collection:", err);
      setError(err instanceof Error ? err.message : "Failed to update collection");
      toast.error(err instanceof Error ? err.message : "Failed to update collection");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" /> Edit Collection
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update the collection details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
              maxLength={COLLECTION_LIMITS.MAX_TITLE_LENGTH}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              maxLength={COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH}
              rows={4}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-md border p-3 text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
