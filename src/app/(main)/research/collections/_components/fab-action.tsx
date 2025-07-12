'use client';

import { useState } from 'react';
import { Plus, FolderPlus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function FabAction({ onAddCollection, onAddVideo }: { onAddCollection: () => void; onAddVideo: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Add"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48 p-2 rounded-xl shadow-xl">
          <DropdownMenuItem
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-base cursor-pointer"
            onClick={() => {
              console.log("🎯 [FAB] Add Collection dropdown item clicked");
              setOpen(false);
              onAddCollection();
            }}
          >
            <FolderPlus className="h-5 w-5 text-primary" />
            <span>Add Collection</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-base cursor-pointer"
            onClick={() => {
              console.log("🎯 [FAB] Add Video dropdown item clicked");
              setOpen(false);
              onAddVideo();
            }}
          >
            <Video className="h-5 w-5 text-primary" />
            <span>Add Video</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 