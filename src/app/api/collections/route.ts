import { NextRequest, NextResponse } from "next/server";

import { CollectionsRBACService } from "@/lib/collections-rbac";
import { UserManagementService } from "@/lib/user-management";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from query params or header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") ?? request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required",
          message: "Provide userId as query parameter or x-user-id header",
        },
        { status: 400 },
      );
    }

    // Verify user exists
    const userProfile = await UserManagementService.getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get collections using RBAC service
    const collections = await CollectionsRBACService.getUserCollections(userId);

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
