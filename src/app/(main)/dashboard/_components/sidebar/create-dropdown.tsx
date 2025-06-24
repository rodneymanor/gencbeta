"use client";

import { useState } from "react";

import { Plus, StickyNote, Mic, Link, FolderOpen, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface CreateDropdownProps {
  children: React.ReactNode;
}

export function CreateDropdown({ children }: CreateDropdownProps) {
  const handleCreateNote = () => {
    console.log("Creating note...");
    // TODO: Navigate to note creation or handle note creation logic
  };

  const handleCreateRecording = () => {
    console.log("Creating recording...");
    // TODO: Navigate to recording creation or handle recording creation logic
  };

  const handleImportUrl = () => {
    console.log("Importing from URL...");
    // TODO: Handle URL import logic
  };

  const handleCollections = () => {
    console.log("Opening collections...");
    // TODO: Navigate to collections or handle collections logic
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
            <Link className="mr-2 h-4 w-4" />
            <span>Import</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-32">
            <DropdownMenuItem onClick={handleImportUrl} className="cursor-pointer">
              <Link className="mr-2 h-4 w-4" />
              <span>URL</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCollections} className="cursor-pointer">
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Collections</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
