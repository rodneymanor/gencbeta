"use client";

import { Settings, Trash2, Plus, CheckSquare, X, MoreVertical, MoveRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { type Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";
import { MoveCopyVideosDialog } from "./move-copy-videos-dialog";

interface ManageModeHeaderProps {
  manageMode: boolean;
  selectedVideos: Set<string>;
  collections: Collection[];
  selectedCollectionId: string | null;
  onManageModeToggle: () => void;
  onExitManageMode: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onVideoAdded: () => void;
}

const ManageModeControls = ({
  selectedVideos,
  collections,
  currentCollectionId,
  onClearSelection,
  onSelectAll,
  onBulkDelete,
  onExitManageMode,
  onActionCompleted,
}: {
  selectedVideos: Set<string>;
  collections: Collection[];
  currentCollectionId: string | null;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onExitManageMode: () => void;
  onActionCompleted: () => void;
}) => (
  <div className="flex items-center gap-3">
    <div className="bg-secondary/40 border-border/60 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-xs">
      <span className="text-muted-foreground">Selected:</span>
      <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-sm">
        {selectedVideos.size}
      </Badge>
    </div>

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
      >
        <CheckSquare className="mr-2 h-4 w-4" />
        Select All
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onClearSelection}
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
      >
        <X className="mr-2 h-4 w-4" />
        Clear
      </Button>
      {selectedVideos.size > 0 && (
        <>
          <MoveCopyVideosDialog
            collections={collections}
            selectedVideos={Array.from(selectedVideos)}
            currentCollectionId={currentCollectionId}
            onCompleted={onActionCompleted}
          >
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <MoveRight className="mr-1.5 h-3.5 w-3.5" />
              Move/Copy
            </Button>
          </MoveCopyVideosDialog>

          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            className="shadow-xs transition-all duration-200 hover:shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedVideos.size})
          </Button>
        </>
      )}
    </div>

    <div className="border-border/40 ml-2 border-l pl-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onExitManageMode}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
      >
        <X className="mr-2 h-4 w-4" />
        Exit Manage Mode
      </Button>
    </div>
  </div>
);

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
  <div className="flex items-center gap-2">
    <CreateCollectionDialog onCollectionCreated={onVideoAdded}>
      <Button
        variant="outline"
        size="sm"
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 h-8 px-3 text-xs shadow-xs transition-all duration-200 hover:shadow-sm"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Create Collection
      </Button>
    </CreateCollectionDialog>
    <AddVideoDialog
      collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
      selectedCollectionId={selectedCollectionId ?? undefined}
      onVideoAdded={onVideoAdded}
    >
      <Button
        variant="outline"
        size="sm"
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 h-8 px-3 text-xs shadow-xs transition-all duration-200 hover:shadow-sm"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add Video
      </Button>
    </AddVideoDialog>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onManageModeToggle}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Manage Videos</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export const ManageModeHeader = ({
  manageMode,
  selectedVideos,
  collections,
  selectedCollectionId,
  onManageModeToggle,
  onExitManageMode,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onVideoAdded,
}: ManageModeHeaderProps) => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const isCreator = userProfile?.role === "creator";

  if (manageMode && isAdmin) {
    return (
      <ManageModeControls
        selectedVideos={selectedVideos}
        collections={collections}
        currentCollectionId={selectedCollectionId}
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onBulkDelete={onBulkDelete}
        onExitManageMode={onExitManageMode}
        onActionCompleted={onVideoAdded}
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
