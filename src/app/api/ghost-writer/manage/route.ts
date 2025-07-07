import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { GhostWriterService } from "@/lib/ghost-writer-service";

interface ManageIdeaRequest {
  ideaId: string;
  action: "save" | "dismiss";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📝 [GhostWriter] Managing idea...");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const body: ManageIdeaRequest = await request.json();

    if (!body.ideaId || !body.action) {
      return NextResponse.json({ error: "Missing ideaId or action" }, { status: 400 });
    }

    if (!["save", "dismiss"].includes(body.action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'save' or 'dismiss'" }, { status: 400 });
    }

    // Perform the action
    if (body.action === "save") {
      await GhostWriterService.saveIdea(userId, body.ideaId);
      console.log(`💾 [GhostWriter] Saved idea ${body.ideaId} for user ${userId}`);
    } else {
      await GhostWriterService.dismissIdea(userId, body.ideaId);
      console.log(`🗑️ [GhostWriter] Dismissed idea ${body.ideaId} for user ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: `Idea ${body.action}d successfully`,
    });
  } catch (error) {
    console.error("❌ [GhostWriter] Error managing idea:", error);
    return NextResponse.json({ error: "Failed to manage idea" }, { status: 500 });
  }
}
