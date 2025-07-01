import { NextRequest, NextResponse } from "next/server";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";

async function authenticateApiKey(request: NextRequest) {
  console.log("🔐 [List Collections API] Checking API key authentication");

  const apiKey = ApiKeyAuthService.extractApiKey(request);

  if (!apiKey) {
    console.log("❌ [List Collections API] No API key provided");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "API key required. Provide via x-api-key header or Authorization: Bearer header.",
      },
      { status: 401 },
    );
  }

  const authResult = await ApiKeyAuthService.validateApiKey(apiKey);

  if (!authResult) {
    console.log("❌ [List Collections API] Invalid API key");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid API key",
      },
      { status: 401 },
    );
  }

  if (!authResult.rateLimitResult.allowed) {
    console.log("🚫 [List Collections API] Request blocked by rate limiting");
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: authResult.rateLimitResult.reason,
        rateLimitInfo: {
          resetTime: authResult.rateLimitResult.resetTime,
          violationsCount: authResult.rateLimitResult.violationsCount,
          requestsPerMinute: 50,
          maxViolations: 2,
        },
      },
      { status: 429 },
    );
  }

  console.log("✅ [List Collections API] API key authenticated for user:", authResult.user.email);
  return authResult;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key first
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userId = authResult.user.uid;
    console.log("📚 [List Collections API] GET request received for user:", userId);

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Get collections for the authenticated user only
    const querySnapshot = await adminDb
      .collection("collections")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .get();

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

    console.log("✅ [List Collections API] Successfully fetched", collections.length, "collections for user");

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.uid,
        email: authResult.user.email,
        displayName: authResult.user.displayName,
        role: authResult.user.role,
      },
      collections,
      total: collections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error listing collections:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
} 