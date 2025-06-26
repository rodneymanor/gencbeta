import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === API_KEY;
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

// Helper function to detect platform from URL
function detectPlatformFromUrl(url: string): string {
  const urlLower = url.toLowerCase();
  if (urlLower.includes("tiktok.com")) return "tiktok";
  if (urlLower.includes("instagram.com")) return "instagram";
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) return "youtube";
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) return "twitter";
  return "external";
}

function createVideoData(videoUrl: string, collectionId: string, title: string | undefined, userId: string) {
  return {
    url: videoUrl,
    title: title ?? `Video ${Date.now()}`,
    platform: detectPlatformFromUrl(videoUrl),
    userId,
    collectionId,
    addedAt: new Date(),
    // Default values for required fields
    thumbnailUrl: "",
    author: "",
    transcript: "",
    visualContext: "",
    fileSize: 0,
    duration: 0,
    components: {
      hook: "",
      bridge: "",
      nugget: "",
      wta: "",
    },
    contentMetadata: {
      platform: detectPlatformFromUrl(videoUrl),
      author: "",
      description: "",
      source: "api",
      hashtags: [],
    },
    insights: {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      saves: 0,
      engagementRate: 0,
    },
  };
}

async function updateCollectionVideoCount(adminDb: any, collectionId: string, currentVideoCount: number) {
  await adminDb
    .collection("collections")
    .doc(collectionId)
    .update({
      videoCount: currentVideoCount + 1,
      updatedAt: new Date(),
    });
}

async function getCollectionVideos(adminDb: any, collectionId: string) {
  const videosSnapshot = await adminDb
    .collection("videos")
    .where("collectionId", "==", collectionId)
    .orderBy("addedAt", "desc")
    .get();

  return videosSnapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      url: data.url,
      platform: data.platform,
      addedAt: data.addedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    };
  });
}

// eslint-disable-next-line complexity
export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateAddVideoRequest(body);

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { videoUrl, collectionId, title } = validation.data!;

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Check if collection exists using Admin SDK
    const collectionDoc = await adminDb.collection("collections").doc(collectionId).get();
    if (!collectionDoc.exists) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionDoc.data();
    const videoData = createVideoData(videoUrl, collectionId, title, collectionData?.userId ?? "");

    // Add video to Firestore using Admin SDK
    const videoDocRef = await adminDb.collection("videos").add(videoData);

    // Update collection video count
    const currentVideoCount = collectionData?.videoCount ?? 0;
    await updateCollectionVideoCount(adminDb, collectionId, currentVideoCount);

    return NextResponse.json({
      success: true,
      message: "Video added successfully",
      videoId: videoDocRef.id,
      collectionId,
      video: {
        id: videoDocRef.id,
        ...videoData,
        addedAt: videoData.addedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error adding video to collection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get collection ID from query params
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Get collection details using Admin SDK
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
