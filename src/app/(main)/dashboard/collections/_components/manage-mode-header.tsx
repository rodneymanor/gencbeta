"use client";

import { Settings, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AddVideoDialog } from "./add-video-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";

interface Collection {
  id?: string;
  title: string;
}

interface ManageModeHeaderProps {
  manageMode: boolean;
  selectedVideos: Set<string>;
  videosLength: number;
  collections: Collection[];
  selectedCollectionId: string | null;
  onManageModeToggle: () => void;
  onExitManageMode: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onVideoAdded: () => void;
}

export const ManageModeHeader = ({
  manageMode,
  selectedVideos,
  videosLength,
  collections,
  selectedCollectionId,
  onManageModeToggle,
  onExitManageMode,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onVideoAdded,
}: ManageModeHeaderProps) => {
  if (manageMode) {
    return (
      <>
        {selectedVideos.size > 0 && (
          <>
            <span className="text-muted-foreground text-sm">{selectedVideos.size} selected</span>
            <Button variant="outline" size="sm" onClick={onBulkDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          </>
        )}
        {videosLength > 0 && selectedVideos.size !== videosLength && (
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select All
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onExitManageMode}>
          <Settings className="mr-2 h-4 w-4" />
          Exit Manage
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={onManageModeToggle}>
        <Settings className="mr-2 h-4 w-4" />
        Manage
      </Button>
      <CreateCollectionDialog onCollectionCreated={onVideoAdded}>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Collection
        </Button>
      </CreateCollectionDialog>
      <AddVideoDialog
        collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
        selectedCollectionId={selectedCollectionId ?? undefined}
        onVideoAdded={onVideoAdded}
      />
    </>
  );
};
