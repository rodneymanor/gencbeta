import { NextRequest, NextResponse } from "next/server";

import { FirebaseFirestore } from "firebase-admin";

import { COLLECTION_LIMITS } from "@/lib/collections";
import { CollectionsRBACAdminService } from "@/lib/collections-rbac-admin";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

function getUserIdFromRequest(request: NextRequest): string | null {
  // User ID is now set by middleware after API key validation
  const userIdFromHeader = request.headers.get("x-user-id");
  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  // Fallback to query parameter for backward compatibility
  const { searchParams } = new URL(request.url);
  return searchParams.get("userId");
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

  // Character limit validation using shared constants
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

async function createCollectionInFirestore(
  adminDb: FirebaseFirestore.Firestore,
  collectionData: Record<string, unknown>,
) {
  const docRef = await adminDb.collection("collections").add(collectionData);
  return docRef;
}

export async function GET(request: NextRequest) {
  try {
    // Authentication is handled by middleware
    console.log("📚 [Collections API] GET request received");

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required",
          message: "User ID should be provided by authenticated API key",
        },
        { status: 400 },
      );
    }

    console.log("🔍 [Collections API] Fetching collections for user:", userId);

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
    // Authentication is handled by middleware
    console.log("📚 [Collections API] POST request received");

    // Parse and validate request body
    const body = await request.json();
    
    // Get authenticated user ID from middleware
    const authenticatedUserId = request.headers.get("x-user-id");
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: "Authentication required", message: "User ID not found in authenticated request" },
        { status: 401 }
      );
    }

    // Override body userId with authenticated user to prevent privilege escalation
    body.userId = authenticatedUserId;
    
    const validation = await validateCreateCollectionRequest(body);

    if (!validation.isValid) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { title, description, userId } = validation.data!;

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
