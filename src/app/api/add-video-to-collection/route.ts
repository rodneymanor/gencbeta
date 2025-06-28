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
  thumbnailUrl?: string;
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

function getBaseUrl(request: NextRequest): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // In development, use the request's host to get the correct port
  const host = request.headers.get("host");
  if (host) {
    return `http://${host}`;
  }

  // Fallback to default
  return "http://localhost:3000";
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

async function downloadVideo(videoUrl: string, request: NextRequest): Promise<VideoDownloadResponse> {
  const baseUrl = getBaseUrl(request);

  // Check if it's Instagram - use optimized streaming
  if (videoUrl.toLowerCase().includes("instagram.com")) {
    console.log("🌊 [API] Using optimized Instagram-to-Bunny workflow...");

    try {
      const response = await fetch(`${baseUrl}/api/video/instagram-to-bunny`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl }),
      });

      if (!response.ok) {
        console.log("❌ [API] Optimized workflow failed, falling back to traditional download...");
        // Fall back to traditional download
        return await traditionalDownload(videoUrl, baseUrl);
      }

      const streamData = await response.json();
      console.log("✅ [API] Optimized workflow response received:", streamData);

      // Convert optimized response to expected format
      return {
        success: true,
        platform: streamData.video.platform,
        hostedOnCDN: true,
        cdnUrl: streamData.video.iframeUrl,
        filename: streamData.video.filename,
        thumbnailUrl: streamData.video.thumbnailUrl,
        metrics: {
          likes: streamData.metadata.likes,
          views: streamData.metadata.views,
          shares: streamData.metadata.shares,
          comments: streamData.metadata.comments,
          saves: streamData.metadata.saves,
        },
        additionalMetadata: {
          author: streamData.metadata.author,
          duration: streamData.metadata.duration,
        },
        metadata: {
          originalUrl: videoUrl,
          platform: streamData.video.platform,
          downloadedAt: streamData.metadata.processedAt,
          readyForTranscription: true,
          transcriptionStatus: "processing",
        },
      };
    } catch (error) {
      console.error("❌ [API] Optimized workflow error, falling back:", error);
      return await traditionalDownload(videoUrl, baseUrl);
    }
  }

  // Use traditional download for non-Instagram or fallback
  return await traditionalDownload(videoUrl, baseUrl);
}

async function traditionalDownload(videoUrl: string, baseUrl: string): Promise<VideoDownloadResponse> {
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
  console.log("📥 [API] Traditional download response received:", data);
  console.log("🖼️ [API] Thumbnail URL from traditional download:", data.thumbnailUrl ? "✅ Found" : "❌ Not found");
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
  console.log("🖼️ [API] Extracting thumbnail - checking for real thumbnail URL...");

  // First priority: Use actual thumbnail URL from the API response
  if (downloadResponse.thumbnailUrl) {
    console.log("✅ [API] Using real thumbnail from API response:", downloadResponse.thumbnailUrl);
    return downloadResponse.thumbnailUrl;
  }

  // Fallback: Generate placeholder thumbnail
  console.log("⚠️ [API] No real thumbnail found, generating placeholder for platform:", downloadResponse.platform);
  return generatePlaceholderThumbnail(downloadResponse.platform);
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
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🚀 [${requestId}] Starting video processing workflow at ${new Date().toISOString()}`);

  try {
    // Step 1: Authentication
    console.log(`🔐 [${requestId}] Step 1: Validating API key...`);
    if (!validateApiKey(request)) {
      console.log(`❌ [${requestId}] Authentication failed`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`✅ [${requestId}] Authentication successful`);

    // Step 2: Request validation
    console.log(`📋 [${requestId}] Step 2: Validating request body...`);
    const body = await request.json();
    const validation = validateAddVideoRequest(body);

    if (!validation.isValid) {
      console.log(`❌ [${requestId}] Request validation failed: ${validation.error}`);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { videoUrl, collectionId, title } = validation.data!;
    console.log(`✅ [${requestId}] Request validation successful - URL: ${videoUrl}, Collection: ${collectionId}`);

    // Step 3: URL validation
    console.log(`🔗 [${requestId}] Step 3: Validating video URL...`);
    if (!validateUrl(videoUrl)) {
      console.log(`❌ [${requestId}] URL validation failed - unsupported platform`);
      return NextResponse.json(
        { error: "Only TikTok and Instagram videos are supported for full processing" },
        { status: 400 },
      );
    }
    console.log(`✅ [${requestId}] URL validation successful`);

    // Step 4: Firebase connection
    console.log(`🔥 [${requestId}] Step 4: Connecting to Firebase...`);
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      console.log(`❌ [${requestId}] Firebase connection failed - SDK not configured`);
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }
    console.log(`✅ [${requestId}] Firebase connection successful`);

    // Step 5: Collection verification
    console.log(`📁 [${requestId}] Step 5: Verifying collection exists...`);
    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists) {
      console.log(`❌ [${requestId}] Collection not found: ${collectionId}`);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionDoc.data();
    console.log(
      `✅ [${requestId}] Collection verified - Title: ${collectionData?.title}, Owner: ${collectionData?.userId}`,
    );

    // All validations passed - return immediate success response
    const validationTime = Date.now() - startTime;
    console.log(`🎉 [${requestId}] All validations passed in ${validationTime}ms - returning immediate response`);

    // Start background processing (non-blocking)
    setTimeout(() => {
      processVideoInBackground(requestId, videoUrl, collectionId, title, collectionData, adminDb, request);
    }, 0);

    // Return immediate success response
    return NextResponse.json({
      success: true,
      message: "Video processing has started successfully",
      requestId: requestId,
      status: "processing",
      estimatedTime: "30-60 seconds",
      collectionId: collectionId,
      videoUrl: videoUrl,
      title: title ?? "Auto-generated title",
      timestamp: new Date().toISOString(),
      validationTime: `${validationTime}ms`,
    });
  } catch (error) {
    console.error(`❌ [${requestId}] Critical error during validation:`, error);
    return NextResponse.json(
      {
        error: "Failed to process video request",
        details: error instanceof Error ? error.message : "Unknown error",
        requestId: requestId,
        step: "validation",
      },
      { status: 500 },
    );
  }
}

// Background processing function with comprehensive logging
async function processVideoInBackground(
  requestId: string,
  videoUrl: string,
  collectionId: string,
  title: string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectionData: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminDb: any,
  request: NextRequest,
) {
  const backgroundStartTime = Date.now();

  try {
    console.log(`🔄 [${requestId}] Background processing started at ${new Date().toISOString()}`);

    // Step 6: Download video
    console.log(`📥 [${requestId}] Step 6: Starting video download...`);
    const downloadStartTime = Date.now();
    const downloadResponse = await downloadVideo(videoUrl, request);
    const downloadTime = Date.now() - downloadStartTime;
    console.log(`✅ [${requestId}] Video download completed in ${downloadTime}ms`);
    console.log(`📊 [${requestId}] Download details:`, {
      platform: downloadResponse.platform,
      hostedOnCDN: downloadResponse.hostedOnCDN,
      filename: downloadResponse.filename,
      hasVideoData: !!downloadResponse.videoData,
      author: downloadResponse.additionalMetadata.author,
      duration: downloadResponse.additionalMetadata.duration,
      metrics: downloadResponse.metrics,
    });

    // Step 7: Transcribe video
    console.log(`🎬 [${requestId}] Step 7: Starting video transcription...`);
    const transcribeStartTime = Date.now();
    const transcriptionResponse = await transcribeVideo(downloadResponse);
    const transcribeTime = Date.now() - transcribeStartTime;
    console.log(`✅ [${requestId}] Video transcription completed in ${transcribeTime}ms`);
    console.log(`📝 [${requestId}] Transcription details:`, {
      success: transcriptionResponse.success,
      transcriptLength: transcriptionResponse.transcript.length,
      hasComponents: !!(transcriptionResponse.components.hook && transcriptionResponse.components.bridge),
      platform: transcriptionResponse.platform,
      method: transcriptionResponse.transcriptionMetadata?.method,
    });

    // Step 8: Generate thumbnail
    console.log(`🖼️ [${requestId}] Step 8: Generating thumbnail...`);
    const thumbnailStartTime = Date.now();
    const thumbnailUrl = await extractVideoThumbnail(downloadResponse);
    const thumbnailTime = Date.now() - thumbnailStartTime;
    console.log(`✅ [${requestId}] Thumbnail generation completed in ${thumbnailTime}ms`);
    console.log(`🖼️ [${requestId}] Thumbnail URL: ${thumbnailUrl}`);

    // Step 9: Create video object
    console.log(`📦 [${requestId}] Step 9: Creating comprehensive video object...`);
    const videoData = createVideoObject(downloadResponse, transcriptionResponse, thumbnailUrl, videoUrl, title);

    videoData.userId = collectionData?.userId ?? "";
    videoData.collectionId = collectionId;
    videoData.processingMetadata = {
      requestId: requestId,
      processedAt: new Date().toISOString(),
      processingTimes: {
        download: `${downloadTime}ms`,
        transcription: `${transcribeTime}ms`,
        thumbnail: `${thumbnailTime}ms`,
      },
    };

    console.log(`📄 [${requestId}] Video object created:`, {
      title: videoData.title,
      platform: videoData.platform,
      url: videoData.url,
      author: videoData.author,
      collectionId: videoData.collectionId,
      userId: videoData.userId,
      hasTranscript: !!videoData.transcript,
      hasComponents: !!videoData.components,
      fileSize: videoData.fileSize,
      duration: videoData.duration,
      thumbnailUrl: videoData.thumbnailUrl,
      engagementRate: videoData.engagementRate,
    });

    // Step 10: Save to Firestore
    console.log(`💾 [${requestId}] Step 10: Saving video to Firestore...`);
    const saveStartTime = Date.now();
    const videoDocRef = await adminDb.collection("videos").add(videoData);
    const saveTime = Date.now() - saveStartTime;
    console.log(`✅ [${requestId}] Video saved to Firestore in ${saveTime}ms with ID: ${videoDocRef.id}`);

    // Step 11: Update collection video count
    console.log(`📊 [${requestId}] Step 11: Updating collection video count...`);
    const currentVideoCount = collectionData?.videoCount ?? 0;
    const updateStartTime = Date.now();
    await updateCollectionVideoCount(adminDb, collectionId, currentVideoCount);
    const updateTime = Date.now() - updateStartTime;
    console.log(
      `✅ [${requestId}] Collection video count updated in ${updateTime}ms: ${currentVideoCount} → ${currentVideoCount + 1}`,
    );

    const totalProcessingTime = Date.now() - backgroundStartTime;
    console.log(`🎉 [${requestId}] PROCESSING COMPLETED SUCCESSFULLY in ${totalProcessingTime}ms`);
    console.log(`📈 [${requestId}] Final processing summary:`, {
      videoId: videoDocRef.id,
      collectionId: collectionId,
      totalTime: `${totalProcessingTime}ms`,
      breakdown: {
        download: `${downloadTime}ms`,
        transcription: `${transcribeTime}ms`,
        thumbnail: `${thumbnailTime}ms`,
        save: `${saveTime}ms`,
        update: `${updateTime}ms`,
      },
      success: true,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    const totalTime = Date.now() - backgroundStartTime;
    console.error(`❌ [${requestId}] BACKGROUND PROCESSING FAILED after ${totalTime}ms:`, error);
    console.error(`❌ [${requestId}] Error details:`, {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      videoUrl: videoUrl,
      collectionId: collectionId,
      title: title,
      failedAt: new Date().toISOString(),
      processingTime: `${totalTime}ms`,
    });

    // TODO: Consider implementing a retry mechanism or error notification system
    // For now, we log the error but don't notify the client since they already got a success response
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
      addedAt: data.addedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
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
