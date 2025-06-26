import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ContentMetadata {
  platform: "TikTok" | "Instagram" | "YouTube" | "Unknown";
  author: string;
  description: string;
  source: "educational" | "entertainment" | "tutorial" | "lifestyle" | "business" | "other";
  hashtags: string[];
}

export async function POST(request: NextRequest) {
  console.log("🏷️ [METADATA_ANALYSIS] Starting content metadata analysis...");

  try {
    const { transcript, videoUrl, additionalContext } = await request.json();

    if (!transcript) {
      console.error("❌ [METADATA_ANALYSIS] No transcript provided");
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    console.log("📊 [METADATA_ANALYSIS] Analyzing content for metadata...");
    console.log("📊 [METADATA_ANALYSIS] Transcript length:", transcript.length, "characters");
    console.log("📊 [METADATA_ANALYSIS] Video URL provided:", !!videoUrl);

    const metadata = await analyzeContentMetadata(transcript, videoUrl, additionalContext);

    if (!metadata) {
      return NextResponse.json({ error: "Failed to analyze content metadata" }, { status: 500 });
    }

    console.log("✅ [METADATA_ANALYSIS] Metadata analysis completed successfully");
    console.log("📊 [METADATA_ANALYSIS] Platform detected:", metadata.platform);
    console.log("📊 [METADATA_ANALYSIS] Author detected:", metadata.author);

    return NextResponse.json({
      success: true,
      metadata,
      analysisInfo: {
        transcriptLength: transcript.length,
        hasVideoUrl: !!videoUrl,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [METADATA_ANALYSIS] Metadata analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze content metadata",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function analyzeContentMetadata(
  transcript: string,
  videoUrl?: string,
  additionalContext?: string,
): Promise<ContentMetadata | null> {
  try {
    console.log("🤖 [METADATA_ANALYSIS] Analyzing content metadata with AI...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const analysisContext = buildAnalysisContext(transcript, videoUrl, additionalContext);
    const prompt = createMetadataPrompt(analysisContext);

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text().trim();

    console.log("📄 [METADATA_ANALYSIS] Raw response length:", responseText.length, "characters");

    return parseMetadataResponse(responseText);
  } catch (error) {
    console.error("❌ [METADATA_ANALYSIS] AI analysis error:", error);
    return null;
  }
}

function buildAnalysisContext(transcript: string, videoUrl?: string, additionalContext?: string): string {
  let analysisContext = `Transcript: "${transcript}"`;

  if (videoUrl) {
    analysisContext += `\nVideo URL: ${videoUrl}`;
  }

  if (additionalContext) {
    analysisContext += `\nAdditional Context: ${additionalContext}`;
  }

  return analysisContext;
}

function createMetadataPrompt(analysisContext: string): string {
  return `Analyze this content and extract metadata information:

${analysisContext}

Based on the content, URL patterns, and context clues, determine:

1. **Platform**: Identify if this is TikTok, Instagram, YouTube, or Unknown based on:
   - URL patterns (tiktok.com, instagram.com, youtube.com)
   - Content style and format
   - Typical platform characteristics

2. **Author**: Extract the creator's name or username if mentioned in the transcript or visible in context

3. **Description**: Create a brief description of the video content and purpose

4. **Source Category**: Classify the content type as educational, entertainment, tutorial, lifestyle, business, or other

5. **Hashtags**: Extract or infer relevant hashtags that would be appropriate for this content

Respond with ONLY a valid JSON object in this exact format (no additional text):
{
  "platform": "TikTok|Instagram|YouTube|Unknown",
  "author": "Creator name or @username",
  "description": "Brief description of video content and purpose",
  "source": "educational|entertainment|tutorial|lifestyle|business|other",
  "hashtags": ["relevant", "hashtags", "for", "content"]
}`;
}

function parseMetadataResponse(responseText: string): ContentMetadata {
  try {
    const cleanedJson = cleanJsonResponse(responseText);
    const metadata = JSON.parse(cleanedJson) as ContentMetadata;
    return validateMetadata(metadata);
  } catch (parseError) {
    console.log("⚠️ [METADATA_ANALYSIS] JSON parsing failed, using fallback:", parseError);
    return createFallbackMetadata();
  }
}

function cleanJsonResponse(responseText: string): string {
  let jsonString = responseText;

  // Remove markdown code blocks if present
  jsonString = jsonString.replace(/```json\s*/, "").replace(/```\s*$/, "");

  // Find JSON object boundaries
  const firstBrace = jsonString.indexOf("{");
  const lastBrace = jsonString.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonString = jsonString.substring(firstBrace, lastBrace + 1);
  }

  return jsonString;
}

function validateMetadata(metadata: ContentMetadata): ContentMetadata {
  const validatedMetadata: ContentMetadata = {
    platform: ["TikTok", "Instagram", "YouTube", "Unknown"].includes(metadata.platform) ? metadata.platform : "Unknown",
    author: metadata.author || "Unknown",
    description: metadata.description || "Video content analysis",
    source: ["educational", "entertainment", "tutorial", "lifestyle", "business", "other"].includes(metadata.source)
      ? metadata.source
      : "other",
    hashtags: Array.isArray(metadata.hashtags) ? metadata.hashtags : [],
  };

  console.log("✅ [METADATA_ANALYSIS] Successfully parsed and validated metadata");
  console.log("📊 [METADATA_ANALYSIS] Platform:", validatedMetadata.platform);
  console.log("📊 [METADATA_ANALYSIS] Source:", validatedMetadata.source);
  console.log("📊 [METADATA_ANALYSIS] Hashtags count:", validatedMetadata.hashtags.length);

  return validatedMetadata;
}

function createFallbackMetadata(): ContentMetadata {
  return {
    platform: "Unknown",
    author: "Unknown",
    description: "Video content analysis - metadata extraction failed",
    source: "other",
    hashtags: [],
  };
}
