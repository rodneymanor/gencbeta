import { adminDb } from "./firebase-admin";

export interface CreatorProfile {
  id?: string;
  username: string;
  displayName?: string;
  fullName?: string; // Full name from profile
  platform: "tiktok" | "instagram";
  profileImageUrl: string;
  bio?: string; // Profile caption/description
  website?: string; // Profile website URL
  externalUrl?: string; // Any external links in bio
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  isPrivate?: boolean;
  category?: string; // Business category if available
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  lastProcessed?: string;
  lastSynced?: string; // When profile data was last synced
  videoCount: number; // Count of videos, not the actual video data
  createdAt: string;
  updatedAt: string;
}

export class CreatorService {
  private static readonly CREATORS_COLLECTION = "creator_profiles";

  /**
   * Get all creator profiles
   */
  static async getAllCreators(): Promise<CreatorProfile[]> {
    try {
      console.log("📋 [CREATOR_SERVICE] Fetching all creator profiles from Firestore...");
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb
        .collection(this.CREATORS_COLLECTION)
        .orderBy("createdAt", "desc")
        .get();

      const creators: CreatorProfile[] = [];
      snapshot.forEach((doc: any) => {
        creators.push({
          id: doc.id,
          ...doc.data(),
        } as CreatorProfile);
      });

      console.log(`📊 [CREATOR_SERVICE] Retrieved ${creators.length} creator profiles`);
      return creators;
    } catch (error) {
      console.error("🔥 [CREATOR_SERVICE] Failed to fetch creators:", error);
      throw error;
    }
  }

  /**
   * Get creator by username and platform
   */
  static async getCreatorByUsernameAndPlatform(
    username: string,
    platform: "tiktok" | "instagram",
  ): Promise<CreatorProfile | null> {
    try {
      console.log(`🔍 [CREATOR_SERVICE] Looking for creator @${username} on ${platform}...`);
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb
        .collection(this.CREATORS_COLLECTION)
        .where("username", "==", username)
        .where("platform", "==", platform)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.log(`❌ [CREATOR_SERVICE] Creator @${username} on ${platform} not found`);
        return null;
      }

      const doc = snapshot.docs[0];
      const creator = {
        id: doc.id,
        ...doc.data(),
      } as CreatorProfile;

      console.log(`✅ [CREATOR_SERVICE] Found creator @${username} on ${platform}`);
      return creator;
    } catch (error) {
      console.error(`🔥 [CREATOR_SERVICE] Failed to find creator @${username}:`, error);
      throw error;
    }
  }

  /**
   * Create a new creator profile
   */
  static async createCreator(creatorData: Omit<CreatorProfile, "id" | "createdAt" | "updatedAt">): Promise<CreatorProfile> {
    try {
      console.log(`✨ [CREATOR_SERVICE] Creating new creator profile for @${creatorData.username}...`);
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const now = new Date().toISOString();
      
      // Filter out undefined values to prevent Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries(creatorData).filter(([_, value]) => value !== undefined)
      );

      const creatorWithTimestamps = {
        ...cleanedData,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await adminDb.collection(this.CREATORS_COLLECTION).add(creatorWithTimestamps);
      
      const newCreator: CreatorProfile = {
        id: docRef.id,
        ...creatorWithTimestamps,
      } as CreatorProfile;

      console.log(`✅ [CREATOR_SERVICE] Creator profile created with ID: ${docRef.id}`);
      return newCreator;
    } catch (error) {
      console.error(`🔥 [CREATOR_SERVICE] Failed to create creator @${creatorData.username}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing creator profile
   */
  static async updateCreator(
    creatorId: string,
    updates: Partial<Omit<CreatorProfile, "id" | "createdAt">>,
  ): Promise<void> {
    try {
      console.log(`🔄 [CREATOR_SERVICE] Updating creator profile ${creatorId}...`);
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      // Filter out undefined values to prevent Firestore errors
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const updateData = {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString(),
      };

      await adminDb.collection(this.CREATORS_COLLECTION).doc(creatorId).update(updateData);
      
      console.log(`✅ [CREATOR_SERVICE] Creator profile ${creatorId} updated successfully`);
    } catch (error) {
      console.error(`🔥 [CREATOR_SERVICE] Failed to update creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Get creator by ID
   */
  static async getCreatorById(creatorId: string): Promise<CreatorProfile | null> {
    try {
      console.log(`🔍 [CREATOR_SERVICE] Fetching creator profile ${creatorId}...`);
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      const snapshot = await adminDb.collection(this.CREATORS_COLLECTION).doc(creatorId).get();

      if (!snapshot.exists) {
        console.log(`❌ [CREATOR_SERVICE] Creator ${creatorId} not found`);
        return null;
      }

      const creator = {
        id: snapshot.id,
        ...snapshot.data(),
      } as CreatorProfile;

      console.log(`✅ [CREATOR_SERVICE] Found creator ${creatorId}`);
      return creator;
    } catch (error) {
      console.error(`🔥 [CREATOR_SERVICE] Failed to fetch creator ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Update video count for a creator
   */
  static async updateVideoCount(creatorId: string, videoCount: number): Promise<void> {
    try {
      console.log(`🔄 [CREATOR_SERVICE] Updating video count for creator ${creatorId} to ${videoCount}...`);
      
      if (!adminDb) {
        throw new Error("Firebase Admin SDK not initialized");
      }

      await adminDb.collection(this.CREATORS_COLLECTION).doc(creatorId).update({
        videoCount,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`✅ [CREATOR_SERVICE] Video count updated for creator ${creatorId}`);
    } catch (error) {
      console.error(`🔥 [CREATOR_SERVICE] Failed to update video count for creator ${creatorId}:`, error);
      throw error;
    }
  }
}