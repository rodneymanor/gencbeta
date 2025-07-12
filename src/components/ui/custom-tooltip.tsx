"use client";

import * as React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface CustomTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  openDelay?: number;
  closeDelay?: number;
}

export function CustomTooltip({
  children,
  content,
  side = "right",
  align = "center",
  sideOffset = 8,
  openDelay = 150,
  closeDelay = 300,
}: CustomTooltipProps) {
  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-48 space-y-1 p-2" 
        side={side} 
        align={align} 
        sideOffset={sideOffset}
      >
        <div className={cn(
          "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-3 [&>svg]:shrink-0",
          "data-[active=true]:text-sidebar-accent-foreground",
          "text-sm h-7",
          "group-data-[collapsible=icon]:hidden"
        )}>
          {content}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
} 