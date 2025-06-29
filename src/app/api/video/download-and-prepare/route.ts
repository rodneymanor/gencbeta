import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🎬 [ORCHESTRATOR] Starting video download and preparation workflow...");

  try {
    const { url } = await request.json();

    if (!url) {
      console.error("❌ [ORCHESTRATOR] No URL provided");
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const baseUrl = getBaseUrl(request);
    console.log("🌐 [ORCHESTRATOR] Using base URL:", baseUrl);

    // Step 1: Download video from social media platform
    console.log("📥 [ORCHESTRATOR] Step 1: Downloading video...");
    const downloadResult = await callDownloaderService(baseUrl, url);

    if (!downloadResult) {
      return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
    }

    // Step 2: Validate video size
    const sizeValidationResult = validateVideoSize(downloadResult.videoData.size);
    if (sizeValidationResult) {
      return sizeValidationResult;
    }

    // Step 3: Upload to CDN (optional, may fail gracefully)
    console.log("📤 [ORCHESTRATOR] Step 3: Uploading to CDN...");
    const uploadResult = await callUploaderService(baseUrl, downloadResult.videoData);

    // Step 4: Start background analysis (fire-and-forget)
    console.log("🎬 [ORCHESTRATOR] Step 4: Starting background analysis...");
    startBackgroundAnalysis(downloadResult.videoData, url, request);

    // Step 5: Return combined response
    console.log("✅ [ORCHESTRATOR] Workflow completed successfully");
    return createWorkflowResponse(downloadResult, uploadResult);
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Workflow error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete video workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  // In production, use VERCEL_URL
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

async function callDownloaderService(baseUrl: string, url: string) {
  try {
    console.log("🔄 [ORCHESTRATOR] Calling downloader service...");

    const response = await fetch(`${baseUrl}/api/video/downloader`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.error("❌ [ORCHESTRATOR] Downloader service failed:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("✅ [ORCHESTRATOR] Download completed successfully");
    console.log(
      "📊 [ORCHESTRATOR] Downloaded video size:",
      Math.round((data.videoData.size / 1024 / 1024) * 100) / 100,
      "MB",
    );

    return data;
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Downloader service error:", error);
    return null;
  }
}

async function callUploaderService(
  baseUrl: string,
  videoData: { buffer: number[]; size: number; mimeType: string; filename: string },
) {
  try {
    console.log("🔄 [ORCHESTRATOR] Calling uploader service...");

    const response = await fetch(`${baseUrl}/api/video/uploader`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoBuffer: videoData.buffer,
        filename: videoData.filename,
        mimeType: videoData.mimeType,
      }),
    });

    if (!response.ok) {
      console.log("⚠️ [ORCHESTRATOR] Upload service failed (graceful fallback):", response.status);
      return null;
    }

    const data = await response.json();
    console.log("✅ [ORCHESTRATOR] Upload completed successfully:", data.cdnUrl);

    return data;
  } catch (error) {
    console.log("⚠️ [ORCHESTRATOR] Upload service error (graceful fallback):", error);
    return null;
  }
}

function validateVideoSize(size: number) {
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (size > maxSize) {
    console.error("❌ [ORCHESTRATOR] Video too large for processing:", size, "bytes");
    return NextResponse.json(
      {
        error: "Video is too large for processing (max 20MB)",
      },
      { status: 400 },
    );
  }
  return null;
}

function startBackgroundAnalysis(
  videoData: { buffer: number[]; size: number; mimeType: string; filename: string },
  originalVideoUrl: string,
  request: NextRequest,
) {
  console.log("🎬 [ORCHESTRATOR] Starting background analysis...");
  console.log("🔗 [ORCHESTRATOR] Original video URL:", originalVideoUrl);

  // Use setTimeout to ensure this runs after the response is sent
  setTimeout(async () => {
    try {
      const baseUrl = getBaseUrl(request);

      const formData = new FormData();
      const buffer = Buffer.from(videoData.buffer);
      const blob = new Blob([buffer], { type: videoData.mimeType });
      formData.append("video", blob, videoData.filename);

      console.log("🔍 [BACKGROUND] Calling analyze-complete service...");
      const response = await fetch(`${baseUrl}/api/video/analyze-complete`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const analysisResult = await response.json();
        console.log("✅ [BACKGROUND] Complete analysis completed successfully");
        console.log("📝 [BACKGROUND] Transcript length:", analysisResult.transcript?.length ?? 0);
        console.log("📊 [BACKGROUND] Platform detected:", analysisResult.contentMetadata?.platform ?? "Unknown");

        // Update video record in database with analysis results
        console.log("💾 [BACKGROUND] Updating video record with analysis results...");
        await updateVideoTranscription(baseUrl, originalVideoUrl, analysisResult);
      } else {
        console.log("⚠️ [BACKGROUND] Analysis failed:", response.status);
        const errorText = await response.text();
        console.log("❌ [BACKGROUND] Analysis error details:", errorText);
      }
    } catch (error) {
      console.error("❌ [BACKGROUND] Background analysis error:", error);
    }
  }, 100); // Small delay to ensure response is sent first
}

async function updateVideoTranscription(
  baseUrl: string,
  originalVideoUrl: string,
  analysisResult: {
    transcript: string;
    components: { hook: string; bridge: string; nugget: string; wta: string };
    contentMetadata: { platform: string; author: string; description: string; source: string; hashtags: string[] };
    visualContext: string;
  },
) {
  try {
    console.log("🔄 [BACKGROUND] Calling update-transcription service...");

    const response = await fetch(`${baseUrl}/api/video/update-transcription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl: originalVideoUrl,
        transcript: analysisResult.transcript,
        components: analysisResult.components,
        contentMetadata: analysisResult.contentMetadata,
        visualContext: analysisResult.visualContext,
      }),
    });

    if (response.ok) {
      const updateResult = await response.json();
      console.log("✅ [BACKGROUND] Video transcription updated successfully");
      console.log("📊 [BACKGROUND] Updated videos:", updateResult.updatedVideos);
      console.log("🎯 [BACKGROUND] Video IDs:", updateResult.videoIds);
    } else {
      const errorText = await response.text();
      console.log("❌ [BACKGROUND] Failed to update video transcription:", response.status);
      console.log("❌ [BACKGROUND] Update error details:", errorText);
    }
  } catch (error) {
    console.error("❌ [BACKGROUND] Error calling update-transcription service:", error);
  }
}

function createWorkflowResponse(downloadResult: unknown, uploadResult: unknown) {
  const response: Record<string, unknown> = {
    success: true,
    platform: (downloadResult as any).platform,
    metrics: (downloadResult as any).metrics,
    additionalMetadata: (downloadResult as any).additionalMetadata,
    thumbnailUrl: (downloadResult as any).thumbnailUrl,
    metadata: {
      ...(downloadResult as any).metadata,
      readyForTranscription: true,
      transcriptionStatus: "pending", // Indicates analysis is happening in background
    },
  };

  // If CDN upload was successful, return CDN URL
  if ((uploadResult as any)?.success) {
    response.cdnUrl = (uploadResult as any).cdnUrl;
    response.filename = (uploadResult as any).filename;
    response.hostedOnCDN = true;
    console.log("🎯 [ORCHESTRATOR] Returning CDN-hosted video URL");
  } else {
    // Fallback: return video buffer for local processing
    response.videoData = (downloadResult as any).videoData;
    response.hostedOnCDN = false;
    console.log("📁 [ORCHESTRATOR] Returning video buffer for local processing");
  }

  return NextResponse.json(response);
}
