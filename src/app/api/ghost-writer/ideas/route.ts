import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { GhostWriterService } from "@/lib/ghost-writer-service";
import { BrandProfileForIdeas } from "@/types/ghost-writer";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🎯 [GhostWriter] Fetching content ideas...");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    // Get current cycle
    const currentCycle = await GhostWriterService.getCurrentCycle();
    
    // Get user data
    const userData = await GhostWriterService.getUserData(userId);

    // Check if user already has ideas for current cycle
    let ideas = await GhostWriterService.getIdeasForUser(userId, currentCycle.id);

    // If no ideas exist for current cycle, generate them
    if (ideas.length === 0) {
      console.log(`🔄 [GhostWriter] No ideas found for cycle ${currentCycle.id}, checking brand profile...`);
      
      // Get user's brand profile
      const brandProfile = await getBrandProfileForUser(userId);
      
      if (!brandProfile) {
        return NextResponse.json(
          { 
            error: "Brand profile not found. Please complete your brand profile first.",
            needsBrandProfile: true 
          },
          { status: 400 }
        );
      }

      // Generate new ideas
      console.log(`🎨 [GhostWriter] Generating ideas with brand profile:`, JSON.stringify(brandProfile, null, 2));
      ideas = await GhostWriterService.generateIdeasForUser(userId, brandProfile, currentCycle.id);
      
      // Update user data with new cycle
      await updateUserCycleData(userId, currentCycle.id, ideas.length);
    }

    // Filter out dismissed ideas
    const filteredIdeas = ideas.filter(idea => !userData.dismissedIdeas.includes(idea.id));

    console.log(`✅ [GhostWriter] Returning ${filteredIdeas.length} ideas for user ${userId}`);

    return NextResponse.json({
      success: true,
      ideas: filteredIdeas,
      cycle: currentCycle,
      userData: {
        savedIdeas: userData.savedIdeas,
        dismissedIdeas: userData.dismissedIdeas,
      }
    });

  } catch (error) {
    console.error("❌ [GhostWriter] Error fetching ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch content ideas" },
      { status: 500 }
    );
  }
}

async function getBrandProfileForUser(userId: string): Promise<BrandProfileForIdeas | null> {
  try {
    // Import here to avoid circular dependencies
    const { adminDb } = await import("@/lib/firebase-admin");
    
    const snapshot = await adminDb
      .collection("brandProfiles")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const brandData = snapshot.docs[0].data();
    console.log("🔍 [GhostWriter] Found brand profile data:", JSON.stringify(brandData, null, 2));
    
    // Map brand profile to the format needed for idea generation
    const questionnaire = brandData.questionnaire || {};
    const profile = brandData.profile || {};
    
    console.log("🔍 [GhostWriter] Mapped questionnaire:", JSON.stringify(questionnaire, null, 2));
    console.log("🔍 [GhostWriter] Mapped profile:", JSON.stringify(profile, null, 2));
    
    return {
      businessProfession: questionnaire.profession || "Content Creator",
      brandPersonality: questionnaire.brandPersonality || "Professional and helpful",
      universalProblem: questionnaire.universalProblem || "Struggling to create engaging content",
      initialHurdle: questionnaire.initialHurdle || "Getting started with content creation",
      persistentStruggle: questionnaire.persistentStruggle || "Maintaining consistent content quality",
      visibleTriumph: questionnaire.visibleTriumph || "Building a strong online presence",
      ultimateTransformation: questionnaire.ultimateTransformation || "Becoming a recognized authority in their field",
      contentPillars: profile.content_pillars?.map((pillar: any) => pillar.pillar_name) || [],
      targetAudience: "Content creators and entrepreneurs",
      brandVoice: questionnaire.brandPersonality || "Professional and approachable",
      industry: questionnaire.profession || "Content Creation",
    };
  } catch (error) {
    console.error("❌ [GhostWriter] Error fetching brand profile:", error);
    return null;
  }
}

async function updateUserCycleData(userId: string, cycleId: string, ideasGenerated: number): Promise<void> {
  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    
    const snapshot = await adminDb
      .collection("user_ghost_writer_data")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      await adminDb
        .collection("user_ghost_writer_data")
        .doc(snapshot.docs[0].id)
        .update({
          currentCycleId: cycleId,
          lastAccessedAt: new Date().toISOString(),
          totalIdeasGenerated: (userData.totalIdeasGenerated || 0) + ideasGenerated,
          updatedAt: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("❌ [GhostWriter] Error updating user cycle data:", error);
  }
} 