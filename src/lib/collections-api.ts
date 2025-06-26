/* eslint-disable complexity */
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { type Collection, type Video } from "./collections";
import { formatTimestamp } from "./collections-helpers";
import { db } from "./firebase";

export class CollectionsAPIService {
  private static readonly COLLECTIONS_PATH = "collections";
  private static readonly VIDEOS_PATH = "videos";

  /**
   * Get a collection by ID without user verification (for API use)
   */
  static async getCollectionById(collectionId: string): Promise<Collection | null> {
    try {
      const docRef = doc(db, this.COLLECTIONS_PATH, collectionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: collectionId,
        ...docSnap.data(),
        createdAt: formatTimestamp(docSnap.data().createdAt),
        updatedAt: formatTimestamp(docSnap.data().updatedAt),
      } as Collection;
    } catch (error) {
      console.error("Error fetching collection:", error);
      throw new Error("Failed to fetch collection");
    }
  }

  /**
   * Create default video components
   */
  private static getDefaultComponents() {
    return {
      hook: "",
      bridge: "",
      nugget: "",
      wta: "",
    };
  }

  /**
   * Create default content metadata
   */
  private static getDefaultContentMetadata(platform: string, author: string) {
    return {
      platform,
      author,
      description: "",
      source: "api",
      hashtags: [],
    };
  }

  /**
   * Create default insights
   */
  private static getDefaultInsights() {
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      saves: 0,
      engagementRate: 0,
    };
  }

  /**
   * Build basic video properties
   */
  private static buildBasicProps(video: Partial<Video>, collectionId: string) {
    return {
      url: video.url ?? "",
      title: video.title ?? `Video ${Date.now()}`,
      platform: video.platform ?? "external",
      thumbnailUrl: video.thumbnailUrl ?? "",
      author: video.author ?? "",
      transcript: video.transcript ?? "",
      visualContext: video.visualContext ?? "",
      fileSize: video.fileSize ?? 0,
      duration: video.duration ?? 0,
      userId: video.userId ?? "",
      collectionId,
      addedAt: new Date().toISOString(),
    };
  }

  /**
   * Build video data for API
   */
  private static buildVideoData(video: Partial<Video>, collectionId: string) {
    const basicProps = this.buildBasicProps(video, collectionId);

    return {
      ...basicProps,
      components: video.components ?? this.getDefaultComponents(),
      contentMetadata: video.contentMetadata ?? this.getDefaultContentMetadata(basicProps.platform, basicProps.author),
      insights: video.insights ?? this.getDefaultInsights(),
    };
  }

  /**
   * Add a video to a collection without user verification (for API use)
   */
  static async addVideoToCollection(collectionId: string, video: Partial<Video>): Promise<string> {
    try {
      const videoData = this.buildVideoData(video, collectionId);

      const docRef = await addDoc(collection(db, this.VIDEOS_PATH), {
        ...videoData,
        addedAt: serverTimestamp(),
      });

      await this.updateCollectionVideoCount(collectionId);
      return docRef.id;
    } catch (error) {
      console.error("Error adding video to collection:", error);
      throw new Error("Failed to add video to collection");
    }
  }

  /**
   * Get videos from a collection without user verification (for API use)
   */
  static async getCollectionVideos(collectionId: string): Promise<Video[]> {
    try {
      const q = query(
        collection(db, this.VIDEOS_PATH),
        where("collectionId", "==", collectionId),
        orderBy("addedAt", "desc"),
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        addedAt: formatTimestamp(doc.data().addedAt),
      })) as Video[];
    } catch (error) {
      console.error("Error fetching videos:", error);
      throw new Error("Failed to fetch videos");
    }
  }

  /**
   * Update collection video count without user verification (for API use)
   */
  private static async updateCollectionVideoCount(collectionId: string): Promise<void> {
    try {
      const videosQuery = query(collection(db, this.VIDEOS_PATH), where("collectionId", "==", collectionId));
      const videosSnapshot = await getDocs(videosQuery);
      const videoCount = videosSnapshot.size;

      const collectionRef = doc(db, this.COLLECTIONS_PATH, collectionId);
      await updateDoc(collectionRef, {
        videoCount,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating collection video count:", error);
      // Don't throw error as this is a secondary operation
    }
  }
}
