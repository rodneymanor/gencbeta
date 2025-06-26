import { NextRequest, NextResponse } from "next/server";

import { CollectionsRBACAdminService } from "@/lib/collections-rbac-admin";
import { getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === API_KEY;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get("userId") ?? request.headers.get("x-user-id");
}

async function validateCreateCollectionRequest(body: any) {
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

  return {
    isValid: true,
    data: { title: title.trim(), description: description.trim(), userId },
  };
}

async function createCollectionInFirestore(adminDb: any, collectionData: any) {
  const docRef = await adminDb.collection("collections").add(collectionData);
  return docRef;
}

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required",
          message: "Provide userId as query parameter or x-user-id header",
        },
        { status: 400 },
      );
    }

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
    console.error("Error fetching collections:", error);
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
    // Check API key authentication
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = await validateCreateCollectionRequest(body);

    if (!validation.isValid) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { title, description, userId } = validation.data!;

    // Check if Admin SDK is initialized
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin SDK not configured" }, { status: 500 });
    }

    // Verify user exists
    const userProfile = await UserManagementAdminService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    console.error("Error creating collection:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
