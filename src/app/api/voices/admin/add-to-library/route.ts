import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { adminDb } from "@/lib/firebase-admin";

interface AddToLibraryRequest {
  voiceId: string;
  description?: string;
  badges?: string[];
  featured?: boolean;
}

interface AddToLibraryResponse {
  success: boolean;
  voiceId: string;
  voiceName: string;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    console.log(`👑 [ADMIN] Add to library request from user: ${userId}`);

    // Check if user is super admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.role || userData.role !== "super_admin") {
      console.warn(`🚫 [ADMIN] Unauthorized access attempt by user: ${userId}`);
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    const body: AddToLibraryRequest = await request.json();
    const { voiceId, description, badges, featured = false } = body;

    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    console.log(`👑 [ADMIN] Adding voice to library: ${voiceId}`);

    // Get the voice document
    const voiceDoc = await adminDb.collection("ai_voices").doc(voiceId).get();

    if (!voiceDoc.exists) {
      return NextResponse.json({ error: "Voice not found" }, { status: 404 });
    }

    const voiceData = voiceDoc.data();

    if (!voiceData) {
      return NextResponse.json({ error: "Invalid voice data" }, { status: 400 });
    }

    // Check if voice is already shared
    if (voiceData.isShared) {
      return NextResponse.json({ error: "Voice is already in the library" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      isShared: true,
      addedToLibraryAt: new Date().toISOString(),
      addedToLibraryBy: userId,
      updatedAt: new Date().toISOString(),
    };

    // Update description if provided
    if (description && description.trim()) {
      updateData.description = description.trim();
    }

    // Update badges if provided
    if (badges && Array.isArray(badges) && badges.length > 0) {
      // Validate badges (max 3, non-empty strings)
      const validBadges = badges.filter((badge) => typeof badge === "string" && badge.trim().length > 0).slice(0, 3);

      if (validBadges.length > 0) {
        updateData.badges = validBadges;
      }
    }

    // Add featured flag if specified
    if (featured) {
      updateData.featured = true;
      updateData.featuredAt = new Date().toISOString();
    }

    // Update the voice document
    await adminDb.collection("ai_voices").doc(voiceId).update(updateData);

    // Log the action for audit purposes
    await adminDb.collection("admin_actions").add({
      action: "add_voice_to_library",
      performedBy: userId,
      targetVoiceId: voiceId,
      voiceName: voiceData.name,
      originalOwner: voiceData.userId,
      timestamp: new Date().toISOString(),
      details: {
        description: description || "No custom description provided",
        badges: badges || voiceData.badges,
        featured: featured,
        originalCreatedAt: voiceData.createdAt,
        sourceCollection: voiceData.metadata?.sourceCollection,
        platform: voiceData.metadata?.platform,
        username: voiceData.metadata?.username || voiceData.creatorInspiration,
      },
    });

    console.log(`✅ [ADMIN] Successfully added voice to library: ${voiceId}`);

    const response: AddToLibraryResponse = {
      success: true,
      voiceId,
      voiceName: voiceData.name,
      message: `Voice "${voiceData.name}" has been added to the voice library and is now available to all users.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [ADMIN] Failed to add voice to library:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add voice to library",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to list voices that can be added to library
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;

    // Check if user is super admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.role || userData.role !== "super_admin") {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
    }

    console.log(`👑 [ADMIN] Listing voices available for library addition`);

    // Get all custom voices that are not yet shared
    const voicesSnapshot = await adminDb
      .collection("ai_voices")
      .where("isShared", "==", false)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const availableVoices = voicesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        badges: data.badges,
        creatorInspiration: data.creatorInspiration,
        templatesCount: data.templates?.length || 0,
        createdAt: data.createdAt,
        userId: data.userId,
        metadata: {
          platform: data.metadata?.platform,
          username: data.metadata?.username,
          sourceCollection: data.metadata?.sourceCollection,
          videosAnalyzed: data.metadata?.videosAnalyzed,
          templatesGenerated: data.metadata?.templatesGenerated,
        },
      };
    });

    return NextResponse.json({
      success: true,
      voices: availableVoices,
      count: availableVoices.length,
      message: `Found ${availableVoices.length} voices available for library addition`,
    });
  } catch (error) {
    console.error("🔥 [ADMIN] Failed to list available voices:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list available voices",
      },
      { status: 500 },
    );
  }
}
