"use client";

import { Settings, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { type Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

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
  onCollectionDeleted?: () => void;
}

const ManageModeControls = ({
  selectedVideos,
  videosLength,
  selectedCollectionId,
  collections,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onExitManageMode,
  onCollectionDeleted,
}: {
  selectedVideos: Set<string>;
  videosLength: number;
  selectedCollectionId: string | null;
  collections: Collection[];
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onExitManageMode: () => void;
  onCollectionDeleted?: () => void;
}) => {
  // Find the current collection
  const currentCollection = selectedCollectionId 
    ? collections.find(c => c.id === selectedCollectionId)
    : null;

  return (
    <>
      {selectedVideos.size > 0 && (
        <>
          <span className="text-muted-foreground text-sm">{selectedVideos.size} selected</span>
          <Button variant="outline" size="sm" onClick={onBulkDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected Videos
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
      {/* Collection-specific actions */}
      {currentCollection && onCollectionDeleted && (
        <DeleteCollectionDialog
          collection={currentCollection}
          onCollectionDeleted={onCollectionDeleted}
        >
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Collection
          </Button>
        </DeleteCollectionDialog>
      )}
      <Button variant="outline" size="sm" onClick={onExitManageMode}>
        <Settings className="mr-2 h-4 w-4" />
        Exit Manage
      </Button>
    </>
  );
};

const AdminControls = ({
  collections,
  selectedCollectionId,
  onManageModeToggle,
  onVideoAdded,
}: {
  collections: Collection[];
  selectedCollectionId: string | null;
  onManageModeToggle: () => void;
  onVideoAdded: () => void;
}) => (
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
  onCollectionDeleted,
}: ManageModeHeaderProps) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const isCreator = userProfile?.role === "creator";

  if (manageMode && isAdmin) {
    return (
      <ManageModeControls
        selectedVideos={selectedVideos}
        videosLength={videosLength}
        selectedCollectionId={selectedCollectionId}
        collections={collections}
        onBulkDelete={onBulkDelete}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onExitManageMode={onExitManageMode}
        onCollectionDeleted={onCollectionDeleted}
      />
    );
  }

  if (isCreator) {
    return null;
  }

  if (isAdmin) {
    return (
      <AdminControls
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        onManageModeToggle={onManageModeToggle}
        onVideoAdded={onVideoAdded}
      />
    );
  }

  return null;
};
