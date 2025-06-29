"use client";

import { useState } from "react";

import { Trash2, AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";

interface DeleteCollectionDialogProps {
  collection: Collection;
  onCollectionDeleted: () => void;
  children: React.ReactNode;
}

export function DeleteCollectionDialog({ collection, onCollectionDeleted, children }: DeleteCollectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { user, userProfile } = useAuth();

  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const confirmationMatch = confirmationText === collection.title;

  const handleDeleteCollection = async () => {
    if (!user || !collection.id || !confirmationMatch) return;

    setIsDeleting(true);
    setError(null);

    try {
      await CollectionsService.deleteCollection(user.uid, collection.id);

      // Reset form
      setConfirmationText("");
      setIsOpen(false);

      // Notify parent component
      onCollectionDeleted();
    } catch (error) {
      console.error("Error deleting collection:", error);
      setError(error instanceof Error ? error.message : "Failed to delete collection");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText("");
      setError(null);
    }
    setIsOpen(open);
  };

  // Only show delete option to admins
  if (!isAdmin) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Delete Collection
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete the collection{" "}
                <strong>&ldquo;{collection.title}&rdquo;</strong> and all {collection.videoCount} videos within it.
              </p>
              <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Warning:</p>
                    <p className="text-muted-foreground">
                      All videos in this collection will be permanently deleted from the system.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Type <strong>{collection.title}</strong> to confirm:
                </Label>
                <Input
                  id="confirmation"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={collection.title}
                  className="font-mono"
                  disabled={isDeleting}
                />
              </div>
              {error && (
                <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteCollection}
            disabled={!confirmationMatch || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Collection
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
