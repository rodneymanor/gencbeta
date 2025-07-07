import { UserProfile as UserProfileType, CoachCreatorRelationship as CoachCreatorRelationshipType } from "@/types/user";

import { getAdminDb } from "./firebase-admin";
import { formatTimestamp, getAllCoaches, getCoachCreators, getAllUsers } from "./user-management-helpers";

export type UserRole = "super_admin" | "coach" | "creator";

export type UserProfile = UserProfileType;
export type CoachCreatorRelationship = CoachCreatorRelationshipType;

export class UserManagementService {
  private static readonly USERS_PATH = "user_profiles";
  private static readonly RELATIONSHIPS_PATH = "coach_creator_relationships";

  static async createOrUpdateUserProfile(
    uid: string,
    email: string,
    displayName: string,
    role: UserRole = "creator",
    coachId?: string,
  ): Promise<string> {
    try {
      console.log("🔍 [USER_PROFILE] Starting createOrUpdateUserProfile for:", { uid, email, displayName, role });

      const existingProfile = await this.getUserProfile(uid);

      if (existingProfile) {
        console.log("✅ [USER_PROFILE] User profile exists, updating:", existingProfile.id);
        await this.updateUserProfile(uid, { displayName, role, coachId });
        return existingProfile.id!;
      }

      console.log("🔍 [USER_PROFILE] No existing profile found, creating new one...");

      const db = getAdminDb();
      const now = new Date();

      const profileData: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> = {
        uid,
        email,
        displayName,
        role,
        coachId,
        isActive: true,
      };

      const docRef = await db.collection(this.USERS_PATH).add({
        ...profileData,
        createdAt: now,
        updatedAt: now,
      });

      console.log("✅ [USER_PROFILE] Document created successfully with ID:", docRef.id);

      if (role === "creator" && coachId) {
        console.log("🔍 [USER_PROFILE] Creating coach-creator relationship...");
        try {
          const relationshipData: Omit<CoachCreatorRelationship, "id" | "assignedAt"> = {
            coachId,
            creatorId: uid,
            isActive: true,
          };
          await db.collection(this.RELATIONSHIPS_PATH).add({
            ...relationshipData,
            assignedAt: now,
          });
          console.log("✅ [USER_PROFILE] Coach-creator relationship created");
        } catch (error) {
          console.error("❌ [USER_PROFILE] Error creating coach-creator relationship:", error);
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

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    console.time("getUserProfile");
    console.log(`🔍 [USER_PROFILE] getUserProfile called with uid: ${uid}`);
    try {
      const db = getAdminDb();
      const querySnapshot = await db.collection(this.USERS_PATH).where("uid", "==", uid).get();

      if (querySnapshot.empty) {
        console.log("❌ [USER_PROFILE] No user profile found for uid:", uid);
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const profile = {
        id: doc.id,
        ...data,
        createdAt: formatTimestamp(data.createdAt),
        updatedAt: formatTimestamp(data.updatedAt),
        lastLoginAt: data.lastLoginAt ? formatTimestamp(data.lastLoginAt) : undefined,
      } as UserProfile;

      console.log("✅ [USER_PROFILE] Found user profile:", {
        id: profile.id,
        role: profile.role,
        email: profile.email,
      });
      return profile;
    } catch (error) {
      console.error(`❌ [USER_PROFILE] Error fetching user profile:`, error);
      throw new Error("Failed to fetch user profile");
    } finally {
      console.timeEnd("getUserProfile");
    }
  }

  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profile = await this.getUserProfile(uid);
      if (!profile || !profile.id) {
        throw new Error("User profile not found or has no ID");
      }
      const db = getAdminDb();
      await db
        .collection(this.USERS_PATH)
        .doc(profile.id)
        .update({
          ...updates,
          updatedAt: new Date(),
        });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  }

  static async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, {
        lastLoginAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  static async getAllCoaches(): Promise<UserProfile[]> {
    return getAllCoaches();
  }

  static async getCoachCreators(coachId: string): Promise<UserProfile[]> {
    return getCoachCreators(coachId);
  }

  static async getAllUsers(): Promise<UserProfile[]> {
    return getAllUsers();
  }

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

      await this.updateUserProfile(creatorUid, { coachId: coachProfile.uid });

      const db = getAdminDb();
      const relationshipData: Omit<CoachCreatorRelationship, "id" | "assignedAt"> = {
        coachId: coachProfile.uid,
        creatorId: creatorUid,
        isActive: true,
      };
      await db.collection(this.RELATIONSHIPS_PATH).add({
        ...relationshipData,
        assignedAt: new Date(),
      });
    } catch (error) {
      console.error("Error assigning creator to coach:", error);
      throw new Error("Failed to assign creator to coach");
    }
  }

  static async removeCreatorFromCoach(creatorUid: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(creatorUid);
      if (!profile || !profile.coachId) return;

      await this.updateUserProfile(creatorUid, { coachId: undefined });

      const db = getAdminDb();
      const querySnapshot = await db
        .collection(this.RELATIONSHIPS_PATH)
        .where("creatorId", "==", creatorUid)
        .where("isActive", "==", true)
        .get();

      const batch = db.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isActive: false });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error removing creator from coach:", error);
      throw new Error("Failed to remove creator from coach");
    }
  }

  static async deactivateUser(uid: string): Promise<void> {
    try {
      await this.updateUserProfile(uid, { isActive: false });
    } catch (error) {
      console.error("Error deactivating user:", error);
      throw new Error("Failed to deactivate user");
    }
  }

  static async canAccessCoachCollections(userUid: string, coachUid: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(userUid);
      if (!userProfile) return false;

      if (userProfile.role === "super_admin") return true;
      if (userProfile.role === "coach") return userProfile.uid === coachUid;
      if (userProfile.role === "creator") return userProfile.coachId === coachUid;

      return false;
    } catch (error) {
      console.error("Error checking coach collection access:", error);
      return false;
    }
  }

  static async getUserAccessibleCoaches(userUid: string): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile(userUid);
      if (!userProfile) return [];

      if (userProfile.role === "super_admin") {
        const coaches = await this.getAllCoaches();
        return coaches.map((c) => c.uid);
      }
      if (userProfile.role === "coach") {
        return [userProfile.uid];
      }
      if (userProfile.role === "creator" && userProfile.coachId) {
        return [userProfile.coachId];
      }
      return [];
    } catch (error) {
      console.error("Error getting user accessible coaches:", error);
      return [];
    }
  }
}
