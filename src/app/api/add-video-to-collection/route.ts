import { NextRequest, NextResponse } from "next/server";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { uploadToBunnyStream } from "@/lib/bunny-stream";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { buildInternalUrl } from "@/lib/utils/url";

async function authenticateApiKey(request: NextRequest) {
  console.log("🔐 [Add Video API] Checking API key authentication");

  const apiKey = ApiKeyAuthService.extractApiKey(request);

  if (!apiKey) {
    console.log("❌ [Add Video API] No API key provided");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "API key required. Provide via x-api-key header or Authorization: Bearer header.",
      },
      { status: 401 },
    );
  }

  const authResult = await ApiKeyAuthService.validateApiKey(apiKey);

  if (!authResult) {
    console.log("❌ [Add Video API] Invalid API key");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid API key",
      },
      { status: 401 },
    );
  }

  if (!authResult.rateLimitResult.allowed) {
    console.log("🚫 [Add Video API] Request blocked by rate limiting");
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: authResult.rateLimitResult.reason,
        rateLimitInfo: {
          resetTime: authResult.rateLimitResult.resetTime,
          violationsCount: authResult.rateLimitResult.violationsCount,
          requestsPerMinute: 50,
          maxViolations: 2,
        },
      },
      { status: 429 },
    );
  }

  console.log("✅ [Add Video API] API key authenticated for user:", authResult.user.email);
  return authResult;
}

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

// Use the same backend processing functions as the add video button
async function downloadVideo(url: string) {
  try {
    console.log("🔄 [Add Video API] Calling downloader service...");

    const response = await fetch(buildInternalUrl("/api/video/downloader"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Add Video API] Download failed:", response.status, errorText);
      return { success: false, error: `Download failed: ${errorText}` };
    }

    const data = await response.json();
    console.log("✅ [Add Video API] Download successful");
    return { success: true, data };
  } catch (error) {
    console.error("❌ [Add Video API] Download error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Download failed" };
  }
}

async function streamToBunny(downloadData: any) {
  try {
    console.log("🐰 [Add Video API] Streaming to Bunny CDN...");

    const buffer = Buffer.from(downloadData.videoData.buffer);
    const filename = downloadData.videoData.filename ?? `${downloadData.platform}-video.mp4`;
    const mimeType = downloadData.videoData.mimeType ?? "video/mp4";

    console.log("🔍 [Add Video API] Buffer info:", {
      bufferSize: buffer.length,
      filename,
      mimeType,
    });

    const result = await uploadToBunnyStream(buffer, filename, mimeType);

    console.log("🔍 [Add Video API] Upload result:", result);

    if (!result) {
      console.error("❌ [Add Video API] Bunny stream failed - null result");
      return { success: false, error: "Failed to upload to Bunny CDN" };
    }

    console.log("✅ [Add Video API] Bunny stream successful:", result.cdnUrl);

    return {
      success: true,
      iframeUrl: result.cdnUrl,
      directUrl: result.cdnUrl,
      guid: result.filename, // This is actually the GUID
      thumbnailUrl: null,
    };
  } catch (error) {
    console.error("❌ [Add Video API] Bunny stream error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bunny stream failed" };
  }
}

async function addVideoToCollection(collectionId: string, videoData: any) {
  try {
    console.log("💾 [Add Video API] Adding video to Firestore collection...");

    if (!isAdminInitialized) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Admin database not available");
    }

    // Add the video document to Firestore
    const videoRef = await adminDb.collection("videos").add({
      ...videoData,
      addedAt: new Date(),
    });

    console.log("✅ [Add Video API] Video added to collection with ID:", videoRef.id);

    // Update collection video count
    const collectionRef = adminDb.collection("collections").doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (collectionDoc.exists) {
      const currentCount = collectionDoc.data()?.videoCount ?? 0;
      await collectionRef.update({
        videoCount: currentCount + 1,
        updatedAt: new Date(),
      });
      console.log("✅ [Add Video API] Collection video count updated:", currentCount + 1);
    }

    return { success: true, videoId: videoRef.id };
  } catch (error) {
    console.error("❌ [Add Video API] Failed to add video to collection:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add video" };
  }
}

function startBackgroundTranscription(
  videoData: any,
  videoId: string,
  collectionId: string,
  platform: string,
  apiKey?: string,
) {
  // Start background transcription process (non-blocking)
  setTimeout(async () => {
    try {
      console.log("🎙️ [Add Video API] Starting background transcription for video:", videoId);

      const headers: Record<string, string> = { "Content-Type": "application/json" };

      // Add authentication header if API key is provided
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }

      const response = await fetch(buildInternalUrl("/api/video/transcribe"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          videoData,
          videoId,
          collectionId,
          platform,
        }),
      });

      if (response.ok) {
        console.log("✅ [Add Video API] Background transcription started successfully");
      } else {
        console.error("❌ [Add Video API] Background transcription failed to start");
      }
    } catch (error) {
      console.error("❌ [Add Video API] Error starting background transcription:", error);
    }
  }, 1000); // Start after 1 second delay
}

async function verifyCollectionOwnership(adminDb: any, collectionId: string, userId: string) {
  const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
  if (!collectionDoc.exists) {
    return { success: false, error: "Collection not found", status: 404 };
  }

  const collectionData = collectionDoc.data();
  if (collectionData?.userId !== userId) {
    return { success: false, error: "Access denied: You do not own this collection", status: 403 };
  }

  return { success: true, data: collectionData };
}

async function downloadAndStream(decodedUrl: string, requestId: string) {
  console.log(`📥 [${requestId}] Step 1: Downloading video...`);
  const downloadResult = await downloadVideo(decodedUrl);
  if (!downloadResult.success) {
    console.error(`❌ [${requestId}] Download failed:`, downloadResult.error);
    return { success: false, error: downloadResult.error };
  }
  console.log(`✅ [${requestId}] Download successful`);

  console.log(`🎬 [${requestId}] Step 2: Streaming to Bunny CDN...`);
  const streamResult = await streamToBunny(downloadResult.data);
  if (!streamResult.success) {
    console.error(`❌ [${requestId}] Streaming failed:`, streamResult.error);
    return { success: false, error: streamResult.error };
  }
  console.log(`✅ [${requestId}] Streaming successful`);

  return { success: true, downloadResult, streamResult };
}

async function storeVideoInDatabase(collectionId: string, videoPayload: any, requestId: string) {
  console.log(`💾 [${requestId}] Step 3: Adding to collection...`);
  const addResult = await addVideoToCollection(collectionId, videoPayload);
  if (!addResult.success || !addResult.videoId) {
    console.error(`❌ [${requestId}] Failed to add to collection:`, addResult.error);
    return { success: false, error: addResult.error };
  }
  return { success: true, videoId: addResult.videoId };
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🚀 [${requestId}] Starting video processing workflow at ${new Date().toISOString()}`);

  try {
    // Extract API key for background transcription
    const apiKey = ApiKeyAuthService.extractApiKey(request);

    // Step 1: Authentication
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    const {
      user: { uid: userId, email },
    } = authResult;
    console.log(`✅ [${requestId}] Authentication successful for user: ${email}`);

    // Step 2: Request validation
    const body = await request.json();
    const validation = validateAddVideoRequest(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { videoUrl, collectionId, title } = validation.data!;

    // Step 3: URL validation
    if (!validateUrl(videoUrl)) {
      return NextResponse.json({ error: "Only TikTok and Instagram videos are supported" }, { status: 400 });
    }

    // Step 4: Firebase connection
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Step 5: Collection verification
    const ownershipResult = await verifyCollectionOwnership(adminDb, collectionId, userId);
    if (!ownershipResult.success) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status });
    }
    console.log(`✅ [${requestId}] Collection verified - Title: ${ownershipResult.data?.title}`);

    // Start backend processing (non-blocking)
    setTimeout(() => {
      processVideoInBackground(requestId, videoUrl, collectionId, title, userId, apiKey);
    }, 0);

    // Return immediate success response
    return NextResponse.json({
      success: true,
      message: "Video processing has started successfully",
      requestId,
      status: "processing",
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process video request" }, { status: 500 });
  }
}

// Background processing function using the same backend method as the add video button
async function processVideoInBackground(
  requestId: string,
  videoUrl: string,
  collectionId: string,
  title: string | undefined,
  userId: string,
  apiKey: string | null,
) {
  const backgroundStartTime = Date.now();
  try {
    const decodedUrl = decodeURIComponent(videoUrl);

    const processingResult = await downloadAndStream(decodedUrl, requestId);
    if (!processingResult.success || !processingResult.downloadResult || !processingResult.streamResult) {
      console.error(`❌ [${requestId}] Download or stream failed, aborting processing.`);
      return;
    }

    const { downloadResult, streamResult } = processingResult;

    const videoPayload = {
      originalUrl: decodedUrl,
      title: title ?? `Video from ${downloadResult.data.platform}`,
      platform: downloadResult.data.platform,
      iframeUrl: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      guid: streamResult.guid,
      thumbnailUrl: downloadResult.data.thumbnailUrl ?? streamResult.thumbnailUrl,
      metrics: downloadResult.data.metrics ?? {},
      metadata: {
        ...downloadResult.data.metadata,
        author: downloadResult.data.additionalMetadata?.author ?? "Unknown",
        duration: downloadResult.data.additionalMetadata?.duration ?? 0,
      },
      transcriptionStatus: "pending",
      userId: userId,
      collectionId: collectionId,
    };

    const dbResult = await storeVideoInDatabase(collectionId, videoPayload, requestId);
    if (!dbResult.success || !dbResult.videoId) return;

    startBackgroundTranscription(
      downloadResult.data.videoData,
      dbResult.videoId,
      collectionId,
      downloadResult.data.platform,
      apiKey || undefined,
    );

    console.log(`🎉 [${requestId}] PROCESSING COMPLETED SUCCESSFULLY in ${Date.now() - backgroundStartTime}ms`);
  } catch (error) {
    console.error(`❌ [${requestId}] BACKGROUND PROCESSING FAILED:`, error);
  }
}

async function getCollectionVideos(adminDb: any, collectionId: string) {
  // Use simpler query without orderBy to avoid index requirement
  const videosSnapshot = await adminDb.collection("videos").where("collectionId", "==", collectionId).get();

  const videos = videosSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      addedAt: data.addedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    };
  });

  // Sort in memory by addedAt (most recent first)
  return videos.sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key first
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    const {
      user: { uid: userId },
    } = authResult;

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    const ownershipResult = await verifyCollectionOwnership(adminDb, collectionId, userId);
    if (!ownershipResult.success) {
      return NextResponse.json({ error: ownershipResult.error }, { status: ownershipResult.status });
    }

    const videos = await getCollectionVideos(adminDb, collectionId);

    return NextResponse.json({
      collection: {
        id: collectionId,
        title: ownershipResult.data?.title,
        description: ownershipResult.data?.description,
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
