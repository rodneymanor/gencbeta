/**
 * React Hook for Feature Flags
 * Provides client-side feature flag checking with caching
 */

import { useState, useEffect, useCallback } from "react";

import { FeatureFlags, FeatureFlagService } from "@/lib/feature-flags";

import { useAuth } from "@/contexts/AuthContext";

interface FeatureFlagHook {
  flags: FeatureFlags;
  isLoading: boolean;
  error: string | null;
  isEnabled: (flagName: keyof FeatureFlags) => boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_FLAGS: FeatureFlags = {
  v2_script_generation: false,
  v2_enhanced_prompts: false,
  v2_template_hooks: false,
  v2_smart_bridges: false,
  v2_performance_monitoring: false,
};

/**
 * Hook to manage feature flags for the current user
 */
export const useFeatureFlags = (): FeatureFlagHook => {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    if (!user?.uid) {
      setFlags(DEFAULT_FLAGS);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const userFlags = await FeatureFlagService.getUserFlags(user.uid);
      setFlags(userFlags);
    } catch (err) {
      console.error("Error fetching feature flags:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch feature flags");
      setFlags(DEFAULT_FLAGS); // Fallback to defaults
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isEnabled = useCallback(
    (flagName: keyof FeatureFlags): boolean => {
      return flags[flagName] || false;
    },
    [flags],
  );

  const refresh = useCallback(async () => {
    await fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    isLoading,
    error,
    isEnabled,
    refresh,
  };
};

/**
 * Hook to check a specific feature flag
 */
export const useFeatureFlag = (
  flagName: keyof FeatureFlags,
): {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
} => {
  const { flags, isLoading, error } = useFeatureFlags();

  return {
    isEnabled: flags[flagName] || false,
    isLoading,
    error,
  };
};

/**
 * Hook for V2 script generation feature flag
 */
export const useV2ScriptGeneration = (): {
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  canUseV2: boolean;
} => {
  const { isEnabled, isLoading, error } = useFeatureFlag("v2_script_generation");

  return {
    isEnabled,
    isLoading,
    error,
    canUseV2: isEnabled && !isLoading && !error,
  };
};

/**
 * Server-side feature flag checking for API routes
 */
export const checkFeatureFlagServer = async (userId: string, flagName: keyof FeatureFlags): Promise<boolean> => {
  try {
    return await FeatureFlagService.isEnabled(userId, flagName);
  } catch (error) {
    console.error(`Error checking feature flag ${flagName} for user ${userId}:`, error);
    return false;
  }
};

/**
 * Utility function to get all flags for a user (server-side)
 */
export const getUserFlagsServer = async (userId: string): Promise<FeatureFlags> => {
  try {
    return await FeatureFlagService.getUserFlags(userId);
  } catch (error) {
    console.error(`Error fetching feature flags for user ${userId}:`, error);
    return DEFAULT_FLAGS;
  }
};

/**
 * Feature flag context provider data
 */
export interface FeatureFlagContextData extends FeatureFlagHook {
  // Additional context-specific methods can be added here
}

/**
 * Helper function to create feature flag variants
 */
export const createFeatureFlagVariant = <T>(flagName: keyof FeatureFlags, enabledVariant: T, disabledVariant: T) => {
  return (flags: FeatureFlags): T => {
    return flags[flagName] ? enabledVariant : disabledVariant;
  };
};

/**
 * Environment-based feature flag checking (for development)
 */
export const getFeatureFlagFromEnv = (flagName: string): boolean => {
  if (typeof window !== "undefined") {
    // Client-side: check localStorage for development overrides
    const envOverride = localStorage.getItem(`feature_flag_${flagName}`);
    if (envOverride !== null) {
      return envOverride === "true";
    }
  }

  // Server-side: check environment variables
  const envVar = `NEXT_PUBLIC_FEATURE_${flagName.toUpperCase()}_ENABLED`;
  return process.env[envVar] === "true";
};

/**
 * Development utility to override feature flags locally
 */
export const setLocalFeatureFlag = (flagName: string, enabled: boolean): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`feature_flag_${flagName}`, enabled.toString());
  }
};

/**
 * Clear all local feature flag overrides
 */
export const clearLocalFeatureFlags = (): void => {
  if (typeof window !== "undefined") {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("feature_flag_"));
    keys.forEach((key) => localStorage.removeItem(key));
  }
};
