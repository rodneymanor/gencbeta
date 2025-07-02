"use client";

import { MoreHorizontal, Trash2, Edit3, FolderOpen } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { type Collection } from "@/lib/collections";

import { DeleteCollectionDialog } from "./delete-collection-dialog";

interface CollectionBadgeMenuProps {
  collection: Collection;
  onCollectionDeleted: () => void;
  className?: string;
}

export function CollectionBadgeMenu({ collection, onCollectionDeleted, className = "" }: CollectionBadgeMenuProps) {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === "coach" || userProfile?.role === "super_admin";

  // Don't show menu for non-admins
  if (!isAdmin) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 ${className}`}
        >
          <MoreHorizontal className="h-3 w-3" />
          <span className="sr-only">Collection options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem className="gap-2">
          <FolderOpen className="h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Edit3 className="h-4 w-4" />
          Edit Collection
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteCollectionDialog collection={collection} onCollectionDeleted={onCollectionDeleted}>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive gap-2"
            onSelect={(e) => e.preventDefault()}
          >
            <Trash2 className="h-4 w-4" />
            Delete Collection
          </DropdownMenuItem>
        </DeleteCollectionDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
