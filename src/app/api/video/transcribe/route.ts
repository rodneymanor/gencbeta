import { NextRequest, NextResponse } from "next/server";

import { detectPlatform } from "@/core/video/platform-detector";
import { VideoTranscriber } from "@/core/video/transcriber";
import { authenticateApiKey } from "@/lib/api-key-auth";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (keeping existing auth)
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await handleCdnTranscription(request);
    } else {
      return await handleFileTranscription(request);
    }
  } catch (error) {
    console.error("❌ [TRANSCRIBE] Transcription error:", error);
    return NextResponse.json(
      {
        error: "Failed to transcribe video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function handleCdnTranscription(request: NextRequest) {
  const { videoUrl, platform } = await request.json();

  if (!videoUrl) {
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  console.log("🌐 [TRANSCRIBE] Transcribing CDN-hosted video:", videoUrl);

  const detectedPlatform = platform || detectPlatform(videoUrl).platform;
  const result = await VideoTranscriber.transcribeFromUrl(videoUrl, detectedPlatform);

  if (!result) {
    return NextResponse.json({ error: "Failed to transcribe video from URL" }, { status: 500 });
  }

  console.log("✅ [TRANSCRIBE] CDN transcription completed successfully");

  return NextResponse.json({
    success: true,
    transcript: result.transcript,
    platform: result.platform,
    components: result.components,
    contentMetadata: result.contentMetadata,
    visualContext: result.visualContext,
    transcriptionMetadata: result.transcriptionMetadata,
  });
}

async function handleFileTranscription(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video") as File;

  if (!file) {
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  console.log("📁 [TRANSCRIBE] Processing uploaded video file:", file.name);

  // Validate file
  const validation = VideoTranscriber.validateFile(file);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Convert file to video data for transcription
  const arrayBuffer = await file.arrayBuffer();
  const videoData = {
    buffer: arrayBuffer,
    size: file.size,
    mimeType: file.type,
    filename: file.name,
  };

  const detectedPlatform = detectPlatform(file.name).platform;
  const result = await VideoTranscriber.transcribe(videoData, detectedPlatform);

  if (!result) {
    return NextResponse.json({ error: "Failed to transcribe video" }, { status: 500 });
  }

  console.log("✅ [TRANSCRIBE] File transcription completed successfully");

  return NextResponse.json({
    success: true,
    transcript: result.transcript,
    platform: result.platform,
    components: result.components,
    contentMetadata: result.contentMetadata,
    visualContext: result.visualContext,
    transcriptionMetadata: {
      method: "direct",
      fileSize: file.size,
      fileName: file.name,
      processedAt: new Date().toISOString(),
    },
  });
}
