import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { detectPlatform } from "@/lib/core/video/platform-detector";
import { VideoTranscriber } from "@/lib/core/video/transcriber";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (keeping existing auth)
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

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
    console.error("❌ [TRANSCRIBE] No video URL provided");
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  console.log("🌐 [TRANSCRIBE] Transcribing CDN-hosted video:", videoUrl);
  console.log("📱 [TRANSCRIBE] Platform:", platform);

  const transcriptionResult = await transcribeFromUrl(videoUrl, platform);

  if (!transcriptionResult) {
    console.error("❌ [TRANSCRIBE] CDN transcription failed");
    return NextResponse.json({ error: "Failed to transcribe video from URL" }, { status: 500 });
  }

  console.log("✅ [TRANSCRIBE] CDN transcription completed successfully");
  console.log("📊 [TRANSCRIBE] Result summary:");
  console.log("  - Transcript length:", transcriptionResult.transcript.length, "characters");
  console.log("  - Platform:", transcriptionResult.platform);

  return NextResponse.json({
    success: true,
    transcript: transcriptionResult.transcript,
    platform: transcriptionResult.platform,
    components: transcriptionResult.components,
    contentMetadata: transcriptionResult.contentMetadata,
    visualContext: transcriptionResult.visualContext,
    transcriptionMetadata: {
      method: "cdn-url",
      fileSize: 0, // Unknown for CDN URLs
      fileName: videoUrl.split("/").pop() ?? "cdn-video",
      processedAt: new Date().toISOString(),
    },
  });
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

  // Check file size limit (20MB for direct upload)
  const maxDirectSize = 20 * 1024 * 1024; // 20MB

  if (file.size > maxDirectSize) {
    console.error("❌ [TRANSCRIBE] File too large for direct upload:", file.size, "bytes");
    return NextResponse.json({ error: "Video file is too large (max 20MB)" }, { status: 400 });
  }

  const transcriptionResult = await transcribeDirectly(file);

  if (!transcriptionResult) {
    console.error("❌ [TRANSCRIBE] Transcription failed");
    return NextResponse.json({ error: "Failed to transcribe video" }, { status: 500 });
  }

  console.log("✅ [TRANSCRIBE] Transcription completed successfully");
  console.log("📊 [TRANSCRIBE] Result summary:");
  console.log("  - Transcript length:", transcriptionResult.transcript.length, "characters");
  console.log("  - Platform:", transcriptionResult.platform);

  return NextResponse.json({
    success: true,
    transcript: transcriptionResult.transcript,
    platform: transcriptionResult.platform,
    components: transcriptionResult.components,
    contentMetadata: transcriptionResult.contentMetadata,
    visualContext: transcriptionResult.visualContext,
    transcriptionMetadata: {
      method: "direct",
      fileSize: file.size,
      fileName: file.name,
      processedAt: new Date().toISOString(),
    },
  });
}

function createFallbackResponse(responseText: string): {
  transcript: string;
  platform: string;
  components: ScriptComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
} {
  return {
    transcript: responseText,
    components: {
      hook: "Unable to extract hook from video content",
      bridge: "Unable to extract bridge from video content",
      nugget: "Unable to extract golden nugget from video content",
      wta: "Unable to extract WTA from video content",
    },
    contentMetadata: {
      platform: "Unknown" as const,
      author: "Unknown",
      description: "Video content analysis - JSON parsing failed",
      source: "other" as const,
      hashtags: [],
    },
    visualContext: "Unable to extract visual context from video",
    platform: "Unknown",
  };
}

function parseTranscriptionResponse(responseText: string) {
  let jsonString = responseText.trim();

  // Remove any markdown code blocks
  jsonString = jsonString.replace(/```json\s*/, "").replace(/```\s*$/, "");

  // Find the first { and last } to extract JSON
  const firstBrace = jsonString.indexOf("{");
  const lastBrace = jsonString.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  console.log("🔍 [DEBUG] Attempting to parse JSON of length:", jsonString.length);
  return JSON.parse(jsonString) as ParsedTranscriptionData;
}

function createTranscriptionPrompt(): string {
  return `Analyze this video and provide a comprehensive breakdown with the following requirements:

1. **Complete Transcript**: Provide a full, accurate transcription of all spoken content (no timestamps needed)
2. **Script Components**: Break down the content into these four components:
   - HOOK (Attention-Grabbing Opener): Extract or create an engaging opening that captures attention within the first 3-5 seconds
   - BRIDGE (Connecting the Hook to the Core Idea): The transition that connects the hook to the main content
   - GOLDEN NUGGET (The Core Lesson or Strategy): The main valuable insight, tip, or takeaway from the video
   - WTA (Call to Action / Concluding Thought): The ending that drives action or leaves a lasting impression
3. **Platform Detection**: Identify if this is TikTok, Instagram, YouTube, or other social media content based on visual style, format, or content structure
4. **Content Metadata**: Extract creator information, video description, and relevant hashtags
5. **Visual Context**: Describe important visual elements, text overlays, and scene changes

IMPORTANT: You must respond with ONLY valid JSON in this exact format (no additional text before or after):
{
  "transcript": "Full transcript with speaker identification (no timestamps)",
  "components": {
    "hook": "Extracted or optimized hook text (3-5 seconds worth)",
    "bridge": "Bridge text connecting hook to main content", 
    "nugget": "The core valuable insight or lesson",
    "wta": "Call to action or concluding thought"
  },
  "contentMetadata": {
    "platform": "TikTok|Instagram|YouTube|Unknown",
    "author": "Creator name or @username if visible/mentioned",
    "description": "Brief description of video content and purpose",
    "source": "educational|entertainment|tutorial|lifestyle|business|other",
    "hashtags": ["relevant", "hashtags", "extracted", "or", "inferred"]
  },
  "visualContext": "Description of visual elements, text overlays, transitions, and important scenes"
}

Respond with ONLY the JSON object, no other text.`;
}

function processTranscriptionData(transcriptionData: ParsedTranscriptionData, responseText: string) {
  return {
    transcript: transcriptionData.transcript ?? responseText,
    components: transcriptionData.components ?? {
      hook: "Unable to extract hook from video content",
      bridge: "Unable to extract bridge from video content",
      nugget: "Unable to extract golden nugget from video content",
      wta: "Unable to extract WTA from video content",
    },
    contentMetadata: transcriptionData.contentMetadata ?? {
      platform: "Unknown" as const,
      author: "Unknown",
      description: "Video content analysis",
      source: "other" as const,
      hashtags: [],
    },
    visualContext: transcriptionData.visualContext ?? "Unable to extract visual context from video",
    platform: transcriptionData.contentMetadata?.platform ?? "Unknown",
  };
}

async function transcribeDirectly(file: File): Promise<{
  transcript: string;
  platform: string;
  components: ScriptComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
} | null> {
  try {
    console.log("🔄 [TRANSCRIBE-DIRECT] Converting file to base64...");

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    console.log("🤖 [TRANSCRIBE-DIRECT] Generating transcription with direct upload...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = createTranscriptionPrompt();

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: file.type || "video/mp4",
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text();
    console.log("📄 [TRANSCRIBE-DIRECT] Raw response length:", responseText.length, "characters");
    console.log("🔍 [DEBUG] First 200 chars of response:", responseText.substring(0, 200));

    try {
      const transcriptionData = parseTranscriptionResponse(responseText);

      console.log("✅ [TRANSCRIBE-DIRECT] JSON parsed successfully");
      console.log("📊 [TRANSCRIBE-DIRECT] Response contains:", Object.keys(transcriptionData));

      return processTranscriptionData(transcriptionData, responseText);
    } catch (parseError) {
      console.log("⚠️ [TRANSCRIBE-DIRECT] JSON parsing failed:", parseError);
      console.log("📄 [TRANSCRIBE-DIRECT] Raw response for debugging:", responseText);
      return createFallbackResponse(responseText);
    }
  } catch (error) {
    console.error("❌ [TRANSCRIBE-DIRECT] Direct transcription error:", error);
    return null;
  }
}

async function transcribeFromUrl(
  videoUrl: string,
  platform?: string,
): Promise<{
  transcript: string;
  platform: string;
  components: ScriptComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
} | null> {
  try {
    console.log("🌐 [TRANSCRIBE-URL] Downloading video from CDN...");

    // Download video from CDN
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    console.log("🤖 [TRANSCRIBE-URL] Generating transcription from CDN video...");
    console.log(
      "📊 [TRANSCRIBE-URL] Video size:",
      Math.round((arrayBuffer.byteLength / 1024 / 1024) * 100) / 100,
      "MB",
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = createTranscriptionPrompt();

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: "video/mp4", // Assume MP4 for CDN videos
        },
      },
      prompt,
    ]);

    const response_text = result.response.text();
    console.log("🎯 [TRANSCRIBE-URL] Raw AI response length:", response_text.length);

    try {
      const transcriptionData = parseTranscriptionResponse(response_text);
      const processedResult = processTranscriptionData(transcriptionData, response_text);

      // Override platform if provided
      if (platform && ["TikTok", "Instagram", "YouTube", "Unknown"].includes(platform)) {
        processedResult.platform = platform as "TikTok" | "Instagram" | "YouTube" | "Unknown";
        processedResult.contentMetadata.platform = platform as ContentMetadata["platform"];
      }

      return processedResult;
    } catch (parseError) {
      console.error("❌ [TRANSCRIBE-URL] JSON parsing failed:", parseError);
      console.log("🔄 [TRANSCRIBE-URL] Using fallback response format");

      const fallbackResult = createFallbackResponse(response_text);

      // Override platform if provided
      if (platform && ["TikTok", "Instagram", "YouTube", "Unknown"].includes(platform)) {
        fallbackResult.platform = platform as "TikTok" | "Instagram" | "YouTube" | "Unknown";
        fallbackResult.contentMetadata.platform = platform as ContentMetadata["platform"];
      }

      return fallbackResult;
    }
  } catch (error) {
    console.error("❌ [TRANSCRIBE-URL] CDN transcription error:", error);
    return null;
  }
}
