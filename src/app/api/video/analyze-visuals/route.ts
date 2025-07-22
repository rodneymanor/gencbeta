import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  console.log("👁️ [VISUAL_ANALYSIS] Starting visual content analysis...");

  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      return await handleUrlVisualAnalysis(request);
    } else {
      return await handleFileVisualAnalysis(request);
    }
  } catch (error) {
    console.error("❌ [VISUAL_ANALYSIS] Visual analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze visual content",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function handleUrlVisualAnalysis(request: NextRequest) {
  const { videoUrl } = await request.json();

  if (!videoUrl) {
    console.error("❌ [VISUAL_ANALYSIS] No video URL provided");
    return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
  }

  console.log("🌐 [VISUAL_ANALYSIS] Analyzing visuals from URL:", videoUrl);

  try {
    // Download video from URL
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const visualContext = await analyzeVideoVisuals(arrayBuffer, "video/mp4");

    if (!visualContext) {
      return NextResponse.json({ error: "Failed to analyze visual content from URL" }, { status: 500 });
    }

    console.log("✅ [VISUAL_ANALYSIS] URL visual analysis completed");

    return NextResponse.json({
      success: true,
      visualContext,
      metadata: {
        method: "url",
        videoUrl,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [VISUAL_ANALYSIS] URL visual analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze visual content from URL" }, { status: 500 });
  }
}

async function handleFileVisualAnalysis(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video") as File;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!file) {
    console.error("❌ [VISUAL_ANALYSIS] No video file provided");
    return NextResponse.json({ error: "Video file is required" }, { status: 400 });
  }

  console.log("📁 [VISUAL_ANALYSIS] File info:");
  console.log("  - Name:", file.name);
  console.log("  - Size:", Math.round((file.size / 1024 / 1024) * 100) / 100, "MB");
  console.log("  - Type:", file.type);

  // Check file size limit (20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    console.error("❌ [VISUAL_ANALYSIS] File too large:", file.size, "bytes");
    return NextResponse.json({ error: "Video file is too large (max 20MB)" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const visualContext = await analyzeVideoVisuals(arrayBuffer, file.type);

    if (!visualContext) {
      return NextResponse.json({ error: "Failed to analyze visual content from file" }, { status: 500 });
    }

    console.log("✅ [VISUAL_ANALYSIS] File visual analysis completed");

    return NextResponse.json({
      success: true,
      visualContext,
      metadata: {
        method: "file",
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [VISUAL_ANALYSIS] File visual analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze visual content from file" }, { status: 500 });
  }
}

async function analyzeVideoVisuals(arrayBuffer: ArrayBuffer, mimeType: string): Promise<string | null> {
  try {
    console.log("🤖 [VISUAL_ANALYSIS] Analyzing visual elements with AI...");

    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze the visual elements in this video and provide a comprehensive description including:

1. **Scene Description**: Describe the overall setting, environment, and visual style
2. **Text Overlays**: Identify any text, captions, or graphics overlaid on the video
3. **Visual Transitions**: Note any scene changes, cuts, or visual effects
4. **Key Visual Elements**: Describe important objects, people, or visual focal points
5. **Color Scheme & Style**: Note the overall visual aesthetic and color palette
6. **Technical Aspects**: Comment on video quality, framing, and production style

Focus on describing what you see without interpreting the content's meaning.
Provide a detailed but concise description that would help someone understand the visual aspects of the video.

Respond with a comprehensive visual description (no JSON formatting needed).`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType || "video/mp4",
          data: base64Data,
        },
      },
    ]);

    const visualContext = result.response.text().trim();

    console.log("✅ [VISUAL_ANALYSIS] Visual analysis generated successfully");
    console.log("📊 [VISUAL_ANALYSIS] Description length:", visualContext.length, "characters");

    return visualContext;
  } catch (error) {
    console.error("❌ [VISUAL_ANALYSIS] AI visual analysis error:", error);
    return null;
  }
}
