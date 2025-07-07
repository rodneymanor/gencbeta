import { getAdminDb } from "./firebase-admin";
import { type UserProfile } from "./user-management";

/**
 * Format timestamp helper
 */
export function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();

  if (typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }

  if (typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000).toISOString();
  }

  return String(timestamp);
}

/**
 * Get all coaches (for super admin)
 */
export async function getAllCoaches(): Promise<UserProfile[]> {
  try {
    console.log("🔍 [USER_HELPERS] Getting all coaches");
    const db = getAdminDb();
    const q = db.collection("user_profiles").where("role", "==", "coach").orderBy("displayName", "asc");
    const querySnapshot = await q.get();
    const coaches = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserProfile,
    );
    console.log("✅ [USER_HELPERS] Found coaches:", coaches.length);
    return coaches;
  } catch (error) {
    console.error("❌ [USER_HELPERS] Error getting all coaches:", error);
    return [];
  }
}

/**
 * Get all creators assigned to a coach
 */
export async function getCoachCreators(coachId: string): Promise<UserProfile[]> {
  try {
    console.log("🔍 [USER_HELPERS] Getting creators for coach:", coachId);
    const db = getAdminDb();
    const q = db
      .collection("user_profiles")
      .where("role", "==", "creator")
      .where("coachId", "==", coachId)
      .orderBy("displayName", "asc");
    const querySnapshot = await q.get();
    const creators = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserProfile,
    );
    console.log("✅ [USER_HELPERS] Found creators:", creators.length);
    return creators;
  } catch (error) {
    console.error("❌ [USER_HELPERS] Error getting coach creators:", error);
    return [];
  }
}

/**
 * Get all users (for super admin)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    console.log("🔍 [USER_HELPERS] Getting all users");
    const db = getAdminDb();
    const q = db.collection("user_profiles").orderBy("displayName", "asc");
    const querySnapshot = await q.get();
    const users = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as UserProfile,
    );
    console.log("✅ [USER_HELPERS] Found users:", users.length);
    return users;
  } catch (error) {
    console.error("❌ [USER_HELPERS] Error getting all users:", error);
    return [];
  }
}
