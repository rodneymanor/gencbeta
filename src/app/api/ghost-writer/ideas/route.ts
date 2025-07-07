import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { GhostWriterService } from "@/lib/ghost-writer-service";
import { BrandProfileForIdeas } from "@/types/ghost-writer";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("🎯 [GhostWriter API] Starting to fetch content ideas...");

    // Check if this is a "generate more" request
    const { searchParams } = new URL(request.url);
    const generateMore = searchParams.get("generateMore") === "true";
    console.log("🔄 [GhostWriter API] Generate more request:", generateMore);

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    
    // Check if authResult is a NextResponse (error case)
    if (authResult instanceof NextResponse) {
      console.log("🔐 [GhostWriter API] Auth result: ❌ Authentication failed");
      return authResult;
    }
    
    console.log("🔐 [GhostWriter API] Auth result: ✅ Success");
    const { user } = authResult;
    const userId = user.uid;
    console.log("👤 [GhostWriter API] User ID:", userId);

    // Get current cycle
    console.log("🔄 [GhostWriter API] Getting current cycle...");
    const currentCycle = await GhostWriterService.getCurrentCycle();
    console.log("📅 [GhostWriter API] Current cycle:", currentCycle.id);
    
    // Get user data
    console.log("👤 [GhostWriter API] Getting user data...");
    const userData = await GhostWriterService.getUserData(userId);
    console.log("📊 [GhostWriter API] User data:", { savedIdeas: userData.savedIdeas.length, dismissedIdeas: userData.dismissedIdeas.length });

    // Check if user already has ideas for current cycle
    console.log("💡 [GhostWriter API] Getting existing ideas for cycle...");
    let ideas = await GhostWriterService.getIdeasForUser(userId, currentCycle.id);
    console.log("📝 [GhostWriter API] Found existing ideas:", ideas.length);

    // If no ideas exist for current cycle or user wants to generate more, generate them
    if (ideas.length === 0 || generateMore) {
      console.log(`🔄 [GhostWriter] ${generateMore ? "Generating more ideas" : "No ideas found for cycle"} ${currentCycle.id}, checking brand profile...`);
      
      // Get user's brand profile
      const brandProfile = await getBrandProfileForUser(userId);
      
      let effectiveBrandProfile = brandProfile;

      if (!effectiveBrandProfile) {
        console.log("⚠️ [GhostWriter] Brand profile missing – using default template");

        effectiveBrandProfile = {
          businessProfession: "Content Creator",
          brandPersonality: "Helpful and engaging",
          universalProblem: "Struggling to come up with engaging content ideas",
          initialHurdle: "Generating the first batch of ideas",
          persistentStruggle: "Maintaining consistency in posting",
          visibleTriumph: "Audience growth and engagement",
          ultimateTransformation: "Becoming a recognised authority in their niche",
          contentPillars: [],
          targetAudience: "General social media audience",
          brandVoice: "Friendly",
          industry: "Content Creation",
        };
      }

      // Generate new ideas
      console.log(`🎨 [GhostWriter] Generating ${generateMore ? "additional" : "new"} ideas with brand profile:`, JSON.stringify(effectiveBrandProfile, null, 2));
      const newIdeas = await GhostWriterService.generateIdeasForUser(userId, effectiveBrandProfile, currentCycle.id);
      
      // If generating more, combine with existing ideas
      if (generateMore) {
        ideas = [...ideas, ...newIdeas];
      } else {
        ideas = newIdeas;
      }
      
      // Update user data with new cycle
      await updateUserCycleData(userId, currentCycle.id, newIdeas.length);
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