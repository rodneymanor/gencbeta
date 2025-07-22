import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebase";
import { formatTimestamp, getAllCoaches, getCoachCreators, getAllUsers } from "./user-management-helpers";

/**
 * Helper function to ensure db is available
 */
function getDb() {
  if (!db) {
    throw new Error("Firebase is not initialized. Please check your configuration.");
  }
  return db;
}

export type UserRole = "super_admin" | "coach" | "creator";

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  coachId?: string; // For creators assigned to a coach
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CoachCreatorRelationship {
  id?: string;
  coachId: string;
  creatorId: string;
  assignedAt: string;
  isActive: boolean;
}

export class UserManagementService {
  private static readonly USERS_PATH = "user_profiles";
  private static readonly RELATIONSHIPS_PATH = "coach_creator_relationships";

  /**
   * Create or update user profile
   */
  static async createOrUpdateUserProfile(
    uid: string,
    email: string,
    displayName: string,
    role: UserRole = "creator",
    coachId?: string,
  ): Promise<string> {
    try {
      console.log("🔍 [USER_PROFILE] Starting createOrUpdateUserProfile for:", { uid, email, displayName, role });

      // Check if user profile already exists
      console.log("🔍 [USER_PROFILE] Checking if user profile exists...");
      const existingProfile = await this.getUserProfile(uid);

      if (existingProfile) {
        console.log("✅ [USER_PROFILE] User profile exists, updating:", existingProfile.id);
        // Update existing profile
        await this.updateUserProfile(uid, { displayName, role, coachId });
        return existingProfile.id!;
      }

      console.log("🔍 [USER_PROFILE] No existing profile found, creating new one...");

      // Create new profile
      const profileData: Omit<UserProfile, "id"> = {
        uid,
        email,
        displayName,
        role,
        coachId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("🔍 [USER_PROFILE] Profile data prepared:", profileData);
      console.log("🔍 [USER_PROFILE] Using collection path:", this.USERS_PATH);

      const docRef = await addDoc(collection(getDb(), this.USERS_PATH), {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ [USER_PROFILE] Document created successfully with ID:", docRef.id);

      // If this is a creator being assigned to a coach, create the relationship
      if (role === "creator" && coachId) {
        console.log("🔍 [USER_PROFILE] Creating coach-creator relationship...");
        try {
          const relationshipData: Omit<CoachCreatorRelationship, "id"> = {
            coachId,
            creatorId: uid,
            assignedAt: new Date().toISOString(),
            isActive: true,
          };

          await addDoc(collection(getDb(), this.RELATIONSHIPS_PATH), {
            ...relationshipData,
            assignedAt: serverTimestamp(),
          });
          console.log("✅ [USER_PROFILE] Coach-creator relationship created");
        } catch (error) {
          console.error("❌ [USER_PROFILE] Error creating coach-creator relationship:", error);
          // Don't throw error here as the user was already created successfully
        }
      }

      console.log("✅ [USER_PROFILE] User profile creation completed successfully");
      return docRef.id;
    } catch (error) {
      console.error("❌ [USER_PROFILE] Error creating/updating user profile:", error);
      console.error("❌ [USER_PROFILE] Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      });
      throw new Error("Failed to create or update user profile");
    }
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const q = query(collection(getDb(), this.USERS_PATH), where("uid", "==", uid), where("isActive", "==", true));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: formatTimestamp(doc.data().createdAt),
        updatedAt: formatTimestamp(doc.data().updatedAt),
        lastLoginAt: doc.data().lastLoginAt ? formatTimestamp(doc.data().lastLoginAt) : undefined,
      } as UserProfile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile");
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile) {
        throw new Error("User profile not found");
      }

      const docRef = doc(getDb(), this.USERS_PATH, profile.id!);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
      // Don't throw error for login tracking failure
    }
  }

  /**
   * Get all coaches (for super admin)
   */
  static async getAllCoaches(): Promise<UserProfile[]> {
    return getAllCoaches();
  }

  /**
   * Get all creators assigned to a coach
   */
  static async getCoachCreators(coachId: string): Promise<UserProfile[]> {
    return getCoachCreators(coachId);
  }

  /**
   * Get all users (for super admin)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    return getAllUsers();
  }

  /**
   * Assign creator to coach
   */
  static async assignCreatorToCoach(creatorUid: string, coachUid: string): Promise<void> {
    try {
      const [creatorProfile, coachProfile] = await Promise.all([
        this.getUserProfile(creatorUid),
        this.getUserProfile(coachUid),
      ]);

      if (!creatorProfile || creatorProfile.role !== "creator") {
        throw new Error("Creator not found or invalid role");
      }

      if (!coachProfile || coachProfile.role !== "coach") {
        throw new Error("Coach not found or invalid role");
      }

      // Update creator's coachId
      await this.updateUserProfile(creatorUid, { coachId: coachProfile.uid });

      // Create relationship record
      const relationshipData: Omit<CoachCreatorRelationship, "id"> = {
        coachId: coachProfile.uid,
        creatorId: creatorProfile.uid,
        assignedAt: new Date().toISOString(),
        isActive: true,
      };

      await addDoc(collection(getDb(), this.RELATIONSHIPS_PATH), {
        ...relationshipData,
        assignedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error assigning creator to coach:", error);
      throw new Error("Failed to assign creator to coach");
    }
  }

  /**
   * Remove creator from coach
   */
  static async removeCreatorFromCoach(creatorUid: string): Promise<void> {
    try {
      const creatorProfile = await this.getUserProfile(creatorUid);
      if (!creatorProfile || creatorProfile.role !== "creator") {
        throw new Error("Creator not found or invalid role");
      }

      // Remove coachId from creator
      await this.updateUserProfile(creatorUid, { coachId: undefined });

      // Deactivate relationship records
      const q = query(
        collection(getDb(), this.RELATIONSHIPS_PATH),
        where("creatorId", "==", creatorUid),
        where("isActive", "==", true),
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(getDb());

      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error removing creator from coach:", error);
      throw new Error("Failed to remove creator from coach");
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { isActive: false });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw new Error("Failed to deactivate user");
    }
  }

  /**
   * Check if user has permission to access coach's collections
   */
  static async canAccessCoachCollections(userUid: string, coachUid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userUid);
      if (!userProfile) {
        return false;
      }

      // Super admin can access everything
      if (userProfile.role === "super_admin") {
        return true;
      }

      // Coach can access their own collections
      if (userProfile.role === "coach" && userProfile.uid === coachUid) {
        return true;
      }

      // Creator can access their assigned coach's collections
      if (userProfile.role === "creator" && userProfile.coachId === coachUid) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking collection access:", error);
      return false;
    }
  }

  /**
   * Get user's accessible coach IDs
   */
  static async getUserAccessibleCoaches(userUid: string): Promise<string[]> {
    try {
      console.log("🔍 [USER_MGMT] Getting accessible coaches for user:", userUid);
      const userProfile = await this.getUserProfile(userUid);
      console.log("🔍 [USER_MGMT] User profile:", userProfile);

      if (!userProfile) {
        console.log("❌ [USER_MGMT] No user profile found");
        return [];
      }

      console.log("🔍 [USER_MGMT] User role:", userProfile.role);

      // Super admin can access all coaches
      if (userProfile.role === "super_admin") {
        const coaches = await this.getAllCoaches();
        console.log(
          "🔍 [USER_MGMT] Super admin - accessible coaches:",
          coaches.map((coach) => coach.uid),
        );
        return coaches.map((coach) => coach.uid);
      }

      // Coach can access their own collections
      if (userProfile.role === "coach") {
        console.log("🔍 [USER_MGMT] Coach - returning own UID:", [userProfile.uid]);
        return [userProfile.uid];
      }

      // Creator can access their assigned coach's collections
      if (userProfile.coachId) {
        console.log("🔍 [USER_MGMT] Creator - returning coach UID:", [userProfile.coachId]);
        return [userProfile.coachId];
      }

      console.log("❌ [USER_MGMT] No accessible coaches found for user");
      return [];
    } catch (error) {
      console.error("Error getting accessible coaches:", error);
      return [];
    }
  }
}
