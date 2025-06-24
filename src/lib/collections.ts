import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export interface Video {
  id?: string;
  url: string;
  platform: "tiktok" | "instagram";
  title: string;
  description?: string;
  thumbnailUrl?: string;
  author?: string;
  duration?: number;
  createdAt: Timestamp | Date;
  metadata?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
}

export interface Collection {
  id?: string;
  title: string;
  description?: string;
  userId: string;
  videos: Video[];
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

const COLLECTIONS_COLLECTION = "collections";

export class CollectionsService {
  // Create a new collection
  static async createCollection(title: string, userId: string, description?: string): Promise<string> {
    if (!db) throw new Error("Firebase not initialized");

    const collectionData = {
      title,
      description: description ?? "",
      userId,
      videos: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS_COLLECTION), collectionData);
    return docRef.id;
  }

  // Get all collections for a user
  static async getUserCollections(userId: string): Promise<Collection[]> {
    if (!db) throw new Error("Firebase not initialized");

    const q = query(
      collection(db, COLLECTIONS_COLLECTION),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Collection[];
  }

  // Get a specific collection
  static async getCollection(collectionId: string): Promise<Collection | null> {
    if (!db) throw new Error("Firebase not initialized");

    const docRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Collection;
    }

    return null;
  }

  // Add video to collection
  static async addVideoToCollection(collectionId: string, videoData: Omit<Video, "id" | "createdAt">): Promise<void> {
    if (!db) throw new Error("Firebase not initialized");

    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      throw new Error("Collection not found");
    }

    const currentData = collectionDoc.data() as Collection;
    const newVideo: Video = {
      ...videoData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    const updatedVideos = [...currentData.videos, newVideo];

    await updateDoc(collectionRef, {
      videos: updatedVideos,
      updatedAt: serverTimestamp(),
    });
  }

  // Remove video from collection
  static async removeVideoFromCollection(collectionId: string, videoId: string): Promise<void> {
    if (!db) throw new Error("Firebase not initialized");

    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    const collectionDoc = await getDoc(collectionRef);

    if (!collectionDoc.exists()) {
      throw new Error("Collection not found");
    }

    const currentData = collectionDoc.data() as Collection;
    const updatedVideos = currentData.videos.filter((video) => video.id !== videoId);

    await updateDoc(collectionRef, {
      videos: updatedVideos,
      updatedAt: serverTimestamp(),
    });
  }

  // Update collection details
  static async updateCollection(
    collectionId: string,
    updates: Partial<Pick<Collection, "title" | "description">>,
  ): Promise<void> {
    if (!db) throw new Error("Firebase not initialized");

    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await updateDoc(collectionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  // Delete collection
  static async deleteCollection(collectionId: string): Promise<void> {
    if (!db) throw new Error("Firebase not initialized");

    const collectionRef = doc(db, COLLECTIONS_COLLECTION, collectionId);
    await deleteDoc(collectionRef);
  }

  // Validate video URL (TikTok or Instagram Reels)
  static validateVideoUrl(url: string): { isValid: boolean; platform?: "tiktok" | "instagram" } {
    const tiktokRegex = /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)/i;
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/reel/i;

    if (tiktokRegex.test(url)) {
      return { isValid: true, platform: "tiktok" };
    }

    if (instagramRegex.test(url)) {
      return { isValid: true, platform: "instagram" };
    }

    return { isValid: false };
  }
}
