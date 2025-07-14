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
    console.log("📚 [User Collections API] GET request received for user:", userId);

    // Get collections using RBAC service
    const result = await RBACService.getUserCollections(userId);

    console.log("✅ [User Collections API] Successfully fetched", result.collections.length, "collections");

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        role: authResult.user.role,
      },
      collections: result.collections,
      accessibleCoaches: result.accessibleCoaches,
      total: result.collections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [User Collections API] Error fetching collections:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
