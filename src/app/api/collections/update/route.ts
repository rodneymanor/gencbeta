import { NextRequest, NextResponse } from "next/server";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { COLLECTION_LIMITS } from "@/lib/collections";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

/**
 * Helper: authenticate via API key using shared service
 */
async function authenticateApiKey(request: NextRequest) {
  const apiKey = ApiKeyAuthService.extractApiKey(request);

  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized", message: "API key required" }, { status: 401 });
  }

  const authResult = await ApiKeyAuthService.validateApiKey(apiKey);
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized", message: "Invalid API key" }, { status: 401 });
  }

  if (!authResult.rateLimitResult.allowed) {
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

  return authResult;
}

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // error response from authenticateApiKey
    }
    const userId = authResult.user.uid;

    // 2. Parse body
    let body: { collectionId?: string; title?: string; description?: string };
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { collectionId, title, description } = body;
    if (!collectionId) {
      return NextResponse.json({ error: "collectionId is required" }, { status: 400 });
    }

    // 3. Validate fields
    const updates: Record<string, unknown> = {};
    if (typeof title === "string") {
      if (title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      if (title.trim().length > COLLECTION_LIMITS.MAX_TITLE_LENGTH) {
        return NextResponse.json(
          {
            error: "Title too long",
            message: `Collection title must be ${COLLECTION_LIMITS.MAX_TITLE_LENGTH} characters or less`,
          },
          { status: 400 },
        );
      }
      updates.title = title.trim();
    }

    if (typeof description === "string") {
      if (description.trim().length > COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          {
            error: "Description too long",
            message: `Collection description must be ${COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH} characters or less`,
          },
          { status: 400 },
        );
      }
      updates.description = description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
    }

    // 4. Ensure Admin SDK is ready
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // 5. Fetch collection to verify ownership / existence
    const collectionDocRef = adminDb.collection("collections").doc(collectionId);
    const collectionSnap = await collectionDocRef.get();
    if (!collectionSnap.exists) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const collectionData = collectionSnap.data() as { userId: string };

    // 6. Verify permissions
    const userProfile = await UserManagementAdminService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isOwner = collectionData.userId === userId;
    const isSuperAdmin = userProfile.role === "super_admin";

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 7. Perform update
    updates.updatedAt = new Date();
    await collectionDocRef.update(updates);

    console.log(
      `✏️ [Collections API] Collection updated: ${collectionId} by ${userId} | Fields: ${Object.keys(updates).join(", ")}`,
    );

    return NextResponse.json({ success: true, message: "Collection updated successfully", collectionId });
  } catch (error) {
    console.error("❌ [Collections Update] Error:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}
