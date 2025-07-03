import { adminDb } from "./firebase-admin";
import { 
  DEFAULT_NEGATIVE_KEYWORDS, 
  NegativeKeywordSettings, 
  UserNegativeKeywords,
  getEffectiveNegativeKeywords
} from "@/data/negative-keywords";

export class NegativeKeywordsService {
  private static readonly COLLECTION_NAME = "user_negative_keywords";

  /**
   * Get user's negative keyword settings
   */
  static async getUserNegativeKeywords(userId: string): Promise<UserNegativeKeywords> {
    try {
      console.log("🔍 [NegativeKeywords] Fetching settings for user:", userId);

      const snapshot = await adminDb
        .collection(this.COLLECTION_NAME)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data() as Omit<UserNegativeKeywords, "id">;
        
        console.log("✅ [NegativeKeywords] Found existing settings");
        return {
          id: doc.id,
          ...data
        };
      }

      // Create default settings if none exist
      console.log("🔧 [NegativeKeywords] Creating default settings");
      const defaultSettings: Omit<UserNegativeKeywords, "id"> = {
        userId,
        settings: {
          defaultKeywords: DEFAULT_NEGATIVE_KEYWORDS,
          userRemovedKeywords: [],
          userAddedKeywords: []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await adminDb.collection(this.COLLECTION_NAME).add(defaultSettings);
      
      console.log("✅ [NegativeKeywords] Created default settings");
      return {
        id: docRef.id,
        ...defaultSettings
      };

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error fetching settings:", error);
      throw new Error("Failed to fetch negative keyword settings");
    }
  }

  /**
   * Update user's negative keyword settings
   */
  static async updateUserNegativeKeywords(
    userId: string, 
    settings: NegativeKeywordSettings
  ): Promise<UserNegativeKeywords> {
    try {
      console.log("🔧 [NegativeKeywords] Updating settings for user:", userId);

      const existingSettings = await this.getUserNegativeKeywords(userId);
      
      const updatedData = {
        settings,
        updatedAt: new Date().toISOString()
      };

      await adminDb
        .collection(this.COLLECTION_NAME)
        .doc(existingSettings.id!)
        .update(updatedData);

      console.log("✅ [NegativeKeywords] Settings updated successfully");
      
      return {
        ...existingSettings,
        ...updatedData
      };

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error updating settings:", error);
      throw new Error("Failed to update negative keyword settings");
    }
  }

  /**
   * Get effective negative keywords for a user (for use in AI prompts)
   */
  static async getEffectiveNegativeKeywordsForUser(userId: string): Promise<string[]> {
    try {
      const userSettings = await this.getUserNegativeKeywords(userId);
      return getEffectiveNegativeKeywords(userSettings.settings);
    } catch (error) {
      console.error("❌ [NegativeKeywords] Error getting effective keywords:", error);
      // Return empty array as fallback to not break script generation
      return [];
    }
  }

  /**
   * Add a custom negative keyword for a user
   */
  static async addCustomKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
    try {
      console.log("➕ [NegativeKeywords] Adding custom keyword:", keyword);

      const userSettings = await this.getUserNegativeKeywords(userId);
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
        userAddedKeywords: [...userSettings.settings.userAddedKeywords, trimmedKeyword]
      };

      return await this.updateUserNegativeKeywords(userId, updatedSettings);

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error adding custom keyword:", error);
      throw error;
    }
  }

  /**
   * Remove a custom negative keyword for a user
   */
  static async removeCustomKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
    try {
      console.log("➖ [NegativeKeywords] Removing custom keyword:", keyword);

      const userSettings = await this.getUserNegativeKeywords(userId);
      const trimmedKeyword = keyword.trim().toLowerCase();

      const updatedSettings: NegativeKeywordSettings = {
        ...userSettings.settings,
        userAddedKeywords: userSettings.settings.userAddedKeywords.filter(k => k !== trimmedKeyword)
      };

      return await this.updateUserNegativeKeywords(userId, updatedSettings);

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error removing custom keyword:", error);
      throw error;
    }
  }

  /**
   * Toggle a default keyword (add to removed list or remove from removed list)
   */
  static async toggleDefaultKeyword(userId: string, keyword: string): Promise<UserNegativeKeywords> {
    try {
      console.log("🔄 [NegativeKeywords] Toggling default keyword:", keyword);

      const userSettings = await this.getUserNegativeKeywords(userId);
      const trimmedKeyword = keyword.trim().toLowerCase();

      // Check if keyword is in the default list
      if (!DEFAULT_NEGATIVE_KEYWORDS.includes(trimmedKeyword)) {
        throw new Error("Keyword is not in the default list");
      }

      const isCurrentlyRemoved = userSettings.settings.userRemovedKeywords.includes(trimmedKeyword);
      
      const updatedSettings: NegativeKeywordSettings = {
        ...userSettings.settings,
        userRemovedKeywords: isCurrentlyRemoved
          ? userSettings.settings.userRemovedKeywords.filter(k => k !== trimmedKeyword)
          : [...userSettings.settings.userRemovedKeywords, trimmedKeyword]
      };

      return await this.updateUserNegativeKeywords(userId, updatedSettings);

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error toggling default keyword:", error);
      throw error;
    }
  }

  /**
   * Reset user's negative keywords to default
   */
  static async resetToDefault(userId: string): Promise<UserNegativeKeywords> {
    try {
      console.log("🔄 [NegativeKeywords] Resetting to default for user:", userId);

      const defaultSettings: NegativeKeywordSettings = {
        defaultKeywords: DEFAULT_NEGATIVE_KEYWORDS,
        userRemovedKeywords: [],
        userAddedKeywords: []
      };

      return await this.updateUserNegativeKeywords(userId, defaultSettings);

    } catch (error) {
      console.error("❌ [NegativeKeywords] Error resetting to default:", error);
      throw error;
    }
  }
} 