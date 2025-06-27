import { getAdminDb, isAdminInitialized } from "./firebase-admin";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: "super_admin" | "admin" | "coach" | "creator" | "user";
  createdAt: string;
  updatedAt: string;
}

export class UserManagementAdminService {
  private static readonly USER_PROFILES_PATH = "user_profiles";

  /**
   * Get user profile using Admin SDK
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN] Getting user profile for:", uid);

      // Query by UID field (not document ID)
      const querySnapshot = await adminDb
        .collection(this.USER_PROFILES_PATH)
        .where("uid", "==", uid)
        .where("isActive", "==", true)
        .get();

      if (querySnapshot.empty) {
        console.log("❌ [ADMIN] User profile not found:", uid);
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log("✅ [ADMIN] User profile found:", { uid, role: userData?.role });

      return {
        uid: userData.uid,
        ...userData,
      } as UserProfile;
    } catch (error) {
      console.error("❌ [ADMIN] Error fetching user profile:", error);
      throw new Error("Failed to fetch user profile");
    }
  }

  /**
   * Get all coaches using Admin SDK
   */
  static async getAllCoaches(): Promise<string[]> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN] Getting all coaches");

      const coachesQuery = await adminDb.collection(this.USER_PROFILES_PATH).where("role", "==", "coach").get();

      const coaches = coachesQuery.docs.map((doc) => doc.id);
      console.log("✅ [ADMIN] Found coaches:", coaches.length);

      return coaches;
    } catch (error) {
      console.error("❌ [ADMIN] Error fetching coaches:", error);
      throw new Error("Failed to fetch coaches");
    }
  }

  /**
   * Get accessible coaches for a user using Admin SDK
   */
  static async getUserAccessibleCoaches(userId: string): Promise<string[]> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN] Getting accessible coaches for user:", userId);

      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        console.log("❌ [ADMIN] User profile not found");
        return [];
      }

      console.log("🔍 [ADMIN] User role:", userProfile.role);

      // Super admins can access all coaches
      if (userProfile.role === "super_admin") {
        const allCoaches = await this.getAllCoaches();
        console.log("🔍 [ADMIN] Super admin - accessible coaches:", allCoaches);
        return allCoaches;
      }

      // Regular users can only access coaches they're assigned to
      // For now, return the user's own ID if they're a coach
      if (userProfile.role === "coach") {
        return [userId];
      }

      // Other roles have no accessible coaches by default
      return [];
    } catch (error) {
      console.error("❌ [ADMIN] Error getting accessible coaches:", error);
      throw new Error("Failed to get accessible coaches");
    }
  }

  /**
   * Update user profile using Admin SDK
   */
  static async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN] Updating user profile:", uid, updates);

      // First, find the document by UID field (not document ID)
      const querySnapshot = await adminDb
        .collection(this.USER_PROFILES_PATH)
        .where("uid", "==", uid)
        .where("isActive", "==", true)
        .get();

      if (querySnapshot.empty) {
        throw new Error(`User profile not found for UID: ${uid}`);
      }

      // Get the actual document ID
      const userDoc = querySnapshot.docs[0];
      const documentId = userDoc.id;

      console.log("🔍 [ADMIN] Found user document ID:", documentId);

      // Update using the actual document ID
      await adminDb
        .collection(this.USER_PROFILES_PATH)
        .doc(documentId)
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        });

      console.log("✅ [ADMIN] User profile updated successfully");
    } catch (error) {
      console.error("❌ [ADMIN] Error updating user profile:", error);
      throw new Error("Failed to update user profile");
    }
  }

  /**
   * Create user profile using Admin SDK (for server-side operations)
   */
  static async createUserProfile(
    uid: string,
    email: string,
    displayName: string,
    role: "super_admin" | "admin" | "coach" | "creator" | "user" = "creator",
    coachId?: string,
  ): Promise<string> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    try {
      console.log("🔍 [ADMIN] Creating user profile for:", { uid, email, displayName, role });

      // Check if user profile already exists
      const existingProfile = await this.getUserProfile(uid);
      if (existingProfile) {
        console.log("✅ [ADMIN] User profile already exists, returning existing ID");
        return uid; // Return the UID as document ID for consistency
      }

      // Create new profile data
      const profileData = {
        uid,
        email,
        displayName,
        role,
        coachId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("🔍 [ADMIN] Creating document with data:", profileData);

      // Create document using UID as document ID for easier access
      await adminDb.collection(this.USER_PROFILES_PATH).doc(uid).set(profileData);

      console.log("✅ [ADMIN] User profile created successfully with UID as document ID");

      // If this is a creator being assigned to a coach, create the relationship
      if (role === "creator" && coachId) {
        console.log("🔍 [ADMIN] Creating coach-creator relationship...");
        try {
          const relationshipData = {
            coachId,
            creatorId: uid,
            assignedAt: new Date().toISOString(),
            isActive: true,
          };

          await adminDb.collection("coach_creator_relationships").add(relationshipData);
          console.log("✅ [ADMIN] Coach-creator relationship created");
        } catch (error) {
          console.error("❌ [ADMIN] Error creating coach-creator relationship:", error);
          // Don't throw error here as the user was already created successfully
        }
      }

      return uid;
    } catch (error) {
      console.error("❌ [ADMIN] Error creating user profile:", error);
      throw new Error("Failed to create user profile");
    }
  }
}
