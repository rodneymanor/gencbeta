import { NextRequest, NextResponse } from "next/server";



import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  return decodedToken.uid;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateUser(request);
    const body = await request.json();
    const { profileId } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Missing profile ID" }, { status: 400 });
    }

    console.log("🔄 [BRAND] Activating profile:", profileId, "for user:", userId);

    // Verify the profile exists and belongs to the user
    const profileRef = adminDb.collection("brandProfiles").doc(profileId);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileDoc.data();
    if (profile?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const batch = adminDb.batch();

    // Deactivate all other profiles for this user
    const existingProfilesSnapshot = await adminDb
      .collection("brandProfiles")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .get();

    existingProfilesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false, updatedAt: now });
    });

    // Activate the selected profile
    batch.update(profileRef, { isActive: true, updatedAt: now });

    await batch.commit();

    console.log("✅ [BRAND] Profile activated successfully");

    return NextResponse.json({
      success: true,
      message: "Profile activated successfully",
    });
  } catch (error) {
    console.error("❌ [BRAND] Error activating profile:", error);
    return NextResponse.json(
      { error: "Failed to activate profile" },
      { status: error instanceof Error && error.message === "Missing authorization header" ? 401 : 500 },
    );
  }
}
