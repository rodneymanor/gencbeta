"use client";

import { useSmartSidebarContext } from "@/components/providers/smart-sidebar-provider";

interface SidebarHoverWrapperProps {
  children: React.ReactNode;
}

export function SidebarHoverWrapper({ children }: SidebarHoverWrapperProps) {
  const { handleMouseEnter, handleMouseLeave } = useSmartSidebarContext();

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="h-full">
      {children}
    </div>
  );
}
