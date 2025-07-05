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
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        togglePin();
      }}
      className={cn(
        "hover:bg-accent/50 h-6 w-6 flex-shrink-0 p-0 transition-all duration-200",
        isPinned && "bg-accent text-accent-foreground",
      )}
      aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
    >
      <Pin className={cn("h-3 w-3 transition-transform duration-200", isPinned ? "rotate-0" : "rotate-45")} />
    </Button>
  );
}
