import { NextRequest, NextResponse } from "next/server";

import { CollectionsRBACAdminService } from "@/lib/collections-rbac-admin";
import { isAdminInitialized } from "@/lib/firebase-admin";
import { UserManagementAdminService } from "@/lib/user-management-admin";

// Helper functions for API validation
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.NEXT_PUBLIC_API_KEY;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.searchParams.get("userId") ?? request.headers.get("x-user-id");
}

function getCollectionIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url);
  return url.searchParams.get("collectionId");
}

// Extracted validation functions to reduce complexity
async function validateUser(userId: string) {
  const userProfile = await UserManagementAdminService.getUserProfile(userId);
  if (!userProfile) {
    throw new Error("User not found");
  }
  return userProfile;
}

async function validatePermissions(userProfile: { role: string; uid: string }, userId: string, collectionId: string) {
  if (userProfile.role !== "coach" && userProfile.role !== "super_admin") {
    throw new Error("Insufficient permissions");
  }

  // For coaches, verify they own the collection
  if (userProfile.role === "coach") {
    const collection = await CollectionsRBACAdminService.getCollection(collectionId);
    if (!collection) {
      throw new Error("Collection not found");
    }
    if (collection.userId !== userId) {
      throw new Error("Access denied");
    }
  }
}

function createErrorResponse(message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status },
  );
}

async function handleValidationError(validationError: unknown) {
  console.error(`❌ [Collections API] Validation error:`, validationError);
  const message = validationError instanceof Error ? validationError.message : "Unknown error";

  if (message === "User not found") {
    return createErrorResponse("User not found", 404);
  }
  if (message === "Collection not found") {
    return createErrorResponse("Collection not found", 404);
  }
  if (message === "Access denied") {
    return createErrorResponse("Access denied", 403, "You can only delete collections you created");
  }
  if (message === "Insufficient permissions") {
    return createErrorResponse("Insufficient permissions", 403, "Only coaches and super admins can delete collections");
  }

  return createErrorResponse("Failed to delete collection", 500, message);
}

function validateRequestParameters(userId: string | null, collectionId: string | null) {
  if (!userId) {
    console.error("❌ [Collections API] User ID is required");
    return createErrorResponse("User ID is required", 400, "Provide userId as query parameter or x-user-id header");
  }

  if (!collectionId) {
    console.error("❌ [Collections API] Collection ID is required");
    return createErrorResponse("Collection ID is required", 400, "Provide collectionId as query parameter");
  }

  return null;
}

async function handleCollectionDeletion(userId: string, collectionId: string) {
  const userProfile = await validateUser(userId);
  await validatePermissions(userProfile, userId, collectionId);
  await CollectionsRBACAdminService.deleteCollection(collectionId);

  console.log(`✅ [Collections API] Collection deleted successfully: ${collectionId} by user ${userId}`);

  return {
    success: true,
    message: "Collection deleted successfully",
    collectionId,
    deletedBy: {
      id: userProfile.uid,
      email: userProfile.email,
      role: userProfile.role,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * DELETE /api/collections/delete
 * Delete a collection with RBAC validation
 *
 * Required headers:
 * - x-api-key: API authentication key
 * - x-user-id: User ID performing the deletion (optional if provided as query param)
 *
 * Required query parameters:
 * - collectionId: ID of the collection to delete
 * - userId: User ID performing the deletion (optional if provided as header)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ [Collections API] Delete collection request received");

    // Check API key authentication
    if (!validateApiKey(request)) {
      console.error("❌ [Collections API] Invalid API key");
      return createErrorResponse("Unauthorized", 401);
    }

    // Check if Admin SDK is initialized
    if (!isAdminInitialized) {
      console.error("❌ [Collections API] Firebase Admin SDK not configured");
      return createErrorResponse("Firebase Admin SDK not configured", 500);
    }

    // Get and validate user ID and collection ID
    const userId = getUserIdFromRequest(request);
    const collectionId = getCollectionIdFromRequest(request);

    const paramValidationError = validateRequestParameters(userId, collectionId);
    if (paramValidationError) {
      return paramValidationError;
    }

    try {
      const result = await handleCollectionDeletion(userId!, collectionId!);
      return NextResponse.json(result);
    } catch (validationError) {
      return await handleValidationError(validationError);
    }
  } catch (error) {
    console.error("❌ [Collections API] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500, error instanceof Error ? error.message : "Unknown error");
  }
}
