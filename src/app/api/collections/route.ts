import { NextRequest, NextResponse } from "next/server";

import { ApiKeyAuthService } from "@/lib/api-key-auth";
import { COLLECTION_LIMITS } from "@/lib/collections";
import { CollectionsRBACAdminService } from "@/lib/collections-rbac-admin";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

async function authenticateApiKey(request: NextRequest) {
  console.log("🔐 [Collections API] Checking API key authentication");

  const apiKey = ApiKeyAuthService.extractApiKey(request);

  if (!apiKey) {
    console.log("❌ [Collections API] No API key provided");
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
    console.log("❌ [Collections API] Invalid API key");
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid API key",
      },
      { status: 401 },
    );
  }

  if (!authResult.rateLimitResult.allowed) {
    console.log("🚫 [Collections API] Request blocked by rate limiting");
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

  console.log("✅ [Collections API] API key authenticated for user:", authResult.user.email);
  return authResult;
}

async function validateCreateCollectionRequest(body: { title?: string; description?: string; userId?: string }) {
  const { title, description = "", userId } = body;

  if (!title || !userId) {
    return {
      isValid: false,
      error: {
        error: "Missing required fields",
        message: "title and userId are required",
      },
    };
  }

  if (title.trim().length > COLLECTION_LIMITS.MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: {
        error: "Title too long",
        message: `Collection title must be ${COLLECTION_LIMITS.MAX_TITLE_LENGTH} characters or less`,
      },
    };
  }

  if (description.trim().length > COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: {
        error: "Description too long",
        message: `Collection description must be ${COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH} characters or less`,
      },
    };
  }

  return {
    isValid: true,
    data: { title: title.trim(), description: description.trim(), userId },
  };
}

async function createCollectionInFirestore(adminDb: any, collectionData: Record<string, unknown>) {
  const docRef = await adminDb.collection("collections").add(collectionData);
  return docRef;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate API key first
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userId = authResult.user.uid;
    console.log("📚 [Collections API] GET request received for user:", userId);

    // Check if Admin SDK is initialized
    if (!isAdminInitialized) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Verify user exists
    const userProfile = await UserManagementAdminService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get collections using RBAC service
    const collections = await CollectionsRBACAdminService.getUserCollections(userId);

    // Format response
    const formattedCollections = collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description,
      videoCount: collection.videoCount,
      userId: collection.userId,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    console.log("✅ [Collections API] Successfully fetched", formattedCollections.length, "collections");

    return NextResponse.json({
      success: true,
      user: {
        id: userProfile.uid,
        email: userProfile.email,
        displayName: userProfile.displayName,
        role: userProfile.role,
      },
      collections: formattedCollections,
      total: formattedCollections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [Collections API] Error fetching collections:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate API key first
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const userId = authResult.user.uid;
    console.log("📚 [Collections API] POST request received for user:", userId);

    // Parse and validate request body
    const body = await request.json();

    // Override body userId with authenticated user to prevent privilege escalation
    body.userId = userId;

    const validation = await validateCreateCollectionRequest(body);

    if (!validation.isValid) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { title, description } = validation.data!;

    console.log("🆕 [Collections API] Creating collection:", title, "for user:", userId);

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Create collection data
    const collectionData = {
      title,
      description,
      userId,
      videoCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add collection to Firestore using Admin SDK
    const docRef = await createCollectionInFirestore(adminDb, collectionData);

    console.log("✅ [Collections API] Collection created successfully:", docRef.id);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Collection created successfully",
        collection: {
          id: docRef.id,
          title: collectionData.title,
          description: collectionData.description,
          userId: collectionData.userId,
          videoCount: 0,
          createdAt: collectionData.createdAt.toISOString(),
          updatedAt: collectionData.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ [Collections API] Error creating collection:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
