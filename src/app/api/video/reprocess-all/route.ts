import { NextRequest, NextResponse } from "next/server";

import { getAuth } from "firebase-admin/auth";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";
import { updateVideoTranscription } from "@/lib/video-utils";

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  body: string;
}

interface VideoDoc {
  id: string;
  [key: string]: any;
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function fetchWithTimeout(resource: string, options: FetchOptions, timeout = 60000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);
  return response;
}

// eslint-disable-next-line complexity
export async function POST(request: NextRequest) {
  console.log("🚀 [REPROCESS_ALL] Starting batch video reprocessing workflow...");

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
    }

    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    const idToken = authHeader.substring(7);
    const auth = getAuth();
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (_error) {
      return NextResponse.json({ error: "Invalid Firebase token" }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const userProfile = await UserManagementAdminService.getUserProfile(userId);

    if (userProfile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to perform this action." },
        { status: 403 },
      );
    }

    console.log(`✅ [REPROCESS_ALL] Authenticated as super_admin: ${userProfile.email}`);

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const videosSnapshot = await adminDb.collection("videos").get();
    if (videosSnapshot.empty) {
      return NextResponse.json({ success: true, message: "No videos found to reprocess." });
    }

    const videos = videosSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    const totalVideos = videos.length;
    console.log(`🎬 [REPROCESS_ALL] Found ${totalVideos} videos to reprocess.`);

    const baseUrl = getBaseUrl(request);
    let processedCount = 0;
    let failedCount = 0;

    // Process videos sequentially to avoid overwhelming services
    for (const video of videos) {
      const videoId = video.id;
      const videoUrl =
        // Prefer the original source URL for best analysis fidelity
        // Fallback to current canonical fields we store
        video.originalUrl ?? video.url ?? video.directUrl ?? video.cdnUrl ?? undefined;

      if (!videoUrl) {
        console.warn(`⚠️ [REPROCESS_ALL] Skipping video ${videoId}: No URL found.`);
        failedCount++;
        continue;
      }

      try {
        console.log(
          `🔄 [REPROCESS_ALL] (${processedCount + failedCount + 1}/${totalVideos}) Processing video: ${videoId}`,
        );

        const analyzeResponse = await fetchWithTimeout(`${baseUrl}/api/video/analyze-complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl }),
        });

        if (!analyzeResponse.ok) {
          throw new Error(`Analysis failed with status ${analyzeResponse.status}`);
        }

        const analysisResult = await analyzeResponse.json();

        await updateVideoTranscription(videoId, {
          transcript: analysisResult.transcript,
          components: analysisResult.components,
          contentMetadata: analysisResult.contentMetadata,
          visualContext: analysisResult.visualContext,
        });

        console.log(`✅ [REPROCESS_ALL] Successfully reprocessed video: ${videoId}`);
        processedCount++;

        // Add a small delay between requests to be kind to our services
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`❌ [REPROCESS_ALL] Failed to reprocess video ${videoId}:`, error);
        failedCount++;
      }
    }

    console.log("🎉 [REPROCESS_ALL] Batch reprocessing complete.");
    return NextResponse.json({
      success: true,
      message: "Batch reprocessing finished.",
      totalVideos,
      processedCount,
      failedCount,
    });
  } catch (error) {
    console.error("❌ [REPROCESS_ALL] Critical workflow error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete reprocessing workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
