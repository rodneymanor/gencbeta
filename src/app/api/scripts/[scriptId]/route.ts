import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";
import { UpdateScriptRequest, Script, ScriptResponse } from "@/types/script";

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

// GET: Fetch a specific script
export async function GET(
  request: NextRequest,
  { params }: { params: { scriptId: string } },
): Promise<NextResponse<ScriptResponse>> {
  try {
    console.log("📖 [Script API] GET request for script:", params.scriptId);

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;

    // Fetch script from Firestore
    const scriptDoc = await adminDb.collection("scripts").doc(params.scriptId).get();

    if (!scriptDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Script not found",
        },
        { status: 404 },
      );
    }

    const scriptData = scriptDoc.data() as Omit<Script, "id">;

    // Verify ownership
    if (scriptData.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      );
    }

    // Update viewedAt timestamp
    await adminDb.collection("scripts").doc(params.scriptId).update({
      viewedAt: new Date().toISOString(),
    });

    const script: Script = {
      id: params.scriptId,
      ...scriptData,
      viewedAt: new Date().toISOString(),
    };

    console.log("✅ [Script API] Script fetched successfully");

    return NextResponse.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error("❌ [Script API] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch script",
      },
      { status: 500 },
    );
  }
}

// Helper function to prepare update data
function prepareUpdateData(body: UpdateScriptRequest): Partial<Script> {
  const updateData: Partial<Script> = {
    updatedAt: new Date().toISOString(),
    ...(body.title && { title: body.title }),
    ...(body.category && { category: body.category }),
    ...(body.tags && { tags: body.tags }),
    ...(body.summary && { summary: body.summary }),
    ...(body.status && { status: body.status }),
  };

  // Handle content update separately due to additional calculations
  if (body.content) {
    updateData.content = body.content;
    updateData.duration = calculateDuration(body.content);
    updateData.wordCount = body.content.trim().split(/\s+/).length;
  }

  return updateData;
}

// PUT: Update a script
export async function PUT(
  request: NextRequest,
  { params }: { params: { scriptId: string } },
): Promise<NextResponse<ScriptResponse>> {
  try {
    console.log("✏️ [Script API] PUT request for script:", params.scriptId);

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;
    const body: UpdateScriptRequest = await request.json();

    // Fetch existing script to verify ownership
    const scriptDoc = await adminDb.collection("scripts").doc(params.scriptId).get();

    if (!scriptDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Script not found",
        },
        { status: 404 },
      );
    }

    const existingData = scriptDoc.data() as Omit<Script, "id">;

    // Verify ownership
    if (existingData.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      );
    }

    console.log("💾 [Script API] Updating script:", body.title ?? existingData.title);

    // Prepare and apply update
    const updateData = prepareUpdateData(body);
    await adminDb.collection("scripts").doc(params.scriptId).update(updateData);

    // Fetch updated script
    const updatedDoc = await adminDb.collection("scripts").doc(params.scriptId).get();
    const script: Script = {
      id: params.scriptId,
      ...updatedDoc.data(),
    } as Script;

    console.log("✅ [Script API] Script updated successfully");

    return NextResponse.json({
      success: true,
      script,
    });
  } catch (error) {
    console.error("❌ [Script API] PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update script",
      },
      { status: 500 },
    );
  }
}

// DELETE: Delete a script
export async function DELETE(
  request: NextRequest,
  { params }: { params: { scriptId: string } },
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    console.log("🗑️ [Script API] DELETE request for script:", params.scriptId);

    // Authenticate API key
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const userId = authResult.user.uid;

    // Fetch script to verify ownership
    const scriptDoc = await adminDb.collection("scripts").doc(params.scriptId).get();

    if (!scriptDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Script not found",
        },
        { status: 404 },
      );
    }

    const scriptData = scriptDoc.data() as Omit<Script, "id">;

    // Verify ownership
    if (scriptData.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Access denied",
        },
        { status: 403 },
      );
    }

    // Delete from Firestore
    await adminDb.collection("scripts").doc(params.scriptId).delete();

    console.log("✅ [Script API] Script deleted successfully");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ [Script API] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete script",
      },
      { status: 500 },
    );
  }
}
