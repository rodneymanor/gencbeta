import { getAdminDb } from "./firebase-admin";

/**
 * Helper to verify collection ownership
 */
export async function verifyCollectionOwnership(
  userId: string,
  collectionId: string,
): Promise<{ exists: boolean; data?: Record<string, unknown> }> {
  // Handle special cases and invalid collection IDs
  if (!collectionId || collectionId.trim() === "" || collectionId === "all-videos") {
    return { exists: false };
  }

  const db = getAdminDb();
  const docRef = db.collection("collections").doc(collectionId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return { exists: false };
  }

  const data = docSnap.data();
  if (data?.userId !== userId) {
    throw new Error("Access denied");
  }

  return { exists: true, data };
}

/**
 * Helper to verify video ownership
 */
export async function verifyVideoOwnership(
  userId: string,
  videoId: string,
): Promise<{ exists: boolean; data?: Record<string, unknown> }> {
  const db = getAdminDb();
  const docRef = db.collection("videos").doc(videoId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return { exists: false };
  }

  const data = docSnap.data();
  if (data?.userId !== userId) {
    throw new Error("Access denied");
  }

  return { exists: true, data };
}

/**
 * Helper to update collection video count
 */
export async function updateCollectionVideoCount(
  batch: FirebaseFirestore.WriteBatch,
  collectionId: string,
  userId: string,
  increment: number,
): Promise<void> {
  if (collectionId === "all-videos") {
    return; // Don't update count for all-videos
  }

  const db = getAdminDb();
  const collectionRef = db.collection("collections").doc(collectionId);
  const collectionSnap = await collectionRef.get();

  if (collectionSnap.exists && collectionSnap.data()?.userId === userId) {
    const currentCount = collectionSnap.data()?.videoCount ?? 0;
    batch.update(collectionRef, {
      videoCount: Math.max(0, currentCount + increment),
      updatedAt: new Date(),
    });
  }
}

/**
 * Helper to delete videos in a collection
 */
export async function deleteCollectionVideos(
  batch: FirebaseFirestore.WriteBatch,
  userId: string,
  collectionId: string,
): Promise<void> {
  const db = getAdminDb();
  const videosQuery = db.collection("videos").where("userId", "==", userId).where("collectionId", "==", collectionId);

  const videosSnapshot = await videosQuery.get();
  videosSnapshot.docs.forEach((videoDoc) => {
    batch.delete(videoDoc.ref);
  });
}

/**
 * Helper to format timestamps
 */
export function formatTimestamp(timestamp: Record<string, unknown> | string): string {
  if (typeof timestamp === "string") {
    return timestamp;
  }

  const timestampWithToDate = timestamp as { toDate?: () => Date };
  return timestampWithToDate.toDate ? timestampWithToDate.toDate().toISOString() : String(timestamp);
}
