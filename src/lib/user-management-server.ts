import { format } from "date-fns";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import type { UserProfile } from "@/lib/user-management";

function formatTimestamp(ts: any): string {
  // Admin SDK stores timestamps as Firestore Timestamp objects
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export class UserManagementService {
  private static readonly USERS_PATH = "user_profiles";

  /**
   * Server-side version – fetch user profile with Admin privileges
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isAdminInitialized) {
      throw new Error("Firebase Admin not initialised on server");
    }
    const adminDb = getAdminDb();

    const snapshot = await adminDb
      .collection(this.USERS_PATH)
      .where("uid", "==", uid)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Record<string, any>;

    return {
      id: doc.id,
      ...data,
      createdAt: formatTimestamp(data.createdAt),
      updatedAt: formatTimestamp(data.updatedAt),
      lastLoginAt: data.lastLoginAt ? formatTimestamp(data.lastLoginAt) : undefined,
    } as UserProfile;
  }

  static async getUserAccessibleCoaches(userUid: string): Promise<string[]> {
    if (!isAdminInitialized) {
      throw new Error("Firebase Admin not initialised on server");
    }
    const adminDb = getAdminDb();
    try {
      console.log("🔍 [USER_MGMT_SERVER] Getting accessible coaches for user:", userUid);

      const userProfile = await this.getUserProfile(userUid);
      if (!userProfile) {
        console.log("❌ [USER_MGMT_SERVER] No user profile found");
        return [];
      }

      // Super admin: return all coach UIDs
      if (userProfile.role === "super_admin") {
        const coachesSnapshot = await adminDb
          .collection(this.USERS_PATH)
          .where("role", "==", "coach")
          .where("isActive", "==", true)
          .get();
        return coachesSnapshot.docs.map((doc) => doc.data().uid);
      }

      // Coach: can access own UID
      if (userProfile.role === "coach") {
        return [userProfile.uid];
      }

      // Creator: can access assigned coachId if present
      if (userProfile.coachId) {
        return [userProfile.coachId];
      }

      return [];
    } catch (error) {
      console.error("❌ [USER_MGMT_SERVER] Error getting accessible coaches:", error);
      return [];
    }
  }
}
