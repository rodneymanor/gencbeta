/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { GeminiService } from "@/lib/gemini";
import type { BrandQuestionnaire, BrandProfileData, BrandProfile } from "@/types/brand-profile";

const adminAuth = getAdminAuth();
const adminDb = getAdminDb();

const SYSTEM_PROMPT = `You are an expert brand and content strategist. Your task is to analyze a user's business profile and generate a foundational brand strategy profile in a valid JSON format. This profile will include core keywords and a set of personalized content pillar themes.

Your expertise includes:
- Distilling core business challenges into strategic content themes.
- Keyword research based on audience psychology.
- Structuring brand messaging around customer pain points and aspirations.

CRITICAL: You must output a valid JSON object. The content_pillars array in your response must contain exactly the five pillars listed below. Do not create new pillars. Your main job is to populate the suggested_themes array for each pillar with 3-4 unique, personalized content themes that are directly derived from the user's information. A "theme" is a recurring topic or angle the user can create many pieces of content about.

Your JSON output must follow this EXACT structure:
{
  "core_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "audience_keywords": ["audience-term1", "audience-term2", "audience-term3", "audience-term4"],
  "problem_aware_keywords": ["problem1", "problem2", "problem3", "problem4"],
  "solution_aware_keywords": ["solution1", "solution2", "solution3", "solution4"],
  "content_pillars": [
    {
      "pillar_name": "Hyper-Focused Value",
      "description": "Provide an in-depth look at a specific topic in your niche, delivering actionable advice.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Quick-Hit Value",
      "description": "Share quick, high-impact tips that provide immediate value to the audience.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Major Perspective",
      "description": "Educate and convince your audience about the value of your entire industry or niche.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "The Trend",
      "description": "Cover trending topics in artificial intelligence and emerging tech that impact your industry.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Inspiration Bomb",
      "description": "Change perspectives and inspire people to take action. The ending should feel like a mic-drop.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    }
  ],
  "suggested_hashtags": {
    "broad": ["hashtag1", "hashtag2", "hashtag3"],
    "niche": ["niche1", "niche2", "niche3"],
    "community": ["community1", "community2", "community3"]
  }
}

Return ONLY the JSON object, no additional text or formatting.`;

function createUserPrompt(data: BrandQuestionnaire): string {
  return `Analyze the following customer profile and generate a comprehensive brand strategy profile.

**Customer Context:**
PROFESSION/BUSINESS: ${data.profession}
BRAND PERSONALITY: ${data.brandPersonality}

**Customer's Landscape (Based on Onboarding Questionnaire):**

1. **THE UNIVERSAL PROBLEM (Common challenge for a broad audience):**
   ${data.universalProblem}

2. **THE INITIAL HURDLE (Biggest obstacle to getting started):**
   ${data.initialHurdle}

3. **THE PERSISTENT STRUGGLE (Ongoing problem for existing clients):**
   ${data.persistentStruggle}

4. **THE VISIBLE TRIUMPH (Public-facing result the client desires):**
   ${data.visibleTriumph}

5. **THE ULTIMATE TRANSFORMATION (Life-altering impact the client wants):**
   ${data.ultimateTransformation}

Based on this information, generate the required JSON object with personalized content themes for each pillar.`;
}

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return decodedToken.uid;
}

// GET - Fetch user's brand profiles
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateUser(request);
    console.log("📋 [BRAND] Fetching profiles for user:", userId);

    const profilesSnapshot = await adminDb
      .collection("brandProfiles")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const profiles: BrandProfile[] = profilesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BrandProfile[];

    return NextResponse.json({
      success: true,
      profiles,
      activeProfile: profiles.find((p) => p.isActive) ?? null,
    });
  } catch (error) {
    console.error("❌ [BRAND] Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: error instanceof Error && error.message === "Missing authorization header" ? 401 : 500 },
    );
  }
}

async function validateQuestionnaire(questionnaire: BrandQuestionnaire) {
  const requiredFields: (keyof BrandQuestionnaire)[] = [
    "profession",
    "brandPersonality",
    "universalProblem",
    "initialHurdle",
    "persistentStruggle",
    "visibleTriumph",
    "ultimateTransformation",
  ];

  for (const field of requiredFields) {
    const fieldValue = questionnaire[field];
    if (!fieldValue || typeof fieldValue !== "string" || !fieldValue.trim()) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

async function generateProfileWithGemini(questionnaire: BrandQuestionnaire): Promise<BrandProfileData> {
  console.log("🎯 [BRAND] Generating brand profile with Gemini 2 Pro...");

  const geminiService = new GeminiService();
  const userPrompt = createUserPrompt(questionnaire);

  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash-preview-0514";
  const geminiResponse = await geminiService.generateContent({
    prompt: userPrompt,
    systemPrompt: SYSTEM_PROMPT,
    model: modelName,
  });

  try {
    // Clean the response by removing markdown code blocks
    const cleanedContent = cleanMarkdownCodeBlocks(geminiResponse.content);
    const profileData = JSON.parse(cleanedContent);
    console.log("✅ [BRAND] Successfully parsed AI response");
    return profileData;
  } catch (parseError) {
    console.error("❌ [BRAND] Failed to parse AI response:", parseError);
    console.error("❌ [BRAND] Raw response:", geminiResponse.content);
    throw new Error("Failed to generate valid brand profile");
  }
}

// Helper function to clean markdown code blocks from AI responses
function cleanMarkdownCodeBlocks(content: string): string {
  // Remove ```json and ``` markers, and any other markdown formatting
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// POST - Generate new brand profile
export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateUser(request);
    console.log("🔮 [BRAND] Starting brand profile generation for user:", userId);

    const body = await request.json();
    const questionnaire: BrandQuestionnaire = body.questionnaire;

    if (!questionnaire) {
      return NextResponse.json({ error: "Missing questionnaire data" }, { status: 400 });
    }

    await validateQuestionnaire(questionnaire);
    const profileData = await generateProfileWithGemini(questionnaire);

    // Create brand profile document
    const now = new Date().toISOString();
    const brandProfile: Omit<BrandProfile, "id"> = {
      userId,
      questionnaire,
      profile: profileData,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      version: 1,
    };

    // Check for existing active profile and deactivate it
    const existingProfilesSnapshot = await adminDb
      .collection("brandProfiles")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    const batch = adminDb.batch();

    // Deactivate existing profiles
    existingProfilesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false, updatedAt: now });
    });

    // Create new profile
    const newProfileRef = adminDb.collection("brandProfiles").doc();
    batch.set(newProfileRef, brandProfile);

    await batch.commit();

    const finalProfile: BrandProfile = {
      id: newProfileRef.id,
      ...brandProfile,
    };

    console.log("🎉 [BRAND] Brand profile generated successfully:", newProfileRef.id);

    return NextResponse.json({
      success: true,
      profile: finalProfile,
    });
  } catch (error) {
    console.error("❌ [BRAND] Error generating brand profile:", error);
    return NextResponse.json(
      { error: "Failed to generate brand profile", details: error instanceof Error ? error.message : "Unknown error" },
      { status: error instanceof Error && error.message === "Missing authorization header" ? 401 : 500 },
    );
  }
}

// PUT - Update brand profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await authenticateUser(request);
    const body = await request.json();
    const { profileId, profile, questionnaire } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile ID" }, { status: 400 });
    }

    console.log("📝 [BRAND] Updating profile:", profileId);

    const profileRef = adminDb.collection("brandProfiles").doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingProfileData = profileDoc.data();
    if (!existingProfileData) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const existingProfile = existingProfileData as BrandProfile;
    if (existingProfile.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: Partial<BrandProfile> = {
      updatedAt: new Date().toISOString(),
    };

    if (profile) {
      updateData.profile = profile;
    }

    if (questionnaire) {
      updateData.questionnaire = questionnaire;
    }

    await profileRef.update(updateData);

    console.log("✅ [BRAND] Profile updated successfully");

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("❌ [BRAND] Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: error instanceof Error && error.message === "Missing authorization header" ? 401 : 500 },
    );
  }
}

// DELETE - Delete brand profile
export async function DELETE(request: NextRequest) {
  try {
    const userId = await authenticateUser(request);
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile ID" }, { status: 400 });
    }

    console.log("🗑️ [BRAND] Deleting profile:", profileId);

    const profileRef = adminDb.collection("brandProfiles").doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const existingProfileData = profileDoc.data();
    if (!existingProfileData) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const existingProfile = existingProfileData as BrandProfile;
    if (existingProfile.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await profileRef.delete();

    console.log("✅ [BRAND] Profile deleted successfully");

    return NextResponse.json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("❌ [BRAND] Error deleting profile:", error);
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: error instanceof Error && error.message === "Missing authorization header" ? 401 : 500 },
    );
  }
}
