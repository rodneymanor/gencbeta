"use client";

import { Settings, Trash2, Plus, CheckSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { type Collection } from "@/lib/collections";
import { Badge } from "@/components/ui/badge";

import { AddVideoDialog } from "./add-video-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";

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
  onClearSelection,
  onSelectAll,
  onBulkDelete,
  onExitManageMode,
}: {
  selectedVideos: Set<string>;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onExitManageMode: () => void;
}) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2 px-3 py-2 bg-secondary/40 border border-border/60 rounded-md text-sm font-medium shadow-xs">
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
        className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
      >
        <CheckSquare className="mr-2 h-4 w-4" />
        Select All
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearSelection}
        className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
      >
        <X className="mr-2 h-4 w-4" />
        Clear
      </Button>
      {selectedVideos.size > 0 && (
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={onBulkDelete}
          className="shadow-xs hover:shadow-sm transition-all duration-200"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete ({selectedVideos.size})
        </Button>
      )}
    </div>
    
    <div className="ml-2 border-l border-border/40 pl-3">
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
  <div className="flex items-center gap-3">
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onManageModeToggle}
      className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
    >
      <Settings className="mr-2 h-4 w-4" />
      Manage
    </Button>
    <CreateCollectionDialog onCollectionCreated={onVideoAdded}>
      <Button 
        variant="outline" 
        size="sm"
        className="shadow-xs hover:shadow-sm transition-all duration-200 border-border/60 hover:border-border bg-background hover:bg-secondary/60"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Collection
      </Button>
    </CreateCollectionDialog>
    <AddVideoDialog
      collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
      selectedCollectionId={selectedCollectionId ?? undefined}
      onVideoAdded={onVideoAdded}
    />
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
        onClearSelection={onClearSelection}
        onSelectAll={onSelectAll}
        onBulkDelete={onBulkDelete}
        onExitManageMode={onExitManageMode}
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
