import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  console.log("🎬 [TRANSCRIBE] Starting video-to-text transcription...");

  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await handleUrlTranscription(request);
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

async function handleUrlTranscription(request: NextRequest) {
  const { videoUrl } = await request.json();

  if (!videoUrl) {
    console.error("❌ [TRANSCRIBE] No video URL provided");
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  console.log("🌐 [TRANSCRIBE] Transcribing video from URL:", videoUrl);

  try {
    // Decode URL-encoded URLs before fetching
    let decodedUrl = videoUrl;
    try {
      decodedUrl = decodeURIComponent(videoUrl);
      console.log("🔍 [TRANSCRIBE] Original URL:", videoUrl);
      console.log("🔍 [TRANSCRIBE] Decoded URL:", decodedUrl);
    } catch (error) {
      console.log("⚠️ [TRANSCRIBE] URL decode failed, using original:", videoUrl);
      decodedUrl = videoUrl;
    }

    // Download video from URL
    const response = await fetch(decodedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const transcript = await transcribeVideoData(arrayBuffer, "video/mp4");

    if (!transcript) {
      return NextResponse.json({ error: "Failed to transcribe video from URL" }, { status: 500 });
    }

    console.log("✅ [TRANSCRIBE] URL transcription completed");
    console.log("📊 [TRANSCRIBE] Transcript length:", transcript.length, "characters");

    return NextResponse.json({
      success: true,
      transcript,
      metadata: {
        method: "url",
        videoUrl: decodedUrl,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [TRANSCRIBE] URL transcription error:", error);
    return NextResponse.json({ error: "Failed to transcribe video from URL" }, { status: 500 });
  }
}

async function handleFileTranscription(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video") as File;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!file) {
    console.error("❌ [TRANSCRIBE] No video file provided");
    return NextResponse.json({ error: "No video file provided" }, { status: 400 });
  }

  console.log("📁 [TRANSCRIBE] File info:");
  console.log("  - Name:", file.name);
  console.log("  - Size:", Math.round((file.size / 1024 / 1024) * 100) / 100, "MB");
  console.log("  - Type:", file.type);

  // Check file size limit (20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    console.error("❌ [TRANSCRIBE] File too large:", file.size, "bytes");
    return NextResponse.json({ error: "Video file is too large (max 20MB)" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const transcript = await transcribeVideoData(arrayBuffer, file.type);

    if (!transcript) {
      return NextResponse.json({ error: "Failed to transcribe video file" }, { status: 500 });
    }

    console.log("✅ [TRANSCRIBE] File transcription completed");
    console.log("📊 [TRANSCRIBE] Transcript length:", transcript.length, "characters");

    return NextResponse.json({
      success: true,
      transcript,
      metadata: {
        method: "file",
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [TRANSCRIBE] File transcription error:", error);
    return NextResponse.json({ error: "Failed to transcribe video file" }, { status: 500 });
  }
}

async function transcribeVideoData(arrayBuffer: ArrayBuffer, mimeType: string): Promise<string | null> {
  try {
    console.log("🤖 [TRANSCRIBE] Converting video to transcript...");

    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Simple, focused prompt for transcription only
    const prompt = `Provide a full, accurate transcription of all spoken content in this video. 
    
Include speaker identification if multiple speakers are present, but do not include timestamps.
Focus only on the spoken words - do not analyze or interpret the content.
Respond with only the transcript text, no additional formatting or commentary.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: base64Data,
        },
      },
    ]);

    const transcript = result.response.text().trim();
    console.log("✅ [TRANSCRIBE] Transcription generated successfully");

    return transcript;
  } catch (error) {
    console.error("❌ [TRANSCRIBE] Video transcription error:", error);
    return null;
  }
}
