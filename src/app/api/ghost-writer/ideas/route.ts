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
      .collection("brand_profiles")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const brandData = snapshot.docs[0].data();
    
    // Map brand profile to the format needed for idea generation
    return {
      businessProfession: brandData.businessDescription || brandData.industry || "Content Creator",
      brandPersonality: brandData.brandVoice || brandData.personality || "Professional and helpful",
      universalProblem: brandData.targetAudience?.painPoints?.[0] || "Struggling to create engaging content",
      initialHurdle: brandData.targetAudience?.challenges?.[0] || "Getting started with content creation",
      persistentStruggle: brandData.targetAudience?.painPoints?.[1] || "Maintaining consistent content quality",
      visibleTriumph: brandData.goals?.[0] || "Building a strong online presence",
      ultimateTransformation: brandData.vision || "Becoming a recognized authority in their field",
      contentPillars: brandData.contentPillars || [],
      targetAudience: brandData.targetAudience?.description || "Content creators and entrepreneurs",
      brandVoice: brandData.brandVoice || "Professional and approachable",
      industry: brandData.industry || "Content Creation",
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