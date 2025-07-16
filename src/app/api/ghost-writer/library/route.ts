import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { EnhancedGhostWriterService, EnhancedContentIdea } from "@/lib/enhanced-ghost-writer-service";
import { adminDb } from "@/lib/firebase-admin";

interface LibraryStats {
  totalIdeas: number;
  totalCycles: number;
  hookTemplatesUsed: string[];
  generationHistory: Array<{ date: string; count: number }>;
}

interface LibraryResponse {
  success: boolean;
  ideas?: EnhancedContentIdea[];
  stats?: LibraryStats;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<LibraryResponse>> {
  try {
    console.log("📚 [GhostWriter Library] Starting library data fetch");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<LibraryResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    console.log(`👤 [GhostWriter Library] Fetching library for user: ${userId}`);

    // Fetch all historical ideas for the user
    const ideasSnapshot = await adminDb
      .collection("enhanced_content_ideas")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1000) // Limit to prevent overwhelming the UI
      .get();

    const ideas: EnhancedContentIdea[] = ideasSnapshot.docs.map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as EnhancedContentIdea,
    );

    console.log(`📊 [GhostWriter Library] Found ${ideas.length} historical ideas`);

    // Calculate statistics
    const stats = calculateLibraryStats(ideas);

    console.log(`✅ [GhostWriter Library] Returning ${ideas.length} ideas with stats`);

    return NextResponse.json({
      success: true,
      ideas,
      stats,
    });
  } catch (error) {
    console.error("❌ [GhostWriter Library] Error fetching library data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch library data",
      },
      { status: 500 },
    );
  }
}

function calculateLibraryStats(ideas: EnhancedContentIdea[]): LibraryStats {
  // Get unique cycle IDs
  const uniqueCycles = new Set(ideas.map((idea) => idea.cycleId));

  // Get unique hook templates
  const hookTemplates = ideas
    .map((idea) => idea.hookTemplate)
    .filter((template): template is string => Boolean(template))
    .filter((template, index, arr) => arr.indexOf(template) === index);

  // Calculate generation history (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const generationHistory: Array<{ date: string; count: number }> = [];

  // Group ideas by date
  const ideasByDate: Record<string, number> = {};

  ideas.forEach((idea) => {
    const ideaDate = new Date(idea.createdAt);
    if (ideaDate >= thirtyDaysAgo) {
      const dateKey = ideaDate.toISOString().split("T")[0]; // YYYY-MM-DD format
      ideasByDate[dateKey] = (ideasByDate[dateKey] || 0) + 1;
    }
  });

  // Convert to array format
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    generationHistory.push({
      date: dateKey,
      count: ideasByDate[dateKey] || 0,
    });
  }

  return {
    totalIdeas: ideas.length,
    totalCycles: uniqueCycles.size,
    hookTemplatesUsed: hookTemplates,
    generationHistory,
  };
}

export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    console.log("🗑️ [GhostWriter Library] Starting idea deletion");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<{ success: boolean; error?: string }>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse request body
    const body = await request.json();
    const { ideaId } = body;

    if (!ideaId) {
      return NextResponse.json({ success: false, error: "Idea ID is required" }, { status: 400 });
    }

    console.log(`🗑️ [GhostWriter Library] Deleting idea ${ideaId} for user ${userId}`);

    // Verify the idea belongs to the user and delete it
    const ideaDoc = await adminDb.collection("enhanced_content_ideas").doc(ideaId).get();

    if (!ideaDoc.exists) {
      return NextResponse.json({ success: false, error: "Idea not found" }, { status: 404 });
    }

    const ideaData = ideaDoc.data();
    if (ideaData?.userId !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized to delete this idea" }, { status: 403 });
    }

    // Delete the idea
    await adminDb.collection("enhanced_content_ideas").doc(ideaId).delete();

    console.log(`✅ [GhostWriter Library] Successfully deleted idea ${ideaId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [GhostWriter Library] Error deleting idea:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete idea",
      },
      { status: 500 },
    );
  }
}
