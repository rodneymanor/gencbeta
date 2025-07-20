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

    // Fetch ideas from both collections with error handling
    let currentIdeasSnapshot;
    let libraryIdeasSnapshot;

    try {
      // 1. Fetch from enhanced_content_ideas (current cycle ideas)
      currentIdeasSnapshot = await adminDb
        .collection("enhanced_content_ideas")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(500)
        .get();
    } catch (error) {
      console.warn("⚠️ [GhostWriter Library] Could not fetch from enhanced_content_ideas:", error);
      currentIdeasSnapshot = { docs: [] } as any;
    }

    try {
      // 2. Fetch from ghost_writer_library (saved historical ideas)
      libraryIdeasSnapshot = await adminDb
        .collection("ghost_writer_library")
        .where("userId", "==", userId)
        .orderBy("savedAt", "desc")
        .limit(500)
        .get();
    } catch (error) {
      console.warn("⚠️ [GhostWriter Library] Could not fetch from ghost_writer_library:", error);
      libraryIdeasSnapshot = { docs: [] } as any;
    }

    // Combine ideas from both sources with safe mapping
    const currentIdeas: EnhancedContentIdea[] = (currentIdeasSnapshot?.docs || []).map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          hook: data.hook || "",
          concept: data.concept || "",
          hookTemplate: data.hookTemplate || "",
          hookStrength: data.hookStrength || "",
          peqCategory: data.peqCategory || "problem",
          sourceText: data.sourceText || "",
          targetAudience: data.targetAudience || "",
          estimatedDuration: data.estimatedDuration || "60",
          createdAt: data.createdAt || new Date().toISOString(),
          userId: data.userId || userId,
          cycleId: data.cycleId || "unknown",
          wordCount: data.wordCount || 0,
          generatedScripts: data.generatedScripts || [],
          lastUsedAt: data.lastUsedAt,
          ...data,
        } as EnhancedContentIdea;
      },
    );

    const libraryIdeas: EnhancedContentIdea[] = (libraryIdeasSnapshot?.docs || []).map(
      (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = doc.data();
        return {
          id: doc.id,
          concept: data.concept || "",
          hook: data.hook || "",
          hookTemplate: data.hookTemplate || "",
          hookStrength: data.hookStrength || "",
          peqCategory: data.peqCategory || "problem",
          sourceText: data.sourceText || "",
          targetAudience: data.targetAudience || "",
          estimatedDuration: data.estimatedDuration || "60",
          createdAt: data.createdAt || data.savedAt || new Date().toISOString(),
          userId: data.userId || userId,
          cycleId: data.cycleId || "library",
          wordCount: data.wordCount || 0,
          savedAt: data.savedAt,
          savedFrom: data.savedFrom,
          generatedScripts: data.generatedScripts || [],
          lastUsedAt: data.lastUsedAt,
        } as EnhancedContentIdea;
      },
    );

    // Merge and deduplicate ideas (prefer library version if duplicate)
    const ideaMap = new Map<string, EnhancedContentIdea>();

    // Add current ideas first
    currentIdeas.forEach((idea) => {
      ideaMap.set(idea.id, idea);
    });

    // Add library ideas (will override if same ID exists)
    libraryIdeas.forEach((idea) => {
      const key = idea.originalIdeaId || idea.id;
      ideaMap.set(key, idea);
    });

    const ideas = Array.from(ideaMap.values()).sort((a, b) => {
      const dateA = new Date(a.savedAt || a.createdAt).getTime();
      const dateB = new Date(b.savedAt || b.createdAt).getTime();
      return dateB - dateA; // Sort by most recent first
    });

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

    // Try to find and delete from either collection
    let deleted = false;

    // First try enhanced_content_ideas collection
    const ideaDoc = await adminDb.collection("enhanced_content_ideas").doc(ideaId).get();

    if (ideaDoc.exists && ideaDoc.data()?.userId === userId) {
      await adminDb.collection("enhanced_content_ideas").doc(ideaId).delete();
      deleted = true;
      console.log(`✅ [GhostWriter Library] Deleted idea from enhanced_content_ideas`);
    }

    // Also try ghost_writer_library collection
    const libraryDoc = await adminDb.collection("ghost_writer_library").doc(ideaId).get();

    if (libraryDoc.exists && libraryDoc.data()?.userId === userId) {
      await adminDb.collection("ghost_writer_library").doc(ideaId).delete();
      deleted = true;
      console.log(`✅ [GhostWriter Library] Deleted idea from ghost_writer_library`);
    }

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Idea not found" }, { status: 404 });
    }

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
