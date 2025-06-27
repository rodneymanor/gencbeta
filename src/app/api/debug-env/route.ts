import { NextRequest, NextResponse } from "next/server";

import { UserManagementAdminService } from "@/lib/user-management-admin";

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing",
    BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID ? "✅ Set" : "❌ Missing",
    BUNNY_STREAM_API_KEY: process.env.BUNNY_STREAM_API_KEY ? "✅ Set" : "❌ Missing",
    BUNNY_CDN_HOSTNAME: process.env.BUNNY_CDN_HOSTNAME ? "✅ Set" : "❌ Missing",
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Missing",
    VIDEO_API_KEY: process.env.VIDEO_API_KEY ? "✅ Set" : "❌ Missing",
  };

  return NextResponse.json(envVars);
}

// Add user role update functionality
export async function POST(request: NextRequest) {
  try {
    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: "Missing userId or newRole" }, { status: 400 });
    }

    // Update user role using admin service
    await UserManagementAdminService.updateUserProfile(userId, { role: newRole });

    return NextResponse.json({
      success: true,
      message: `User ${userId} role updated to ${newRole}`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      {
        error: "Failed to update user role",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
