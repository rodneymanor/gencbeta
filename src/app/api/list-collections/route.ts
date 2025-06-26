import { NextRequest, NextResponse } from "next/server";

import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Get all collections using Admin SDK
    const querySnapshot = await adminDb.collection("collections").orderBy("updatedAt", "desc").get();

    const collections = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        userId: data.userId,
        videoCount: data.videoCount ?? 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      collections,
      total: collections.length,
    });
  } catch (error) {
    console.error("Error listing collections:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
