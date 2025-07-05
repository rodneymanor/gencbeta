"use client";

import { createContext, useContext } from "react";

import { useSmartSidebar as useSmartSidebarInternal } from "@/hooks/use-smart-sidebar";

type VisualState = "manual-open" | "hover-open" | "pinned-open" | "closed";

interface SmartSidebarReturn {
  // State
  isOpen: boolean;
  visualState: VisualState;
  isManuallyOpen: boolean;
  isHoverOpen: boolean;
  isPinned: boolean;

  // Manual actions (persisted)
  toggleManual: () => void;
  setManualOpen: (open: boolean) => void;

  // Pin actions (persisted)
  togglePin: () => void;
  setPinned: (pinned: boolean) => void;

  // Hover actions (temporary)
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;

  // Utilities
  isLoading: boolean;
  isMobile: boolean;
}

// Create context for sharing smart sidebar state
const SmartSidebarContext = createContext<SmartSidebarReturn | null>(null);

interface SmartSidebarProviderProps {
  children: React.ReactNode;
}

export function SmartSidebarProvider({ children }: SmartSidebarProviderProps) {
  const smartSidebarState = useSmartSidebarInternal();

  return <SmartSidebarContext.Provider value={smartSidebarState}>{children}</SmartSidebarContext.Provider>;
}

export function useSmartSidebarContext(): SmartSidebarReturn {
  const context = useContext(SmartSidebarContext);
  if (!context) {
    throw new Error("useSmartSidebarContext must be used within a SmartSidebarProvider");
  }
  return context;
}
