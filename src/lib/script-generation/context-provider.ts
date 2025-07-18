/**
 * Context provider with caching to prevent redundant database fetches
 * Loads user profile, voice settings, and negative keywords once per session
 */

import { ScriptContext } from "./types";
import { getAdminDb } from "@/lib/firebase-admin";
import { UserManagementService } from "@/lib/user-management-server";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class ScriptContextProvider {
  private static instance: ScriptContextProvider;
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): ScriptContextProvider {
    if (!this.instance) {
      this.instance = new ScriptContextProvider();
    }
    return this.instance;
  }

  /**
   * Load all context data for a user with caching
   */
  async loadContext(userId: string): Promise<ScriptContext> {
    const cacheKey = `context:${userId}`;
    const cached = this.getFromCache<ScriptContext>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Parallel fetch all required data
      const [profile, voice, negativeKeywords] = await Promise.all([
        this.loadUserProfile(userId),
        this.loadActiveVoice(userId),
        this.loadNegativeKeywords(userId),
      ]);

      const context: ScriptContext = {
        userId,
        profile,
        voice,
        negativeKeywords,
      };

      this.setCache(cacheKey, context);
      return context;
    } catch (error) {
      console.error("Failed to load context:", error);
      throw new Error(`Failed to load user context: ${error.message}`);
    }
  }

  /**
   * Load user profile with individual caching
   */
  private async loadUserProfile(userId: string): Promise<any> {
    const cacheKey = `profile:${userId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    const profile = await UserManagementService.getUserProfile(userId);
    this.setCache(cacheKey, profile);
    return profile;
  }

  /**
   * Load active AI voice for the user
   */
  private async loadActiveVoice(userId: string): Promise<any> {
    const cacheKey = `voice:${userId}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const db = getAdminDb();
      if (!db) {
        console.error("Firebase Admin DB not initialized");
        return null;
      }

      // First check user's custom voices
      const userVoicesSnap = await db
        .collection("users")
        .doc(userId)
        .collection("voices")
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!userVoicesSnap.empty) {
        const voice = userVoicesSnap.docs[0].data();
        this.setCache(cacheKey, voice);
        return voice;
      }

      // If no custom voice, check shared voices
      const sharedVoicesSnap = await db.collection("sharedVoices").where("isDefault", "==", true).limit(1).get();

      if (!sharedVoicesSnap.empty) {
        const voice = sharedVoicesSnap.docs[0].data();
        this.setCache(cacheKey, voice);
        return voice;
      }

      return null;
    } catch (error) {
      console.error("Failed to load voice:", error);
      return null;
    }
  }

  /**
   * Load user's negative keywords
   */
  private async loadNegativeKeywords(userId: string): Promise<string[]> {
    const cacheKey = `keywords:${userId}`;
    const cached = this.getFromCache<string[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const db = getAdminDb();
      if (!db) {
        console.error("Firebase Admin DB not initialized");
        return [];
      }

      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const keywords = userData?.negativeKeywords || [];

      this.setCache(cacheKey, keywords);
      return keywords;
    } catch (error) {
      console.error("Failed to load negative keywords:", error);
      return [];
    }
  }

  /**
   * Invalidate cache for a specific user
   */
  invalidateUserCache(userId: string): void {
    const keysToDelete = [`context:${userId}`, `profile:${userId}`, `voice:${userId}`, `keywords:${userId}`];

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }
}
