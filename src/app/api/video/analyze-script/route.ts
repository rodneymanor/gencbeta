import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ScriptComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export async function POST(request: NextRequest) {
  console.log("📝 [SCRIPT_ANALYSIS] Starting script component analysis...");

  try {
    const { transcript } = await request.json();

    if (!transcript) {
      console.error("❌ [SCRIPT_ANALYSIS] No transcript provided");
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    console.log("📊 [SCRIPT_ANALYSIS] Analyzing transcript of length:", transcript.length, "characters");

    const components = await analyzeScriptComponents(transcript);

    if (!components) {
      return NextResponse.json({ error: "Failed to analyze script components" }, { status: 500 });
    }

    console.log("✅ [SCRIPT_ANALYSIS] Script analysis completed successfully");

    return NextResponse.json({
      success: true,
      components,
      metadata: {
        transcriptLength: transcript.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [SCRIPT_ANALYSIS] Script analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze script components",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function analyzeScriptComponents(transcript: string): Promise<ScriptComponents | null> {
  try {
    console.log("🤖 [SCRIPT_ANALYSIS] Analyzing script components with AI...");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-exp",
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ],
    });

    const prompt = `Analyze this video transcript and break it down into these four essential script components:

1. **HOOK** (Attention-Grabbing Opener): Extract or identify the part that captures attention within the first 3-5 seconds. If not clear, create an optimized hook based on the content.

2. **BRIDGE** (Connecting the Hook to the Core Idea): Find the transition that connects the opening to the main content.

3. **GOLDEN NUGGET** (The Core Lesson or Strategy): Identify the main valuable insight, tip, or takeaway from the content.

4. **WTA** (Call to Action / Concluding Thought): Find the ending that drives action or leaves a lasting impression.

Transcript to analyze:
"${transcript}"

Respond with ONLY a valid JSON object in this exact format (no additional text):
{
  "hook": "The extracted or optimized hook text",
  "bridge": "The bridge text connecting hook to main content",
  "nugget": "The core valuable insight or lesson",
  "wta": "The call to action or concluding thought"
}`;

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text().trim();

    console.log("📄 [SCRIPT_ANALYSIS] Raw response length:", responseText.length, "characters");

    try {
      // Clean and parse JSON response
      let jsonString = responseText;

      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```json\s*/, "").replace(/```\s*$/, "");

      // Find JSON object boundaries
      const firstBrace = jsonString.indexOf("{");
      const lastBrace = jsonString.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }

      const components = JSON.parse(jsonString) as ScriptComponents;

      console.log("✅ [SCRIPT_ANALYSIS] Successfully parsed script components");
      console.log("📊 [SCRIPT_ANALYSIS] Components extracted:", Object.keys(components));

      return components;
    } catch (parseError) {
      console.log("⚠️ [SCRIPT_ANALYSIS] JSON parsing failed, using fallback:", parseError);

      // Return fallback components
      return {
        hook: "Unable to extract hook from content",
        bridge: "Unable to extract bridge from content",
        nugget: "Unable to extract golden nugget from content",
        wta: "Unable to extract WTA from content",
      };
    }
  } catch (error) {
    console.error("❌ [SCRIPT_ANALYSIS] AI analysis error:", error);
    return null;
  }
}
