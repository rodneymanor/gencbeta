import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";

interface TrackUsageRequest {
  ideaId: string;
  action: "script_generation" | "view" | "save" | "dismiss";
  scriptData?: {
    optionA?: {
      content: string;
      estimatedDuration: string;
    };
    optionB?: {
      content: string;
      estimatedDuration: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { ideaId, action, scriptData }: TrackUsageRequest = await request.json();

    if (!ideaId || !action) {
      return NextResponse.json({ success: false, error: "Missing required fields: ideaId, action" }, { status: 400 });
    }

    console.log(`📊 [GhostWriter Usage] Tracking ${action} for idea ${ideaId} by user ${user.uid}`);

    // Get the idea document
    const ideaRef = adminDb.collection("enhanced_content_ideas").doc(ideaId);
    const ideaDoc = await ideaRef.get();

    if (!ideaDoc.exists) {
      return NextResponse.json({ success: false, error: "Idea not found" }, { status: 404 });
    }

    const ideaData = ideaDoc.data();

    // Verify the idea belongs to the user
    if (ideaData?.userId !== user.uid) {
      return NextResponse.json({ success: false, error: "Unauthorized access to idea" }, { status: 403 });
    }

    // Track the usage based on action type
    const now = new Date().toISOString();

    if (action === "script_generation") {
      // Add to generated scripts array
      const currentScripts = ideaData.generatedScripts || [];
      const newScriptEntry = {
        generatedAt: now,
        optionA: scriptData?.optionA || null,
        optionB: scriptData?.optionB || null,
      };

      await ideaRef.update({
        generatedScripts: [...currentScripts, newScriptEntry],
        lastUsedAt: now,
        updatedAt: now,
      });

      console.log(`✅ [GhostWriter Usage] Script generation tracked for idea ${ideaId}`);
    } else {
      // Track other actions (view, save, dismiss)
      const updateData: any = {
        [`last${action.charAt(0).toUpperCase() + action.slice(1)}At`]: now,
        updatedAt: now,
      };

      await ideaRef.update(updateData);

      console.log(`✅ [GhostWriter Usage] ${action} tracked for idea ${ideaId}`);
    }

    // Update user stats
    const userRef = adminDb.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};

    if (action === "script_generation") {
      const currentUsedIdeas = userData.usedIdeas || [];
      if (!currentUsedIdeas.includes(ideaId)) {
        await userRef.update({
          usedIdeas: [...currentUsedIdeas, ideaId],
          totalIdeasUsed: (userData.totalIdeasUsed || 0) + 1,
          lastUsedIdeaAt: now,
          updatedAt: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${action} tracked successfully`,
      timestamp: now,
    });
  } catch (error) {
    console.error("❌ [GhostWriter Usage] Error tracking usage:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to track usage",
      },
      { status: 500 },
    );
  }
}
