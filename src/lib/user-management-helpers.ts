import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

import { db } from "./firebase";
import { type UserProfile } from "./user-management";

/**
 * Format timestamp helper
 */
export function formatTimestamp(timestamp: unknown): string {
  if (!timestamp) return new Date().toISOString();

  if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString();
  }

  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date((timestamp as { seconds: number }).seconds * 1000).toISOString();
  }

  return String(timestamp);
}

/**
 * Get all coaches (for super admin)
 */
export async function getAllCoaches(): Promise<UserProfile[]> {
  try {
    // Use simple query to avoid composite index requirement
    const q = query(collection(db, "user_profiles"), where("role", "==", "coach"), where("isActive", "==", true));

    const querySnapshot = await getDocs(q);
    const coaches = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt),
      lastLoginAt: doc.data().lastLoginAt ? formatTimestamp(doc.data().lastLoginAt) : undefined,
    })) as UserProfile[];

    // Sort in JavaScript to avoid composite index requirement
    return coaches.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  } catch (error) {
    console.error("Error fetching coaches:", error);
    throw new Error("Failed to fetch coaches");
  }
}

/**
 * Get all creators assigned to a coach
 */
export async function getCoachCreators(coachId: string): Promise<UserProfile[]> {
  try {
    // Use simple query to avoid composite index requirement
    const q = query(
      collection(db, "user_profiles"),
      where("role", "==", "creator"),
      where("coachId", "==", coachId),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);
    const creators = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt),
      lastLoginAt: doc.data().lastLoginAt ? formatTimestamp(doc.data().lastLoginAt) : undefined,
    })) as UserProfile[];

    // Sort in JavaScript to avoid composite index requirement
    return creators.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  } catch (error) {
    console.error("Error fetching coach creators:", error);
    throw new Error("Failed to fetch creators");
  }
}

/**
 * Get all users (for super admin)
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    // Use simple query to avoid composite index requirement
    const q = query(collection(db, "user_profiles"), where("isActive", "==", true));

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: formatTimestamp(doc.data().createdAt),
      updatedAt: formatTimestamp(doc.data().updatedAt),
      lastLoginAt: doc.data().lastLoginAt ? formatTimestamp(doc.data().lastLoginAt) : undefined,
    })) as UserProfile[];

    // Sort in JavaScript to avoid composite index requirement
    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw new Error("Failed to fetch users");
  }
}
