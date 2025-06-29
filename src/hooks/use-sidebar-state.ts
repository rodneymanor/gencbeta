"use client";

import { useCallback, useEffect, useState } from "react";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

interface SidebarStateOptions {
  defaultOpen?: boolean;
  persistKey?: string;
}

interface SidebarStateReturn {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  isLoading: boolean;
}

/**
 * Production-ready hook for managing sidebar state with persistence
 *
 * Features:
 * - Dual persistence (localStorage + cookies)
 * - SSR-safe hydration
 * - Error handling
 * - TypeScript support
 * - Loading states for SSR
 */
export function useSidebarState(options: SidebarStateOptions = {}): SidebarStateReturn {
  const { defaultOpen = true, persistKey = SIDEBAR_COOKIE_NAME } = options;

  const [isOpen, setIsOpenState] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(true);

  // Production-ready state persistence
  const persistState = useCallback(
    (open: boolean) => {
      try {
        // Set cookie for SSR
        if (typeof document !== "undefined") {
          document.cookie = `${persistKey}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax; Secure=${location.protocol === "https:"}`;
        }

        // Set localStorage for client-side reliability
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(persistKey, String(open));
        }
      } catch (error) {
        console.warn(`Failed to persist sidebar state for key "${persistKey}":`, error);
      }
    },
    [persistKey],
  );

  // Read persisted state with fallbacks
  const getPersistedState = useCallback((): boolean => {
    try {
      // Try localStorage first (more reliable on client)
      if (typeof window !== "undefined" && window.localStorage) {
        const stored = localStorage.getItem(persistKey);
        if (stored !== null) {
          return stored === "true";
        }
      }

      // Fallback to cookie parsing
      if (typeof document !== "undefined") {
        const cookies = document.cookie.split(";");
        const targetCookie = cookies.find((cookie) => cookie.trim().startsWith(`${persistKey}=`));
        if (targetCookie) {
          return targetCookie.split("=")[1]?.trim() === "true";
        }
      }
    } catch (error) {
      console.warn(`Failed to read persisted sidebar state for key "${persistKey}":`, error);
    }

    return defaultOpen;
  }, [persistKey, defaultOpen]);

  // Initialize state from persistence on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const persistedState = getPersistedState();
      setIsOpenState(persistedState);
      setIsLoading(false);
    }
  }, [getPersistedState]);

  // Set open state with persistence
  const setOpen = useCallback(
    (open: boolean) => {
      setIsOpenState(open);
      persistState(open);
    },
    [persistState],
  );

  // Toggle function
  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  return {
    isOpen,
    toggle,
    setOpen,
    isLoading,
  };
}

/**
 * Hook specifically for the main application sidebar
 * Uses the standard sidebar persistence key
 */
export function useAppSidebarState() {
  return useSidebarState({
    defaultOpen: true,
    persistKey: SIDEBAR_COOKIE_NAME,
  });
}

/**
 * Utility function to get sidebar state synchronously (for SSR)
 * Should be used in server components or during SSR
 */
export function getServerSidebarState(cookieHeader?: string): boolean {
  try {
    if (!cookieHeader) return true; // Default to open

    const cookies = cookieHeader.split(";");
    const sidebarCookie = cookies.find((cookie) => cookie.trim().startsWith(`${SIDEBAR_COOKIE_NAME}=`));

    if (sidebarCookie) {
      return sidebarCookie.split("=")[1]?.trim() === "true";
    }
  } catch (error) {
    console.warn("Failed to parse server-side sidebar state:", error);
  }

  return true; // Default to open
}
