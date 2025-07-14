import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey, authenticateFirebaseRequest } from "@/core/auth";
import { RBACService } from "@/core/auth";

export async function GET(request: NextRequest) {
  try {
    // Try Firebase token authentication first (for web app)
    let authResult;
    try {
      const firebaseUser = await authenticateFirebaseRequest(request);
      if (firebaseUser instanceof NextResponse) {
        // Firebase auth failed, try API key
        authResult = await authenticateApiKey(request);
      } else {
        // Firebase auth succeeded
        authResult = {
          success: true,
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            role: firebaseUser.customClaims?.role || "creator",
          },
        };
      }
    } catch (error) {
      // Firebase auth failed, try API key
      authResult = await authenticateApiKey(request);
    }

    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const limit = parseInt(searchParams.get("limit") || "24");
    const lastDocId = searchParams.get("lastDocId");

    console.log("📚 [Collection Videos API] GET request received for user:", userId, "collection:", collectionId);

    // Get videos using RBAC service
    const result = await RBACService.getCollectionVideos(
      userId,
      collectionId || undefined,
      limit,
      lastDocId ? ({ id: lastDocId } as any) : undefined,
    );

    console.log("✅ [Collection Videos API] Successfully fetched", result.videos.length, "videos");

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        role: authResult.user.role,
      },
      videos: result.videos,
      lastDoc: result.lastDoc ? { id: result.lastDoc.id } : null,
      totalCount: result.totalCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Collection Videos API] Error fetching videos:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
