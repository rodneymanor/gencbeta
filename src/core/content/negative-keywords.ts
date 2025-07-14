/**
 * Negative Keywords Service
 * Centralized negative keyword management for content filtering
 */

import {
  DEFAULT_NEGATIVE_KEYWORDS,
  NegativeKeywordSettings,
  UserNegativeKeywords,
  getEffectiveNegativeKeywords,
} from "@/data/negative-keywords";
import { getAdminDb } from "@/lib/firebase-admin";

export interface NegativeKeywordFilter {
  keywords: string[];
  enabled: boolean;
  severity: "block" | "warn" | "suggest";
}

export interface ContentFilterResult {
  hasViolations: boolean;
  violations: string[];
  filteredContent: string;
  suggestions: string[];
}

/**
 * Get user's negative keyword settings
 * @param userId - User ID
 * @returns User's negative keyword settings
 */
export async function getUserNegativeKeywords(userId: string): Promise<UserNegativeKeywords> {
  try {
    console.log("🔍 [NegativeKeywords] Fetching settings for user:", userId);

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const snapshot = await adminDb.collection("user_negative_keywords").where("userId", "==", userId).limit(1).get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data() as Omit<UserNegativeKeywords, "id">;

      console.log("✅ [NegativeKeywords] Found existing settings");
      return {
        id: doc.id,
        ...data,
      };
    }

    // Create default settings if none exist
    console.log("🔧 [NegativeKeywords] Creating default settings");
    const defaultSettings: Omit<UserNegativeKeywords, "id"> = {
      userId,
      settings: {
        defaultKeywords: DEFAULT_NEGATIVE_KEYWORDS,
        userRemovedKeywords: [],
        userAddedKeywords: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("user_negative_keywords").add(defaultSettings);

    console.log("✅ [NegativeKeywords] Created default settings");
    return {
      id: docRef.id,
      ...defaultSettings,
    };
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error fetching settings:", error);
    throw new Error("Failed to fetch negative keyword settings");
  }
}

/**
 * Update user's negative keyword settings
 * @param userId - User ID
 * @param settings - New settings
 * @returns Updated settings
 */
export async function updateUserNegativeKeywords(
  userId: string,
  settings: NegativeKeywordSettings,
): Promise<UserNegativeKeywords> {
  try {
    console.log("🔧 [NegativeKeywords] Updating settings for user:", userId);

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const existingSettings = await getUserNegativeKeywords(userId);

    const updatedData = {
      settings,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("user_negative_keywords").doc(existingSettings.id!).update(updatedData);

    console.log("✅ [NegativeKeywords] Settings updated successfully");

    return {
      ...existingSettings,
      ...updatedData,
    };
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error updating settings:", error);
    throw new Error("Failed to update negative keyword settings");
  }
}

/**
 * Get effective negative keywords for a user (for use in AI prompts)
 * @param userId - User ID
 * @returns Array of effective negative keywords
 */
export async function getEffectiveNegativeKeywordsForUser(userId: string): Promise<string[]> {
  try {
    const userSettings = await getUserNegativeKeywords(userId);
    return getEffectiveNegativeKeywords(userSettings.settings);
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error getting effective keywords:", error);
    // Return empty array as fallback to not break script generation
    return [];
  }
}

/**
 * Add a custom negative keyword for a user
 * @param userId - User ID
 * @param keyword - Keyword to add
 * @returns Updated settings
 */
export async function addCustomKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
  try {
    console.log("➕ [NegativeKeywords] Adding custom keyword:", keyword);

    const userSettings = await getUserNegativeKeywords(userId);
    const trimmedKeyword = keyword.trim().toLowerCase();

    // Check if keyword already exists
    if (userSettings.settings.userAddedKeywords.includes(trimmedKeyword)) {
      throw new Error("Keyword already exists in your custom list");
    }

    // Check if it's in the default list
    if (DEFAULT_NEGATIVE_KEYWORDS.includes(trimmedKeyword)) {
      throw new Error("Keyword already exists in the default list");
    }

    const updatedSettings: NegativeKeywordSettings = {
      ...userSettings.settings,
      userAddedKeywords: [...userSettings.settings.userAddedKeywords, trimmedKeyword],
    };

    return await updateUserNegativeKeywords(userId, updatedSettings);
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error adding custom keyword:", error);
    throw error;
  }
}

/**
 * Remove a custom negative keyword for a user
 * @param userId - User ID
 * @param keyword - Keyword to remove
 * @returns Updated settings
 */
export async function removeCustomKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
  try {
    console.log("➖ [NegativeKeywords] Removing custom keyword:", keyword);

    const userSettings = await getUserNegativeKeywords(userId);
    const trimmedKeyword = keyword.trim().toLowerCase();

    const updatedSettings: NegativeKeywordSettings = {
      ...userSettings.settings,
      userAddedKeywords: userSettings.settings.userAddedKeywords.filter((k) => k !== trimmedKeyword),
    };

    return await updateUserNegativeKeywords(userId, updatedSettings);
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error removing custom keyword:", error);
    throw error;
  }
}

/**
 * Toggle a default keyword (add to removed list or remove from removed list)
 * @param userId - User ID
 * @param keyword - Keyword to toggle
 * @returns Updated settings
 */
export async function toggleDefaultKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
  try {
    console.log("🔄 [NegativeKeywords] Toggling default keyword:", keyword);

    const userSettings = await getUserNegativeKeywords(userId);
    const trimmedKeyword = keyword.trim().toLowerCase();

    // Check if keyword is in the default list
    if (!DEFAULT_NEGATIVE_KEYWORDS.includes(trimmedKeyword)) {
      throw new Error("Keyword is not in the default list");
    }

    const isCurrentlyRemoved = userSettings.settings.userRemovedKeywords.includes(trimmedKeyword);

    const updatedSettings: NegativeKeywordSettings = {
      ...userSettings.settings,
      userRemovedKeywords: isCurrentlyRemoved
        ? userSettings.settings.userRemovedKeywords.filter((k) => k !== trimmedKeyword)
        : [...userSettings.settings.userRemovedKeywords, trimmedKeyword],
    };

    return await updateUserNegativeKeywords(userId, updatedSettings);
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error toggling default keyword:", error);
    throw error;
  }
}

/**
 * Reset user's negative keywords to default settings
 * @param userId - User ID
 * @returns Reset settings
 */
export async function resetToDefault(userId: string): Promise<UserNegativeKeywords> {
  try {
    console.log("🔄 [NegativeKeywords] Resetting to default for user:", userId);

    const defaultSettings: NegativeKeywordSettings = {
      defaultKeywords: DEFAULT_NEGATIVE_KEYWORDS,
      userRemovedKeywords: [],
      userAddedKeywords: [],
    };

    return await updateUserNegativeKeywords(userId, defaultSettings);
  } catch (error) {
    console.error("❌ [NegativeKeywords] Error resetting to default:", error);
    throw error;
  }
}

/**
 * Filter content against negative keywords
 * @param content - Content to filter
 * @param keywords - Negative keywords to check against
 * @returns Filter result
 */
export function filterContent(content: string, keywords: string[]): ContentFilterResult {
  const lowerContent = content.toLowerCase();
  const violations: string[] = [];
  const suggestions: string[] = [];

  keywords.forEach((keyword) => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      violations.push(keyword);
      suggestions.push(`Consider replacing "${keyword}" with a more positive alternative`);
    }
  });

  let filteredContent = content;
  violations.forEach((violation) => {
    // Replace with placeholder for now - in production, you might want to suggest alternatives
    filteredContent = filteredContent.replace(new RegExp(violation, "gi"), `[${violation}]`);
  });

  return {
    hasViolations: violations.length > 0,
    violations,
    filteredContent,
    suggestions,
  };
}

/**
 * Check if content contains any negative keywords
 * @param content - Content to check
 * @param keywords - Negative keywords to check against
 * @returns True if content contains negative keywords
 */
export function hasNegativeKeywords(content: string, keywords: string[]): boolean {
  const lowerContent = content.toLowerCase();
  return keywords.some((keyword) => lowerContent.includes(keyword.toLowerCase()));
}

/**
 * Get keyword suggestions for replacement
 * @param keyword - Negative keyword to replace
 * @returns Array of suggested replacements
 */
export function getKeywordSuggestions(keyword: string): string[] {
  const suggestions: Record<string, string[]> = {
    buy: ["get", "acquire", "obtain", "purchase"],
    sell: ["offer", "provide", "share", "deliver"],
    cheap: ["affordable", "cost-effective", "budget-friendly", "value"],
    expensive: ["premium", "high-quality", "investment", "valuable"],
    free: ["complimentary", "included", "no-cost", "gratis"],
    limited: ["exclusive", "select", "curated", "special"],
    urgent: ["important", "timely", "relevant", "current"],
    secret: ["insight", "strategy", "approach", "method"],
    hack: ["tip", "technique", "strategy", "method"],
    trick: ["technique", "method", "approach", "strategy"],
  };

  return suggestions[keyword.toLowerCase()] || [];
}

/**
 * Build negative keywords prompt for AI
 * @param keywords - Negative keywords to include
 * @returns Formatted prompt string
 */
export function buildNegativeKeywordsPrompt(keywords: string[]): string {
  if (keywords.length === 0) return "";

  return `
IMPORTANT: Avoid using these negative keywords in your content:
${keywords.map((keyword) => `- ${keyword}`).join("\n")}

Instead, use positive, engaging language that builds trust and provides value.`;
}

/**
 * Validate keyword format
 * @param keyword - Keyword to validate
 * @returns Validation result
 */
export function validateKeyword(keyword: string): { valid: boolean; error?: string } {
  const trimmed = keyword.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Keyword cannot be empty" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Keyword must be at least 2 characters" };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "Keyword must be less than 50 characters" };
  }

  if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
    return { valid: false, error: "Keyword can only contain letters, numbers, spaces, hyphens, and underscores" };
  }

  return { valid: true };
}
