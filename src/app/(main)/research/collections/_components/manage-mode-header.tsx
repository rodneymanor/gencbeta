"use client";

import { Settings, Trash2, Plus, CheckSquare, X, MoreVertical, MoveRight, FolderOpen } from "lucide-react";

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
import { useState } from "react";
import { ManageCollectionsModal } from "./manage-collections-modal";

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
  <div className="flex items-center gap-4">
    {/* Selection Counter */}
    <div className="bg-secondary/40 border-border/60 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-xs">
      <span className="text-muted-foreground">Selected:</span>
      <Badge variant="secondary" className="bg-primary text-primary-foreground shadow-sm text-sm px-2 py-1">
        {selectedVideos.size}
      </Badge>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="default"
        onClick={onSelectAll}
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm h-10 px-4"
      >
        <CheckSquare className="mr-2 h-4 w-4" />
        Select All
      </Button>
      <Button
        variant="outline"
        size="default"
        onClick={onClearSelection}
        className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm h-10 px-4"
      >
        <X className="mr-2 h-4 w-4" />
        Clear
      </Button>
      {selectedCollectionId && selectedVideos.size > 0 && (
        <>
          <MoveCopyVideosDialog
            collections={collections}
            selectedVideos={Array.from(selectedVideos)}
            currentCollectionId={currentCollectionId}
            onCompleted={onActionCompleted}
          >
            <Button
              variant="outline"
              size="default"
              className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm h-10 px-4"
            >
              <MoveRight className="mr-2 h-4 w-4" />
              Move/Copy
            </Button>
          </MoveCopyVideosDialog>

          <Button
            variant="destructive"
            size="default"
            onClick={onBulkDelete}
            className="shadow-xs transition-all duration-200 hover:shadow-sm h-10 px-4"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedVideos.size})
          </Button>
        </>
      )}
    </div>

    {/* Exit Button */}
    <div className="border-border/40 ml-2 border-l pl-4">
      <Button
        variant="ghost"
        size="default"
        onClick={onExitManageMode}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200 h-10 px-4"
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
}) => {
  const [manageCollectionsOpen, setManageCollectionsOpen] = useState(false);
  const { user } = useAuth();
  const ownedCollections = user ? collections.filter((c) => c.userId === user.uid) : [];
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground h-11 w-11"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onManageModeToggle} className="cursor-pointer">
            <Settings className="mr-3 h-4 w-4" />
            <span>Manage Videos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setManageCollectionsOpen(true)} className="cursor-pointer">
            <FolderOpen className="mr-3 h-4 w-4" />
            <span>Manage Collections</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ManageCollectionsModal
        open={manageCollectionsOpen}
        onOpenChange={setManageCollectionsOpen}
        collections={ownedCollections}
        onCollectionDeleted={onVideoAdded}
      />
    </div>
  );
};

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
