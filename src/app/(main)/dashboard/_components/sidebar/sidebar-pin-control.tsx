"use client";

import { Pin } from "lucide-react";

import { useSmartSidebarContext } from "@/components/providers/smart-sidebar-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarPinControl() {
  const { isPinned, togglePin, isOpen } = useSmartSidebarContext();

  // Only show when sidebar is open
  if (!isOpen) return null;

  return (
    <div className="flex justify-end p-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePin}
        className={cn(
          "hover:bg-accent/50 h-8 w-8 p-0 transition-all duration-200",
          isPinned && "bg-accent text-accent-foreground",
        )}
        aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
      >
        <Pin className={cn("h-4 w-4 transition-transform duration-200", isPinned ? "rotate-0" : "rotate-45")} />
      </Button>
    </div>
  );
}
