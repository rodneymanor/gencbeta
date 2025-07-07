import { NextRequest, NextResponse } from "next/server";
import { query, where, orderBy, getDocs } from "firebase/firestore";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { uploadToBunnyStream } from "@/lib/bunny-stream";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

async function authenticateApiKey(request: NextRequest) {
  const apiKey = ApiKeyAuthService.extractApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized", message: "API key required." }, { status: 401 });
  }
  const authResult = await ApiKeyAuthService.validateApiKey(apiKey);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 });
  }
  if (!authResult.rateLimitResult.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  try {
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.user.uid;
    const body = await request.json();
    const validation = validateAddVideoRequest(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { videoUrl, collectionId, title } = validation.data!;
    if (!validateUrl(videoUrl)) {
      return NextResponse.json({ error: "Unsupported video platform" }, { status: 400 });
    }
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists || collectionDoc.data()?.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    setTimeout(() => {
      processVideoInBackground(videoUrl, collectionId, title, userId, request);
    }, 0);
    return NextResponse.json({ success: true, message: "Video processing started" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process video request" }, { status: 500 });
  }
}

async function processVideoInBackground(
  videoUrl: string,
  collectionId: string,
  title: string | undefined,
  userId: string,
  request: NextRequest,
) {
  try {
    const baseUrl = getBaseUrl(request);
    const decodedUrl = decodeURIComponent(videoUrl);
    const downloadResult = await downloadVideo(baseUrl, decodedUrl);
    if (!downloadResult.success) return;
    const streamResult = await streamToBunny(downloadResult.data);
    if (!streamResult.success) return;
    const videoData = {
      originalUrl: decodedUrl,
      title: title ?? `Video from ${downloadResult.data.platform}`,
      platform: downloadResult.data.platform,
      iframeUrl: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      guid: streamResult.guid,
      thumbnailUrl: downloadResult.data.thumbnailUrl ?? streamResult.thumbnailUrl,
      metrics: downloadResult.data.metrics ?? {},
      metadata: downloadResult.data.metadata ?? {},
      transcriptionStatus: "pending" as const,
      userId: userId,
      collectionId: collectionId,
    };
    const addResult = await addVideoToCollection(collectionId, videoData);
    if (!addResult.success || !addResult.videoId) return;
    startBackgroundTranscription(
      baseUrl,
      downloadResult.data.videoData,
      addResult.videoId,
      collectionId,
      downloadResult.data.platform,
    );
  } catch (error) {
    console.error(`Background processing failed:`, error);
  }
}

async function getCollectionVideos(adminDb: any, collectionId: string) {
  const videosQuery = query(
    adminDb.collection("videos"),
    where("collectionId", "==", collectionId),
    orderBy("addedAt", "desc"),
  );

  const videosSnapshot = await getDocs(videosQuery);

  if (videosSnapshot.empty) {
    return [];
  }

  const videos = videosSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      addedAt: data.addedAt?.toDate?.().toISOString() ?? new Date().toISOString(),
    };
  });

  // Sort in memory by addedAt (most recent first)
  return videos.sort((a: any, b: any) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const userId = authResult.user.uid;
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
  if (!collectionDoc.exists || collectionDoc.data()?.userId !== userId) {
    return NextResponse.json({ error: "Collection not found or access denied" }, { status: 404 });
  }

  const videos = await getCollectionVideos(adminDb, collectionId);

  return NextResponse.json({
    collection: {
      id: collectionId,
      ...collectionDoc.data(),
      videoCount: videos.length,
    },
    videos,
  });
}
