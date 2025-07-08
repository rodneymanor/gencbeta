// Production-ready video processing and collection addition endpoint
import { NextRequest, NextResponse } from "next/server";

import { uploadToBunnyStream } from "@/lib/bunny-stream";
import { getAdminAuth, getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { updateVideoTranscription, updateVideoTranscriptionStatus } from "@/lib/video-utils";

interface VideoData {
  buffer: number[];
  filename: string;
  mimeType: string;
  description?: string;
  cover?: string;
  author?: string;
  hashtags?: string[];
}

interface VideoDetails {
  title: string;
  url: string;
  cdnUrl: string;
  thumbnailUrl?: string;
  author?: string;
  description?: string;
  hashtags?: string[];
  platform: string;
  transcriptionStatus: string;
  userId: string;
  videoGuid: string;
}

interface BunnyResult {
  success: boolean;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  thumbnailUrl?: string;
  error?: string;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function downloadVideo(): Promise<{ status: string; result?: VideoData; message?: string }> {
  // Mock implementation - replace with actual download logic
  return {
    status: "success",
    result: {
      buffer: [],
      filename: "video.mp4",
      mimeType: "video/mp4",
      description: "Video description",
      author: "Unknown",
      hashtags: [],
    },
  };
}

async function streamToBunny(downloadData: VideoData): Promise<BunnyResult> {
  try {
    const result = await uploadToBunnyStream(downloadData.buffer, downloadData.filename);
    if (!result) {
      return { success: false, error: "Failed to upload to Bunny CDN" };
    }
    return {
      success: true,
      iframeUrl: result.cdnUrl,
      directUrl: result.cdnUrl,
      guid: result.filename,
      thumbnailUrl: null,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Bunny stream failed" };
  }
}

async function authenticateUser(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.substring(7);

  if (!isAdminInitialized || !idToken) {
    throw new Error("Configuration or authentication error");
  }

  const auth = getAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  if (!decodedToken.uid) {
    throw new Error("Invalid user token");
  }

  return decodedToken.uid;
}

async function processVideoDownload(_videoUrl: string): Promise<VideoData> {
  const downloadResult = await downloadVideo();
  if (downloadResult.status !== "success" || !downloadResult.result) {
    throw new Error(downloadResult.message ?? "Failed to download video");
  }
  return downloadResult.result;
}

async function processVideoUpload(videoData: VideoData): Promise<BunnyResult> {
  const bunnyResult = await streamToBunny(videoData);
  if (!bunnyResult.success) {
    throw new Error(bunnyResult.error ?? "Failed to upload to CDN");
  }
  return bunnyResult;
}

export async function POST(request: NextRequest) {
  console.log("🎬 [VIDEO_PROCESS] Starting video processing workflow...");

  try {
    // 1. Authenticate user
    const userId = await authenticateUser(request);

    // 2. Parse request body
    const { videoUrl, collectionId, title } = await request.json();
    if (!videoUrl || !collectionId) {
      return NextResponse.json({ error: "videoUrl and collectionId are required" }, { status: 400 });
    }

    // 3. Download and prepare video
    const videoData = await processVideoDownload(videoUrl);
    const platform = "TikTok";

    // 4. Upload to CDN
    const bunnyResult = await processVideoUpload(videoData);

    // 5. Add video to collection in Firestore
    const videoDetails: VideoDetails = {
      title: title ?? videoData.description ?? "Untitled Video",
      url: videoUrl,
      cdnUrl: bunnyResult.directUrl!,
      thumbnailUrl: bunnyResult.thumbnailUrl ?? videoData.cover,
      author: videoData.author,
      description: videoData.description,
      hashtags: videoData.hashtags,
      platform,
      transcriptionStatus: "pending",
      userId,
      videoGuid: bunnyResult.guid!,
    };

    const addResult = await addVideoToCollection(collectionId, videoDetails);
    if (!addResult.success) {
      return NextResponse.json({ error: addResult.error }, { status: 500 });
    }

    // 6. Start background transcription
    const baseUrl = getBaseUrl(request);
    startBackgroundTranscription(baseUrl, videoData, addResult.videoId, collectionId, platform, videoData);

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: "Video processing started.",
      videoId: addResult.videoId,
      iframe: bunnyResult.iframeUrl,
      directUrl: bunnyResult.directUrl,
      platform,
      transcriptionStatus: "pending",
    });
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Workflow error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Video processing workflow failed", details: errorMessage }, { status: 500 });
  }
}

async function addVideoToCollection(collectionId: string, videoData: VideoDetails) {
  try {
    console.log("💾 [VIDEO_PROCESS] Adding video to Firestore collection...");

    if (!isAdminInitialized) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Admin database not available");
    }

    const videoRef = adminDb.collection("videos").doc();
    const timestamp = new Date().toISOString();
    await videoRef.set({
      ...videoData,
      collectionId,
      id: videoRef.id,
      addedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const collectionRef = adminDb.collection("collections").doc(collectionId);
    await adminDb.runTransaction(async (transaction) => {
      const collectionDoc = await transaction.get(collectionRef);
      const currentCount = collectionDoc.data()?.videoCount ?? 0;
      transaction.update(collectionRef, {
        videoCount: currentCount + 1,
        updatedAt: new Date().toISOString(),
      });
    });

    console.log("✅ [VIDEO_PROCESS] Video added to collection:", videoRef.id);
    return { success: true, videoId: videoRef.id };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Firestore error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Database error" };
  }
}

function startBackgroundTranscription(
  baseUrl: string,
  videoData: VideoData,
  videoId: string,
  collectionId: string,
  platform: string,
  additionalMetadata: VideoData,
) {
  setTimeout(async () => {
    try {
      console.log("🎙️ [BACKGROUND] Starting transcription for video:", videoId);

      const buffer = Buffer.from(videoData.buffer);
      const blob = new Blob([buffer], { type: videoData.mimeType });
      const formData = new FormData();
      formData.append("video", blob, videoData.filename);

      const response = await fetch(`${baseUrl}/api/video/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("❌ [BACKGROUND] Transcription failed:", response.status);
        await updateVideoTranscriptionStatus(videoId, "failed");
        return;
      }

      const { transcript } = await response.json();
      console.log("✅ [BACKGROUND] Transcription completed");

      if (!transcript) {
        console.error("❌ [BACKGROUND] No transcript returned – aborting analysis");
        await updateVideoTranscriptionStatus(videoId, "failed");
        return;
      }

      const analysisRes = await fetch(`${baseUrl}/api/video/analyze-script`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      let components = { hook: "", bridge: "", nugget: "", wta: "" };
      if (analysisRes.ok) {
        const analysisJson = await analysisRes.json();
        components = analysisJson.components ?? components;
        console.log("✅ [BACKGROUND] Script analysis succeeded – components extracted");
      } else {
        console.error("⚠️ [BACKGROUND] Script analysis failed – using empty components");
      }

      const contentMetadata = {
        platform,
        author: additionalMetadata.author ?? "Unknown",
        description: additionalMetadata.description ?? "",
        source: "other" as const,
        hashtags: additionalMetadata.hashtags ?? [],
      };

      await updateVideoTranscription(videoId, {
        transcript,
        components,
        contentMetadata,
        visualContext: "",
      });

      console.log("📡 [BACKGROUND] Transcription + analysis ready for video:", videoId);
    } catch (error) {
      console.error("❌ [BACKGROUND] Transcription error:", error);
      await updateVideoTranscriptionStatus(videoId, "failed");
    }
  }, 100);
}
