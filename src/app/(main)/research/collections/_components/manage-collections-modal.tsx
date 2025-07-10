import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteCollectionDialog } from "./delete-collection-dialog";
import { type Collection } from "@/lib/collections";

interface ManageCollectionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onCollectionDeleted: () => void;
}

export function ManageCollectionsModal({ open, onOpenChange, collections, onCollectionDeleted }: ManageCollectionsModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription>
            Delete collections you own. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {collections.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">You do not own any collections.</div>
          ) : (
            collections.map((collection) => (
              <div key={collection.id} className="flex items-center justify-between rounded-md border p-3 shadow-sm">
                <div>
                  <div className="font-medium text-base">{collection.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{collection.description}</div>
                </div>
                <DeleteCollectionDialog
                  collection={collection}
                  onCollectionDeleted={() => {
                    setDeletingId(null);
                    onCollectionDeleted();
                  }}
                >
                  <Button
                    variant="destructive"
                    size="icon"
                    className="ml-2"
                    onClick={() => setDeletingId(collection.id!)}
                    disabled={deletingId === collection.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeleteCollectionDialog>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 