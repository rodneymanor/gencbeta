"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { Plus, StickyNote, Mic, Link, FolderOpen } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";

import { AddVideoDialog } from "../../collections/_components/add-video-dialog";
import { CreateCollectionDialog } from "../../collections/_components/create-collection-dialog";

interface CreateDropdownProps {
  children: React.ReactNode;
}

export function CreateDropdown({ children }: CreateDropdownProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user, loadCollections]);

  const loadCollections = useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await CollectionsService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, [user]);

  const handleCreateNote = () => {
    router.push("/dashboard/capture/notes");
  };

  const handleCreateRecording = () => {
    router.push("/dashboard/capture/voice");
  };

  const handleCollections = () => {
    router.push("/dashboard/collections");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" side="right" align="start">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            <span>Create</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuItem onClick={handleCreateNote} className="cursor-pointer">
              <StickyNote className="mr-2 h-4 w-4" />
              <span>Note</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateRecording} className="cursor-pointer">
              <Mic className="mr-2 h-4 w-4" />
              <span>Recording</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Collections</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <CreateCollectionDialog onCollectionCreated={loadCollections}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                <span>New Collection</span>
              </DropdownMenuItem>
            </CreateCollectionDialog>
            <AddVideoDialog collections={collections} onVideoAdded={loadCollections}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                <Link className="mr-2 h-4 w-4" />
                <span>Add Video</span>
              </DropdownMenuItem>
            </AddVideoDialog>
            <DropdownMenuItem onClick={handleCollections} className="cursor-pointer">
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>View All</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
