"use client";

import { Plus, MoreHorizontal, Settings, Trash2, CheckSquare, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { type Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import { CreateCollectionDialog } from "./create-collection-dialog";

interface CollectionsTopbarActionsProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  manageMode: boolean;
  selectedVideos: Set<string>;
  onManageModeToggle: () => void;
  onExitManageMode: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onVideoAdded: () => void;
}

export function CollectionsTopbarActions({
  collections,
  selectedCollectionId,
  manageMode,
  selectedVideos,
  onManageModeToggle,
  onExitManageMode,
  onBulkDelete,
  onClearSelection,
  onSelectAll,
  onVideoAdded,
}: CollectionsTopbarActionsProps) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";
  const isCreator = userProfile?.role === "creator";

  // Don't show anything for creators
  if (isCreator) {
    return null;
  }

  // Manage mode controls
  if (manageMode && isAdmin) {
    return (
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
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
          >
            <X className="h-4 w-4" />
          </Button>
          {selectedVideos.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedVideos.size})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitManageMode}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Regular mode controls for admins
  if (isAdmin) {
    return (
      <div className="flex items-center gap-2">
        <CreateCollectionDialog onCollectionCreated={onVideoAdded}>
          <Button
            variant="outline"
            size="sm"
            className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
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
            className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </AddVideoDialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-border/60 hover:border-border bg-background hover:bg-secondary/60 shadow-xs transition-all duration-200 hover:shadow-sm"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onManageModeToggle}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Videos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return null;
} 