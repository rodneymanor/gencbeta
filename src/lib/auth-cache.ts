// Auth cache utilities for localStorage persistence

import type { User } from "firebase/auth";

export type AccountLevel = "free" | "pro";

export interface AuthCache {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  userProfile: Record<string, unknown> | null; // Use Record instead of any to avoid circular imports
  accountLevel: AccountLevel;
  timestamp: number;
}

// Auth cache keys for localStorage
const AUTH_CACHE_KEY = "gen_c_auth_cache";
const AUTH_CACHE_EXPIRY = 1000 * 60 * 60 * 24 * 7; // 7 days (extended for better UX)
const AUTH_CACHE_STALE_TIME = 1000 * 60 * 60 * 2; // 2 hours (when to refresh in background)

export function getAuthCache(): AuthCache | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const parsed: AuthCache = JSON.parse(cached);

    // Check if cache is expired
    if (Date.now() - parsed.timestamp > AUTH_CACHE_EXPIRY) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Error reading auth cache:", error);
    localStorage.removeItem(AUTH_CACHE_KEY);
    return null;
  }
}

export function setAuthCache(
  user: User | null,
  userProfile: Record<string, unknown> | null,
  accountLevel: AccountLevel,
) {
  if (typeof window === "undefined") return;

  try {
    const cache: AuthCache = {
      user: user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          }
        : null,
      userProfile,
      accountLevel,
      timestamp: Date.now(),
    };

    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Error setting auth cache:", error);
  }
}

export function clearAuthCache() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    console.warn("Error clearing auth cache:", error);
  }
}

export function isCacheStale(): boolean {
  const cache = getAuthCache();
  if (!cache) return true;

  return Date.now() - cache.timestamp > AUTH_CACHE_STALE_TIME;
}
