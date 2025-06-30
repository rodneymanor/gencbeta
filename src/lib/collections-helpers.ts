import { collection, doc, getDoc, getDocs, query, where, serverTimestamp, WriteBatch } from "firebase/firestore";

import { db } from "./firebase";

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

  const docRef = doc(db, "collections", collectionId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { exists: false };
  }

  const data = docSnap.data();
  if (data.userId !== userId) {
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
  const docRef = doc(db, "videos", videoId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { exists: false };
  }

  const data = docSnap.data();
  if (data.userId !== userId) {
    throw new Error("Access denied");
  }

  return { exists: true, data };
}

/**
 * Helper to update collection video count
 */
export async function updateCollectionVideoCount(
  batch: WriteBatch,
  collectionId: string,
  userId: string,
  increment: number,
): Promise<void> {
  if (collectionId === "all-videos") {
    return; // Don't update count for all-videos
  }

  const collectionRef = doc(db, "collections", collectionId);
  const collectionSnap = await getDoc(collectionRef);

  if (collectionSnap.exists() && collectionSnap.data().userId === userId) {
    const currentCount = collectionSnap.data().videoCount ?? 0;
    batch.update(collectionRef, {
      videoCount: Math.max(0, currentCount + increment),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Helper to delete videos in a collection
 */
export async function deleteCollectionVideos(batch: WriteBatch, userId: string, collectionId: string): Promise<void> {
  const videosQuery = query(
    collection(db, "videos"),
    where("userId", "==", userId),
    where("collectionId", "==", collectionId),
  );

  const videosSnapshot = await getDocs(videosQuery);
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
