import { NextRequest, NextResponse } from "next/server";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { uploadToBunnyStream } from "@/lib/bunny-stream";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

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

// Use the same backend processing functions as the add video button
async function downloadVideo(baseUrl: string, url: string) {
  try {
    console.log("🔄 [Add Video API] Calling downloader service...");

    const response = await fetch(`${baseUrl}/api/video/downloader`, {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamToBunny(downloadData: any) {
  try {
    console.log("🐰 [Add Video API] Streaming to Bunny CDN...");

    const buffer = Buffer.from(downloadData.videoData.buffer);
    const filename = downloadData.videoData.filename || `${downloadData.platform}-video.mp4`;
    const mimeType = downloadData.videoData.mimeType || "video/mp4";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addVideoToCollection(collectionId: string, videoData: any) {
  const adminDb = getAdminDb();
  try {
    console.log("💾 [Add Video API] Adding video to Firestore collection...");

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
      const currentCount = collectionDoc.data()?.videoCount || 0;
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
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  videoData: any,
  videoId: string,
  collectionId: string,
  platform: string,
) {
  // Start background transcription process (non-blocking)
  setTimeout(async () => {
    try {
      console.log("🎙️ [Add Video API] Starting background transcription for video:", videoId);

      const response = await fetch(`${baseUrl}/api/video/transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  console.log(`🚀 [${requestId}] Starting video processing workflow at ${new Date().toISOString()}`);

  try {
    // Step 1: Authentication
    console.log(`🔐 [${requestId}] Step 1: Authenticating API key...`);
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userId = authResult.user.uid;
    console.log(`✅ [${requestId}] Authentication successful for user: ${authResult.user.email}`);

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
    
    if (!isAdminInitialized || !adminDb) {
      console.log(`❌ [${requestId}] Firebase connection failed - SDK not configured`);
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }
    console.log(`✅ [${requestId}] Firebase connection successful`);

    // Step 5: Collection verification and ownership check
    console.log(`📁 [${requestId}] Step 5: Verifying collection exists and user ownership...`);
    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists) {
      console.log(`❌ [${requestId}] Collection not found: ${collectionId}`);
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionDoc.data();

    // Verify user owns the collection
    if (collectionData?.userId !== userId) {
      console.log(`❌ [${requestId}] User ${userId} does not own collection ${collectionId}`);
      return NextResponse.json({ error: "Access denied: You do not own this collection" }, { status: 403 });
    }

    console.log(
      `✅ [${requestId}] Collection verified - Title: ${collectionData?.title}, Owner: ${collectionData?.userId}`,
    );

    // All validations passed - return immediate success response
    const validationTime = Date.now() - startTime;
    console.log(`🎉 [${requestId}] All validations passed in ${validationTime}ms - starting backend processing`);

    // Start backend processing (non-blocking)
    setTimeout(() => {
      processVideoInBackground(requestId, videoUrl, collectionId, title, userId, request);
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

// Background processing function using the same backend method as the add video button
async function processVideoInBackground(
  requestId: string,
  videoUrl: string,
  collectionId: string,
  title: string | undefined,
  userId: string,
  request: NextRequest,
) {
  const backgroundStartTime = Date.now();

  try {
    console.log(`🎬 [${requestId}] Background processing started at ${new Date().toISOString()}`);

    const baseUrl = getBaseUrl(request);

    // Decode URL to handle URL encoding issues (like Instagram)
    const decodedUrl = decodeURIComponent(videoUrl);
    console.log("🔍 [Add Video API] Decoded URL:", decodedUrl);

    // Step 1: Download video
    console.log(`📥 [${requestId}] Step 1: Downloading video...`);
    const downloadResult = await downloadVideo(baseUrl, decodedUrl);

    if (!downloadResult.success) {
      console.error(`❌ [${requestId}] Download failed:`, downloadResult.error);
      return;
    }

    console.log(`✅ [${requestId}] Download successful`);

    // Step 2: Stream to Bunny CDN
    console.log(`🎬 [${requestId}] Step 2: Streaming to Bunny CDN...`);
    const streamResult = await streamToBunny(downloadResult.data);

    if (!streamResult.success) {
      console.error(`❌ [${requestId}] Streaming failed:`, streamResult.error);
      return;
    }

    console.log(`✅ [${requestId}] Streaming successful`);

    // Step 3: Add to collection with userId
    console.log(`💾 [${requestId}] Step 3: Adding to collection...`);
    const videoData = {
      originalUrl: decodedUrl,
      title: title || `Video from ${downloadResult.data.platform}`,
      platform: downloadResult.data.platform,
      iframeUrl: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      guid: streamResult.guid,
      thumbnailUrl: downloadResult.data.thumbnailUrl || streamResult.thumbnailUrl,
      metrics: downloadResult.data.metrics || {},
      metadata: downloadResult.data.metadata || {},
      transcriptionStatus: "pending",
      userId: userId,
      collectionId: collectionId,
    };

    const addResult = await addVideoToCollection(collectionId, videoData);

    if (!addResult.success) {
      console.error(`❌ [${requestId}] Failed to add to collection:`, addResult.error);
      return;
    }

    // Step 4: Start background transcription
    console.log(`🎙️ [${requestId}] Step 4: Starting background transcription...`);
    startBackgroundTranscription(
      baseUrl,
      downloadResult.data.videoData,
      addResult.videoId,
      collectionId,
      downloadResult.data.platform,
    );

    const totalProcessingTime = Date.now() - backgroundStartTime;
    console.log(`🎉 [${requestId}] PROCESSING COMPLETED SUCCESSFULLY in ${totalProcessingTime}ms`);
    console.log(`📈 [${requestId}] Final processing summary:`, {
      videoId: addResult.videoId,
      collectionId: collectionId,
      platform: downloadResult.data.platform,
      iframe: streamResult.iframeUrl,
      transcriptionStatus: "processing",
      totalTime: `${totalProcessingTime}ms`,
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
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCollectionVideos(collectionId: string) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Admin database not available");
  }
  const snapshot = await adminDb.collection("videos").where("collectionId", "==", collectionId).get();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const videos = snapshot.docs.map((doc: any) => {
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
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { collectionId } = await request.json();

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    const videos = await getCollectionVideos(collectionId);
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
