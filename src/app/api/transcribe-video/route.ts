import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { ScriptComponents, ContentMetadata } from "@/types/transcription";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ParsedTranscriptionData {
  transcript?: string;
  components?: ScriptComponents;
  contentMetadata?: ContentMetadata;
  visualContext?: string;
}

export async function POST(request: NextRequest) {
  console.log("🎬 [TRANSCRIBE] Starting video transcription...");

  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;

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
  } catch (error) {
    console.error("❌ [TRANSCRIBE] Transcription error:", error);
    console.error("❌ [TRANSCRIBE] Error stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        error: "Failed to transcribe video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
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
