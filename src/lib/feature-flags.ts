/**
 * Feature Flag Service for V2 Script Generation Rollout
 * Provides centralized feature flag management with gradual rollout capabilities
 */

import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { db } from "./firebase";

export interface FeatureFlags {
  v2_script_generation: boolean;
  v2_enhanced_prompts: boolean;
  v2_template_hooks: boolean;
  v2_smart_bridges: boolean;
  v2_performance_monitoring: boolean;
  voice_library: boolean;
  creator_spotlight: boolean;
}

export interface FeatureFlagConfig {
  enabled: boolean;
  rollout_percentage: number;
  whitelist_users: string[];
  blacklist_users: string[];
  admin_override: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlagState {
  [key: string]: FeatureFlagConfig;
}

// Default configuration
const DEFAULT_FLAGS: FeatureFlagState = {
  v2_script_generation: {
    enabled: true,
    rollout_percentage: 5, // Start with 5% rollout
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  v2_enhanced_prompts: {
    enabled: true,
    rollout_percentage: 100, // This is just a prompt enhancement
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  v2_template_hooks: {
    enabled: true,
    rollout_percentage: 100, // Safe to enable for all users
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  v2_smart_bridges: {
    enabled: true,
    rollout_percentage: 100, // Safe to enable for all users
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  v2_performance_monitoring: {
    enabled: true,
    rollout_percentage: 100, // Always monitor performance
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  voice_library: {
    enabled: false, // Disabled by default - feature not implemented
    rollout_percentage: 0,
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  creator_spotlight: {
    enabled: false, // Disabled by default - feature not implemented
    rollout_percentage: 0,
    whitelist_users: [],
    blacklist_users: [],
    admin_override: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

export class FeatureFlagService {
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache = new Map<string, { data: FeatureFlagState; timestamp: number }>();

  /**
   * Get feature flag state from Firestore with caching
   */
  private static async getFeatureFlagState(): Promise<FeatureFlagState> {
    const cacheKey = "feature_flags";
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const docRef = doc(db, "system_config", "feature_flags");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as FeatureFlagState;
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } else {
        // Initialize with defaults
        await setDoc(docRef, DEFAULT_FLAGS);
        this.cache.set(cacheKey, { data: DEFAULT_FLAGS, timestamp: Date.now() });
        return DEFAULT_FLAGS;
      }
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      // Return defaults on error
      return DEFAULT_FLAGS;
    }
  }

  /**
   * Check if a feature flag is enabled for a specific user
   */
  static async isEnabled(userId: string, flagName: keyof FeatureFlags): Promise<boolean> {
    try {
      // Check environment variable first for quick override
      const envEnabled = getFeatureFlagFromEnv(flagName);
      const envPercentage = getRolloutPercentageFromEnv(flagName);

      if (envEnabled && envPercentage === 100) {
        console.log(`🚀 [FEATURE FLAG] ${flagName} enabled for all users via environment variable`);
        return true;
      }

      if (envEnabled && envPercentage > 0) {
        console.log(`🎯 [FEATURE FLAG] ${flagName} using env rollout ${envPercentage}% for user ${userId}`);
        return this.isUserInRollout(userId, envPercentage);
      }

      const flags = await this.getFeatureFlagState();
      const flagConfig = flags[flagName];

      if (!flagConfig) {
        console.warn(`Feature flag '${flagName}' not found, checking environment fallback`);
        return envEnabled;
      }

      // Check if feature is disabled globally
      if (!flagConfig.enabled) {
        return false;
      }

      // Check blacklist first
      if (flagConfig.blacklist_users.includes(userId)) {
        return false;
      }

      // Check whitelist (always enabled for whitelisted users)
      if (flagConfig.whitelist_users.includes(userId)) {
        return true;
      }

      // Check admin override
      if (flagConfig.admin_override) {
        return true;
      }

      // Check rollout percentage
      return this.isUserInRollout(userId, flagConfig.rollout_percentage);
    } catch (error) {
      console.error(`Error checking feature flag '${flagName}' for user ${userId}:`, error);

      // Fallback to environment variables on error
      const envEnabled = getFeatureFlagFromEnv(flagName);
      const envPercentage = getRolloutPercentageFromEnv(flagName);

      if (envEnabled && envPercentage > 0) {
        console.log(`🔄 [FEATURE FLAG FALLBACK] Using env config for ${flagName}: ${envPercentage}%`);
        return this.isUserInRollout(userId, envPercentage);
      }

      return false;
    }
  }

  /**
   * Get all feature flags for a user
   */
  static async getUserFlags(userId: string): Promise<FeatureFlags> {
    const flags = await this.getFeatureFlagState();
    const userFlags: FeatureFlags = {} as FeatureFlags;

    for (const [flagName, _] of Object.entries(flags)) {
      userFlags[flagName as keyof FeatureFlags] = await this.isEnabled(userId, flagName as keyof FeatureFlags);
    }

    return userFlags;
  }

  /**
   * Determine if user is in rollout percentage using consistent hashing
   */
  private static isUserInRollout(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Use consistent hashing based on user ID
    const hash = this.simpleHash(userId);
    const userPercentile = hash % 100;

    return userPercentile < percentage;
  }

  /**
   * Simple hash function for consistent rollout
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update feature flag configuration (admin only)
   */
  static async updateFeatureFlag(flagName: keyof FeatureFlags, config: Partial<FeatureFlagConfig>): Promise<void> {
    try {
      const docRef = doc(db, "system_config", "feature_flags");
      const updateData = {
        [`${flagName}`]: {
          ...config,
          updated_at: new Date().toISOString(),
        },
      };

      await updateDoc(docRef, updateData);

      // Clear cache
      this.cache.clear();

      console.log(`Feature flag '${flagName}' updated successfully`);
    } catch (error) {
      console.error(`Error updating feature flag '${flagName}':`, error);
      throw error;
    }
  }

  /**
   * Get current rollout percentage for a feature
   */
  static async getRolloutPercentage(flagName: keyof FeatureFlags): Promise<number> {
    const flags = await this.getFeatureFlagState();
    return flags[flagName]?.rollout_percentage || 0;
  }

  /**
   * Gradually increase rollout percentage
   */
  static async increaseRollout(flagName: keyof FeatureFlags, newPercentage: number): Promise<void> {
    const flags = await this.getFeatureFlagState();
    const currentConfig = flags[flagName];

    if (currentConfig && newPercentage > currentConfig.rollout_percentage) {
      await this.updateFeatureFlag(flagName, {
        ...currentConfig,
        rollout_percentage: Math.min(newPercentage, 100),
      });

      console.log(`Increased rollout for '${flagName}' to ${newPercentage}%`);
    }
  }

  /**
   * Emergency rollback - disable feature flag immediately
   */
  static async emergencyRollback(flagName: keyof FeatureFlags): Promise<void> {
    await this.updateFeatureFlag(flagName, {
      enabled: false,
      rollout_percentage: 0,
      admin_override: false,
    });

    console.log(`Emergency rollback executed for '${flagName}'`);
  }

  /**
   * Clear feature flag cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

// Environment variable fallbacks
export const getFeatureFlagFromEnv = (flagName: string): boolean => {
  const envVar = `FEATURE_${flagName.toUpperCase()}_ENABLED`;
  return process.env[envVar] === "true";
};

export const getRolloutPercentageFromEnv = (flagName: string): number => {
  const envVar = `FEATURE_${flagName.toUpperCase()}_ROLLOUT_PERCENTAGE`;
  return parseInt(process.env[envVar] || "0", 10);
};
