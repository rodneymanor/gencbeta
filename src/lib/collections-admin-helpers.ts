// Admin helpers for server-side collection operations
// This file should ONLY be imported by API routes, never by client-side code

import { getAdminDb, isAdminInitialized } from "./firebase-admin";

/**
 * Admin helper to verify collection ownership using Admin SDK (bypasses security rules)
 * WARNING: Only use this in API routes, never in client-side code
 */
export async function verifyCollectionOwnershipAdmin(
  userId: string,
  collectionId: string,
): Promise<{ exists: boolean; data?: Record<string, unknown> }> {
  const adminDb = getAdminDb();

  if (!isAdminInitialized || !adminDb) {
    throw new Error("Firebase Admin SDK not initialized");
  }

  // Handle special cases and invalid collection IDs
  if (!collectionId || collectionId.trim() === "" || collectionId === "all-videos") {
    return { exists: false };
  }

  try {
    const docRef = adminDb.collection("collections").doc(collectionId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { exists: false };
    }

    const data = docSnap.data();
    if (data?.userId !== userId) {
      throw new Error("Access denied");
    }

    return { exists: true, data };
  } catch (error) {
    console.error("Error verifying collection ownership with admin SDK:", error);
    throw error;
  }
}
