import { NextRequest, NextResponse } from "next/server";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [RECREATE_COLLECTIONS] Starting collections recreation...");

    // Get Firebase Admin database
    const db = getAdminDb();

    if (!db) {
      console.error("❌ [RECREATE_COLLECTIONS] Firebase Admin not initialized");
      return NextResponse.json(
        {
          success: false,
          error: "Firebase Admin not initialized",
          details: "Please check Firebase Admin SDK configuration",
        },
        { status: 500 },
      );
    }

    // Your user ID (from the logs)
    const userId = "xfPvnnUdJCRIJEVrpJCmR7kXBOX2";

    console.log("👤 [RECREATE_COLLECTIONS] User ID:", userId);

    // Create a sample collection to get started
    const sampleCollection = {
      title: "My First Collection",
      description: "A sample collection to get you started with video organization",
      userId: userId,
      videoCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log("📝 [RECREATE_COLLECTIONS] Creating sample collection...");

    const collectionRef = await db.collection("collections").add(sampleCollection);

    console.log("✅ [RECREATE_COLLECTIONS] Sample collection created with ID:", collectionRef.id);

    // Verify the collection was created
    const createdDoc = await collectionRef.get();
    if (createdDoc.exists) {
      const data = createdDoc.data();
      console.log("📋 [RECREATE_COLLECTIONS] Collection details:");
      console.log("   - Title:", data?.title);
      console.log("   - Description:", data?.description);
      console.log("   - Video Count:", data?.videoCount);
      console.log("   - User ID:", data?.userId);
    }

    // Verify collections structure
    console.log("🔍 [RECREATE_COLLECTIONS] Verifying collections structure...");

    const collectionsSnapshot = await db.collection("collections").limit(1).get();

    if (!collectionsSnapshot.empty) {
      const sampleDoc = collectionsSnapshot.docs[0];
      const data = sampleDoc.data();

      console.log("✅ [RECREATE_COLLECTIONS] Collections collection structure verified:");
      console.log("   - Document ID format: ✓");
      console.log("   - Required fields present:", Object.keys(data).join(", "));
    }

    console.log("🎉 [RECREATE_COLLECTIONS] Collections collection successfully recreated!");

    return NextResponse.json({
      success: true,
      message: "Collections collection successfully recreated!",
      collectionId: collectionRef.id,
      sampleCollection: {
        id: collectionRef.id,
        title: sampleCollection.title,
        description: sampleCollection.description,
        userId: sampleCollection.userId,
        videoCount: sampleCollection.videoCount,
      },
    });
  } catch (error) {
    console.error("❌ [RECREATE_COLLECTIONS] Error recreating collections:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to recreate collections",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
