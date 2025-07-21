import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { EnhancedGhostWriterService, EnhancedContentIdea } from "@/lib/enhanced-ghost-writer-service";
import { adminDb } from "@/lib/firebase-admin";
import { GhostWriterService } from "@/lib/ghost-writer-service";
import { BrandProfile } from "@/types/brand-profile";

// In-memory cache to prevent concurrent requests
const activeRequests = new Map<string, Promise<NextResponse<EnhancedGhostWriterResponse>>>();

interface EnhancedGhostWriterResponse {
  success: boolean;
  ideas?: EnhancedContentIdea[];
  cycle?: {
    id: string;
    expiresAt: string;
    timeRemaining: number;
  };
  userData?: {
    savedIdeas: string[];
    dismissedIdeas: string[];
  };
  error?: string;
  metadata?: {
    peqEnabled: boolean;
    voiceActive: boolean;
    conceptsGenerated: number;
    hooksGenerated: number;
    processingTime: number;
  };
}

const createLegacyFallbackResponse = async (
  request: NextRequest,
): Promise<NextResponse<EnhancedGhostWriterResponse>> => {
  // Clone headers to plain object to avoid issues with reusing the same Headers instance
  const forwardHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    forwardHeaders[key] = value;
  });

  const legacyResponse = await fetch(new URL("/api/ghost-writer/ideas", request.url), {
    method: "GET",
    headers: forwardHeaders,
  });

  if (legacyResponse.ok) {
    const legacyData = await legacyResponse.json();
    return NextResponse.json({
      success: legacyData.success,
      ideas: legacyData.ideas?.map((idea: any) => ({
        ...idea,
        concept: idea.description ?? idea.hook,
        hook: idea.hook ?? idea.description,
        peqCategory: "problem" as const,
        sourceText: "Legacy content",
        wordCount: (idea.scriptOutline ?? idea.description ?? "").split(/\s+/).length,
      })),
      cycle: legacyData.cycle,
      userData: legacyData.userData || { savedIdeas: [], dismissedIdeas: [] },
      error: legacyData.error,
      metadata: {
        peqEnabled: false,
        voiceActive: false,
        conceptsGenerated: legacyData.ideas?.length ?? 0,
        hooksGenerated: legacyData.ideas?.length ?? 0,
        processingTime: 0,
      },
    });
  } else {
    throw new Error("Failed to get legacy Ghost Writer data");
  }
};

export async function GET(request: NextRequest): Promise<NextResponse<EnhancedGhostWriterResponse>> {
  // Authenticate user first to get userId for deduplication
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) {
    return authResult as NextResponse<EnhancedGhostWriterResponse>;
  }

  const { user } = authResult;
  const userId = user.uid;

  // Create request key for deduplication
  const url = new URL(request.url);
  const generateMore = url.searchParams.get("generateMore") === "true";
  const refresh = url.searchParams.get("refresh") === "true";
  const requestKey = `${userId}-${generateMore ? "generateMore" : refresh ? "refresh" : "default"}`;

  // Check if there's already an active request for this user/type
  if (activeRequests.has(requestKey)) {
    console.log(`🔄 [EnhancedGhostWriter] Deduplicating request for user: ${userId}, type: ${requestKey}`);
    return await activeRequests.get(requestKey)!;
  }

  // Create the actual request handler
  const requestPromise = handleGhostWriterRequest(request, userId, generateMore, refresh);

  // Store the promise in the cache
  activeRequests.set(requestKey, requestPromise);

  // Clean up cache after request completes (success or failure)
  requestPromise.finally(() => {
    activeRequests.delete(requestKey);
  });

  return await requestPromise;
}

async function handleGhostWriterRequest(
  request: NextRequest,
  userId: string,
  generateMore: boolean,
  refresh: boolean,
): Promise<NextResponse<EnhancedGhostWriterResponse>> {
  try {
    console.log("🚀 [EnhancedGhostWriter] API request received");
    console.log(`👤 [EnhancedGhostWriter] Processing request for user: ${userId}`);

    // Get current global cycle
    const currentCycle = await GhostWriterService.getCurrentCycle();
    console.log(`🔄 [EnhancedGhostWriter] Current cycle: ${currentCycle.id}`);

    // Check if user has brand profile
    const brandProfileSnapshot = await adminDb
      .collection("brandProfiles")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (brandProfileSnapshot.empty) {
      console.log("⚠️ [EnhancedGhostWriter] No brand profile found, falling back to legacy system");
      return createLegacyFallbackResponse(request);
    }

    const brandProfile = {
      id: brandProfileSnapshot.docs[0].id,
      ...brandProfileSnapshot.docs[0].data(),
    } as BrandProfile;

    console.log("✅ [EnhancedGhostWriter] Brand profile found, using PEQ system");

    // Get user's active voice
    const activeVoice = await GhostWriterService.getActiveVoice(userId);
    console.log(`🎤 [EnhancedGhostWriter] Active voice: ${activeVoice ? activeVoice.name : "None"}`);

    // Check if user already has ideas for this cycle
    const existingIdeas = await EnhancedGhostWriterService.getEnhancedIdeasForUser(userId, currentCycle.id);

    // Also check if user has ideas from previous cycles that should be archived
    const allUserIdeas = await EnhancedGhostWriterService.getAllUserIdeas(userId);
    const previousCycleIdeas = allUserIdeas.filter(idea => idea.cycleId !== currentCycle.id);
    
    // Save any previous cycle ideas to library
    if (previousCycleIdeas.length > 0) {
      await EnhancedGhostWriterService.saveIdeasToLibrary(userId, previousCycleIdeas, "cycle_expiry");
      console.log(`📚 [EnhancedGhostWriter] Archived ${previousCycleIdeas.length} ideas from previous cycles to library`);
    }

    let ideas: EnhancedContentIdea[] = existingIdeas;

    // Generate new ideas if none exist, if generateMore is requested, or if refresh is requested
    if (existingIdeas.length === 0 || generateMore || refresh) {
      console.log(
        `💡 [EnhancedGhostWriter] Generating ${refresh ? "refreshed" : generateMore ? "replacement" : "new"} ideas`,
      );

      // If generateMore is requested, save current ideas to library first
      if (generateMore && existingIdeas.length > 0) {
        await EnhancedGhostWriterService.saveIdeasToLibrary(userId, existingIdeas, "generate_more");
        console.log(`📚 [EnhancedGhostWriter] Saved ${existingIdeas.length} existing ideas to library`);
      }

      const generationResult = await EnhancedGhostWriterService.generateEnhancedIdeas(
        userId,
        brandProfile,
        currentCycle.id,
        activeVoice,
      );

      if (generationResult.success && generationResult.ideas) {
        if (refresh) {
          // Replace all existing ideas with new ones
          ideas = generationResult.ideas;
        } else if (generateMore) {
          // Replace existing ideas with new ones (old ones are saved to library)
          ideas = generationResult.ideas;
        } else {
          ideas = generationResult.ideas;
        }

        console.log(
          `✅ [EnhancedGhostWriter] Generated ${generationResult.ideas.length} ${refresh ? "refreshed" : "new"} ideas`,
        );
      } else {
        console.error("❌ [EnhancedGhostWriter] Failed to generate ideas:", generationResult.error);
        throw new Error(generationResult.error ?? "Failed to generate ideas");
      }
    } else {
      console.log(`📋 [EnhancedGhostWriter] Using ${existingIdeas.length} existing ideas`);
    }

    // Calculate time remaining in cycle
    const now = new Date();
    const expiresAt = new Date(currentCycle.expiresAt);
    const timeRemaining = Math.max(0, expiresAt.getTime() - now.getTime());

    // Get user data (saved and dismissed ideas)
    const userDataSnapshot = await adminDb.collection("users").doc(userId).get();

    const userData = userDataSnapshot.exists ? userDataSnapshot.data() : { savedIdeas: [], dismissedIdeas: [] };

    console.log(`🎉 [EnhancedGhostWriter] Returning ${ideas.length} ideas`);

    return NextResponse.json({
      success: true,
      ideas,
      cycle: {
        id: currentCycle.id,
        expiresAt: currentCycle.expiresAt,
        timeRemaining,
      },
      userData: {
        savedIdeas: userData.savedIdeas || [],
        dismissedIdeas: userData.dismissedIdeas || [],
      },
      metadata: {
        peqEnabled: true,
        voiceActive: !!activeVoice,
        conceptsGenerated: ideas.length,
        hooksGenerated: ideas.filter((idea) => idea.hookTemplate !== "Concept").length,
        processingTime: 0,
      },
    });
  } catch (error) {
    console.error("❌ [EnhancedGhostWriter] API error:", error);

    // Attempt legacy fallback if enhanced pipeline fails
    try {
      console.log("🔄 [EnhancedGhostWriter] Falling back to legacy ideas after error");
      return await createLegacyFallbackResponse(request);
    } catch (fallbackError) {
      console.error("❌ [EnhancedGhostWriter] Legacy fallback also failed:", fallbackError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        metadata: {
          peqEnabled: false,
          voiceActive: false,
          conceptsGenerated: 0,
          hooksGenerated: 0,
          processingTime: 0,
        },
      },
      { status: 500 },
    );
  }
}
