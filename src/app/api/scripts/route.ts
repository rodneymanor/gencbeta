import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";
import { CreateScriptRequest, Script, ScriptsResponse, ScriptResponse } from "@/types/script";

// Helper function to calculate estimated duration from word count
function calculateDuration(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 150; // Average speaking rate
  const minutes = Math.ceil(words / wordsPerMinute);

  if (minutes < 1) {
    const seconds = Math.ceil((words / wordsPerMinute) * 60);
    return `${seconds}s`;
  }

  return `${minutes}:${String(Math.round(((words % wordsPerMinute) / wordsPerMinute) * 60)).padStart(2, "0")}`;
}

// Helper function to generate script summary
function generateSummary(content: string, maxLength: number = 100): string {
  const cleanContent = content.replace(/\n/g, " ").trim();
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + "..." : truncated + "...";
}

// Helper function to extract category from content or approach
function inferCategory(content: string, approach: string): string {
  const contentLower = content.toLowerCase();

  // Define category keywords
  const categoryMap = [
    { keywords: ["product", "review", "unboxing"], category: "Technology" },
    { keywords: ["cooking", "recipe", "food"], category: "Food" },
    { keywords: ["workout", "fitness", "exercise"], category: "Fitness" },
    { keywords: ["tutorial", "how to", "learn"], category: "Education" },
    { keywords: ["lifestyle", "daily", "routine"], category: "Lifestyle" },
  ];

  // Check for category keywords in content
  for (const { keywords, category } of categoryMap) {
    if (keywords.some((keyword) => contentLower.includes(keyword))) {
      return category;
    }
  }

  // Default based on approach
  const approachMap: Record<string, string> = {
    educational: "Education",
    "speed-write": "Entertainment",
    "ai-voice": "Personal Brand",
  };

  return approachMap[approach] ?? "General";
}

// GET: Fetch user's scripts
export async function GET(request: NextRequest): Promise<NextResponse<ScriptsResponse>> {
  try {
    console.log("📚 [Scripts API] GET request received");

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    console.log("👤 [Scripts API] Fetching scripts for user:", userId);

    // Fetch scripts from Firestore
    const scriptsSnapshot = await adminDb
      .collection("scripts")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

    const scripts: Script[] = scriptsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Script[];

    console.log(`✅ [Scripts API] Found ${scripts.length} scripts for user`);

    return NextResponse.json({
      success: true,
      scripts,
    });
  } catch (error) {
    console.error("❌ [Scripts API] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        scripts: [],
        error: "Failed to fetch scripts",
      },
      { status: 500 },
    );
  }
}

// POST: Create a new script
export async function POST(request: NextRequest): Promise<NextResponse<ScriptResponse>> {
  try {
    console.log("📝 [Scripts API] POST request received");

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    const body: CreateScriptRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: "Title and content are required",
        },
        { status: 400 },
      );
    }

    console.log("💾 [Scripts API] Creating script:", body.title);

    // Calculate derived fields
    const wordCount = body.content.trim().split(/\s+/).length;
    const duration = calculateDuration(body.content);
    const summary = body.summary ?? generateSummary(body.content);
    const category = body.category ?? inferCategory(body.content, body.approach);
    const tags = body.tags ?? [];

    // Create script document
    const timestamp = new Date().toISOString();
    const scriptData: Omit<Script, "id"> = {
      title: body.title,
      content: body.content,
      authors: authResult.user.email || "Unknown",
      status: "draft",
      performance: { views: 0, engagement: 0 },
      category,
      createdAt: timestamp,
      updatedAt: timestamp,
      viewedAt: timestamp,
      duration,
      tags,
      fileType: "Script",
      summary,
      userId,
      approach: body.approach,
      voice: body.voice,
      originalIdea: body.originalIdea,
      targetLength: body.targetLength,
      wordCount,
    };

    // Save to Firestore
    const docRef = await adminDb.collection("scripts").add(scriptData);

    const script: Script = {
      id: docRef.id,
      ...scriptData,
    };

    console.log("✅ [Scripts API] Script created successfully:", docRef.id);

    return NextResponse.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error("❌ [Scripts API] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create script",
      },
      { status: 500 },
    );
  }
}
