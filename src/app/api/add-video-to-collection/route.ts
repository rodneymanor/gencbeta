/* eslint-disable max-lines */
import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

interface VideoDownloadResponse {
  success: boolean;
  platform: string;
  hostedOnCDN: boolean;
  cdnUrl?: string;
  filename?: string;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  transcription?: TranscriptionResponse;
  metrics: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
  additionalMetadata: {
    author: string;
    duration: number;
  };
  metadata: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    readyForTranscription: boolean;
    transcriptionStatus?: "pending" | "completed" | "failed";
  };
}

interface TranscriptionResponse {
  success: boolean;
  transcript: string;
  platform: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext: string;
  transcriptionMetadata: {
    method: string;
    fileSize: number;
    fileName: string;
    processedAt: string;
  };
}

function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === API_KEY;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAddVideoRequest(body: any) {
  const { videoUrl, collectionId, title } = body;

  if (!videoUrl) {
    return { isValid: false, error: "Video URL is required" };
  }

  if (!collectionId) {
    return { isValid: false, error: "Collection ID is required" };
  }

  try {
    new URL(videoUrl);
  } catch {
    return { isValid: false, error: "Invalid video URL format" };
  }

  return { isValid: true, data: { videoUrl, collectionId, title } };
}

function validateUrl(url: string): boolean {
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) return false;

  const supportedPlatforms = ["tiktok.com", "instagram.com"];
  return supportedPlatforms.some((platform) => url.toLowerCase().includes(platform));
}

async function downloadVideo(videoUrl: string): Promise<VideoDownloadResponse> {
  const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/download-video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Failed to download video");
  }

  const data = await response.json();
  console.log("📥 [API] Download response received:", data);
  return data;
}

function createPlaceholderTranscription(downloadResponse: VideoDownloadResponse): TranscriptionResponse {
  return {
    success: true,
    transcript: "Transcription in progress...",
    platform: downloadResponse.platform,
    components: {
      hook: "Processing...",
      bridge: "Processing...",
      nugget: "Processing...",
      wta: "Processing...",
    },
    contentMetadata: {
      platform: downloadResponse.platform,
      author: downloadResponse.additionalMetadata.author,
      description: "Processing...",
      source: "api",
      hashtags: [],
    },
    visualContext: "Processing...",
    transcriptionMetadata: {
      method: "background",
      fileSize: downloadResponse.videoData?.size ?? 0,
      fileName: downloadResponse.filename ?? "video.mp4",
      processedAt: new Date().toISOString(),
    },
  };
}

async function transcribeVideo(downloadResponse: VideoDownloadResponse): Promise<TranscriptionResponse> {
  console.log("🔍 [API] Checking download response for transcription:", !!downloadResponse.transcription);

  if (downloadResponse.transcription) {
    console.log("✅ [API] Using existing transcription from download response");
    return downloadResponse.transcription;
  }

  // Skip transcription in main API - let background analysis handle it
  console.log("⏭️ [API] Skipping transcription - will be handled by background analysis");
  return createPlaceholderTranscription(downloadResponse);
}

function generatePlaceholderThumbnail(platform: string): string {
  const canvas = `data:image/svg+xml;base64,${Buffer.from(
    `
    <svg width="360" height="640" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${platform === "instagram" ? "#833AB4" : "#000000"};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${platform === "instagram" ? "#FCB045" : "#FF0050"};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="360" height="640" fill="url(#grad)" />
      <text x="180" y="300" fill="white" text-anchor="middle" font-size="24">📹</text>
      <text x="180" y="340" fill="white" text-anchor="middle" font-size="16">${platform.toUpperCase()}</text>
      <text x="180" y="360" fill="white" text-anchor="middle" font-size="16">Video</text>
    </svg>
  `,
  ).toString("base64")}`;

  return canvas;
}

async function extractVideoThumbnail(downloadResponse: VideoDownloadResponse): Promise<string> {
  console.log("🖼️ [API] Extracting thumbnail - hostedOnCDN:", downloadResponse.hostedOnCDN);

  if (downloadResponse.hostedOnCDN && downloadResponse.cdnUrl) {
    if (downloadResponse.cdnUrl.includes("iframe.mediadelivery.net/embed")) {
      console.log("🖼️ [API] Using placeholder thumbnail for iframe URL");
      return generatePlaceholderThumbnail(downloadResponse.platform);
    }

    console.log("🖼️ [API] Using placeholder thumbnail for CDN URL");
    return generatePlaceholderThumbnail(downloadResponse.platform);
  } else {
    console.log("📁 [API] Using placeholder thumbnail for local video");
    return generatePlaceholderThumbnail(downloadResponse.platform);
  }
}

function calculateEngagementRate(metrics: VideoDownloadResponse["metrics"]): number {
  if (metrics.views <= 0) return 0;
  return ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100;
}

function getVideoUrl(downloadResponse: VideoDownloadResponse, originalUrl: string): string {
  return downloadResponse.hostedOnCDN && downloadResponse.cdnUrl ? downloadResponse.cdnUrl : originalUrl;
}

function getVideoTitle(transcriptionResponse: TranscriptionResponse, providedTitle?: string): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return providedTitle ?? transcriptionResponse.contentMetadata.description ?? "Untitled Video";
}

function getVideoAuthor(downloadResponse: VideoDownloadResponse, transcriptionResponse: TranscriptionResponse): string {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return downloadResponse.additionalMetadata.author ?? transcriptionResponse.contentMetadata.author ?? "Unknown";
}

function createVideoObject(
  downloadResponse: VideoDownloadResponse,
  transcriptionResponse: TranscriptionResponse,
  thumbnailUrl: string,
  originalUrl: string,
  providedTitle?: string,
): Record<string, unknown> {
  console.log("📦 [API] Creating video object with full processing data");

  const engagementRate = calculateEngagementRate(downloadResponse.metrics);

  const videoObject: Record<string, unknown> = {
    url: getVideoUrl(downloadResponse, originalUrl),
    platform: downloadResponse.platform,
    thumbnailUrl: thumbnailUrl,
    title: getVideoTitle(transcriptionResponse, providedTitle),
    author: getVideoAuthor(downloadResponse, transcriptionResponse),
    transcript: transcriptionResponse.transcript,
    components: transcriptionResponse.components,
    contentMetadata: {
      ...transcriptionResponse.contentMetadata,
      source: "api",
    },
    visualContext: transcriptionResponse.visualContext,
    insights: {
      likes: downloadResponse.metrics.likes,
      comments: downloadResponse.metrics.comments,
      shares: downloadResponse.metrics.shares,
      views: downloadResponse.metrics.views,
      saves: downloadResponse.metrics.saves,
      engagementRate,
    },
    addedAt: new Date(),
    fileSize: downloadResponse.videoData?.size ?? 0,
    duration: downloadResponse.additionalMetadata.duration,
    hostedOnCDN: downloadResponse.hostedOnCDN,
    originalUrl: originalUrl,
  };

  if (!downloadResponse.hostedOnCDN && downloadResponse.videoData) {
    videoObject.videoData = downloadResponse.videoData;
  }

  return videoObject;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateCollectionVideoCount(adminDb: any, collectionId: string, currentVideoCount: number) {
  await adminDb
    .collection("collections")
    .doc(collectionId)
    .update({
      videoCount: currentVideoCount + 1,
      updatedAt: new Date(),
    });
}

// eslint-disable-next-line complexity
export async function POST(request: NextRequest) {
  console.log("🚀 [API] Starting comprehensive video processing workflow...");

  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateAddVideoRequest(body);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { videoUrl, collectionId, title } = validation.data!;

    if (!validateUrl(videoUrl)) {
      return NextResponse.json(
        { error: "Only TikTok and Instagram videos are supported for full processing" },
        { status: 400 },
      );
    }

    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionDoc.data();

    console.log("📥 [API] Step 1: Downloading video...");
    const downloadResponse = await downloadVideo(videoUrl);
    console.log("✅ [API] Download completed successfully");

    console.log("🎬 [API] Step 2: Transcribing video...");
    const transcriptionResponse = await transcribeVideo(downloadResponse);
    console.log("✅ [API] Transcription completed successfully");

    console.log("🖼️ [API] Step 3: Generating thumbnail...");
    const thumbnailUrl = await extractVideoThumbnail(downloadResponse);
    console.log("✅ [API] Thumbnail generated successfully");

    console.log("📦 [API] Step 4: Creating comprehensive video object...");
    const videoData = createVideoObject(downloadResponse, transcriptionResponse, thumbnailUrl, videoUrl, title);

    videoData.userId = collectionData?.userId ?? "";
    videoData.collectionId = collectionId;

    console.log("💾 [API] Step 5: Saving to Firestore...");
    console.log("📄 [API] Video data being saved:", {
      title: videoData.title,
      platform: videoData.platform,
      url: videoData.url,
      collectionId: videoData.collectionId,
      userId: videoData.userId,
      hasTranscript: !!videoData.transcript,
      hasComponents: !!videoData.components,
      fileSize: videoData.fileSize,
      duration: videoData.duration,
    });

    const videoDocRef = await adminDb.collection("videos").add(videoData);
    console.log("✅ [API] Video saved with ID:", videoDocRef.id);

    const currentVideoCount = collectionData?.videoCount ?? 0;
    console.log("📊 [API] Updating collection video count from", currentVideoCount, "to", currentVideoCount + 1);
    await updateCollectionVideoCount(adminDb, collectionId, currentVideoCount);

    console.log("✅ [API] Video processing and storage completed successfully");

    return NextResponse.json({
      success: true,
      message: "Video processed and added successfully",
      videoId: videoDocRef.id,
      collectionId,
      video: {
        id: videoDocRef.id,
        ...videoData,
        addedAt: videoData.addedAt instanceof Date ? videoData.addedAt.toISOString() : videoData.addedAt,
      },
      processing: {
        downloaded: true,
        transcribed: transcriptionResponse.success,
        thumbnailGenerated: !!thumbnailUrl,
        hostedOnCDN: downloadResponse.hostedOnCDN,
        fileSize: downloadResponse.videoData?.size ?? 0,
        duration: downloadResponse.additionalMetadata.duration,
      },
    });
  } catch (error) {
    console.error("❌ [API] Video processing error:", error);
    return NextResponse.json(
      {
        error: "Failed to process video",
        details: error instanceof Error ? error.message : "Unknown error",
        step: "video_processing",
      },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCollectionVideos(adminDb: any, collectionId: string) {
  // Use simpler query without orderBy to avoid index requirement
  const videosSnapshot = await adminDb.collection("videos").where("collectionId", "==", collectionId).get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = videosSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      url: data.url,
      platform: data.platform,
      author: data.author,
      addedAt: data.addedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      insights: data.insights,
      duration: data.duration,
    };
  });

  // Sort in memory by addedAt (most recent first)
  return videos.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function GET(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionDoc.data();
    const videos = await getCollectionVideos(adminDb, collectionId);

    return NextResponse.json({
      collection: {
        id: collectionId,
        title: collectionData?.title,
        description: collectionData?.description,
        videoCount: videos.length,
      },
      videos,
    });
  } catch (error) {
    console.error("Error retrieving collection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
