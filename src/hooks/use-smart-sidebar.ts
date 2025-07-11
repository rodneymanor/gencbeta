"use client";

import { useCallback, useEffect, useState, useRef } from "react";

import { useIsMobile } from "@/hooks/use-mobile";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_PINNED_COOKIE_NAME = "sidebar_pinned";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const HOVER_DELAY_OPEN = 150; // ms delay before opening on hover
const HOVER_DELAY_CLOSE = 300; // ms delay before closing on hover away

type ManualState = "open" | "closed";
type HoverState = "hovering" | "idle";
type PinState = "pinned" | "unpinned";
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

/**
 * Production-ready smart sidebar hook with manual and hover state management
 *
 * Features:
 * - Dual state: Manual (persisted) + Hover (temporary)
 * - Mobile detection (hover disabled on mobile)
 * - Configurable delays for smooth UX
 * - Visual state indicators
 * - SSR-safe persistence
 */
export function useSmartSidebar(): SmartSidebarReturn {
  const isMobile = useIsMobile();

  // State management
  const [manualState, setManualState] = useState<ManualState>("closed");
  const [hoverState, setHoverState] = useState<HoverState>("idle");
  const [pinState, setPinState] = useState<PinState>("unpinned");
  const [isLoading, setIsLoading] = useState(true);

  // Refs for managing delays
  const hoverOpenTimeoutRef = useRef<NodeJS.Timeout>();
  const hoverCloseTimeoutRef = useRef<NodeJS.Timeout>();

  // Persistence functions
  const persistManualState = useCallback((state: ManualState) => {
    // Don't persist manual open state - sidebar should always start closed
    // Only pin state should be persisted for permanent expansion
  }, []);

  const persistPinState = useCallback((state: PinState) => {
    try {
      const pinned = state === "pinned";

      // Set cookie for SSR
      if (typeof document !== "undefined") {
        const isSecure = location.protocol === "https:";
        document.cookie = `${SIDEBAR_PINNED_COOKIE_NAME}=${pinned}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax; Secure=${isSecure}`;
      }

      // Set localStorage for client-side reliability
      if (typeof window !== "undefined") {
        localStorage.setItem(SIDEBAR_PINNED_COOKIE_NAME, String(pinned));
      }
    } catch (error) {
      console.warn("Failed to persist sidebar pin state:", error);
    }
  }, []);

  const getPersistedManualState = useCallback((): ManualState => {
    // Always start closed - don't persist manual open state
    // Only pin state should be persisted for permanent expansion
    return "closed";
  }, []);

  const getPersistedPinState = useCallback((): PinState => {
    try {
      // Try localStorage first
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(SIDEBAR_PINNED_COOKIE_NAME);
        if (stored !== null) {
          return stored === "true" ? "pinned" : "unpinned";
        }
      }

      // Fallback to cookie parsing
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        const targetCookie = cookies.find((cookie) => cookie.trim().startsWith(`${SIDEBAR_PINNED_COOKIE_NAME}=`));
        if (targetCookie) {
          const cookieValue = targetCookie.split("=")[1]?.trim();
          return cookieValue === "true" ? "pinned" : "unpinned";
        }
      }
    } catch (error) {
      console.warn("Failed to read persisted sidebar pin state:", error);
    }

    // Default to unpinned if no preference exists
    return "unpinned";
  }, []);

  // Initialize from persistence on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const persistedManualState = getPersistedManualState();
      const persistedPinState = getPersistedPinState();

      setManualState(persistedManualState);
      setPinState(persistedPinState);
      setIsLoading(false);
    }
  }, [getPersistedManualState, getPersistedPinState]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverOpenTimeoutRef.current) {
        clearTimeout(hoverOpenTimeoutRef.current);
      }
      if (hoverCloseTimeoutRef.current) {
        clearTimeout(hoverCloseTimeoutRef.current);
      }
    };
  }, []);

  // Manual actions (these get persisted)
  const setManualOpen = useCallback(
    (open: boolean) => {
      const newState: ManualState = open ? "open" : "closed";
      setManualState(newState);
      persistManualState(newState);

      // Clear any pending hover actions when user manually interacts
      if (hoverOpenTimeoutRef.current) {
        clearTimeout(hoverOpenTimeoutRef.current);
      }
      if (hoverCloseTimeoutRef.current) {
        clearTimeout(hoverCloseTimeoutRef.current);
      }
      setHoverState("idle");
    },
    [persistManualState],
  );

  const toggleManual = useCallback(() => {
    setManualOpen(manualState === "closed");
  }, [manualState, setManualOpen]);

  // Pin actions (these get persisted)
  const setPinned = useCallback(
    (pinned: boolean) => {
      const newState: PinState = pinned ? "pinned" : "unpinned";
      setPinState(newState);
      persistPinState(newState);

      // When pinning, clear any hover state and ensure sidebar is open
      if (pinned) {
        if (hoverOpenTimeoutRef.current) {
          clearTimeout(hoverOpenTimeoutRef.current);
        }
        if (hoverCloseTimeoutRef.current) {
          clearTimeout(hoverCloseTimeoutRef.current);
        }
        setHoverState("idle");
        // Don't change manual state when pinning - let pin state take precedence
      }
    },
    [persistPinState],
  );

  const togglePin = useCallback(() => {
    setPinned(pinState === "unpinned");
  }, [pinState, setPinned]);

  // Hover actions (disabled - sidebar persists in collapsed state)
  const handleMouseEnter = useCallback(() => {
    // Hover expansion disabled - sidebar stays collapsed
    // Only manual actions and pin state can open the sidebar
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Hover expansion disabled - sidebar stays collapsed
    // Only manual actions and pin state can open the sidebar
  }, []);

  // Computed states
  const isManuallyOpen = manualState === "open";
  const isHoverOpen = hoverState === "hovering" && manualState === "closed";
  const isPinned = pinState === "pinned";
  const isOpen = isPinned || isManuallyOpen || isHoverOpen;

  // Visual state for styling
  const visualState: VisualState = isPinned
    ? "pinned-open"
    : isManuallyOpen
      ? "manual-open"
      : isHoverOpen
        ? "hover-open"
        : "closed";

  return {
    // State
    isOpen,
    visualState,
    isManuallyOpen,
    isHoverOpen,
    isPinned,

    // Manual actions
    toggleManual,
    setManualOpen,

    // Pin actions
    togglePin,
    setPinned,

    // Hover actions
    handleMouseEnter,
    handleMouseLeave,

    // Utilities
    isLoading,
    isMobile,
  };
}
