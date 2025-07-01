"use client";

import { PanelLeftIcon } from "lucide-react";

import { useSmartSidebarContext } from "@/components/providers/smart-sidebar-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmartSidebarTriggerProps extends React.ComponentProps<typeof Button> {
  className?: string;
}

export function SmartSidebarTrigger({ className, onClick, ...props }: SmartSidebarTriggerProps) {
  const { toggleManual } = useSmartSidebarContext();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleManual(); // Use smart sidebar's manual toggle
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
