import { NextRequest, NextResponse } from "next/server";

import { UserManagementService, UserRole } from "@/lib/user-management";
import { UserManagementAdminService } from "@/lib/user-management-admin";

interface TestData {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  coachId?: string;
}

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role?: string;
  coachId?: string;
}

interface UserCreationData {
  email: string;
  password: string;
  displayName: string;
  role?: string;
  coachId?: string;
}

// Extract complex logic to reduce function complexity
async function handleTestProfileCreation(testData: TestData) {
  console.log("🧪 [DEBUG] Testing profile creation with data:", testData);

  try {
    const profileId = await UserManagementService.createOrUpdateUserProfile(
      testData.uid,
      testData.email,
      testData.displayName,
      testData.role ?? "coach",
      testData.coachId,
    );

    return NextResponse.json({
      success: true,
      message: "Test profile created successfully",
      profileId,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Test profile creation failed:", error);
    return NextResponse.json(
      {
        error: "Test profile creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Handle user profile creation using Admin SDK
async function handleUserProfileCreation(userData: UserData) {
  console.log("👤 [DEBUG] Creating user profile via Admin SDK:", userData);

  try {
    const profileId = await UserManagementAdminService.createUserProfile(
      userData.uid,
      userData.email,
      userData.displayName,
      userData.role ?? "coach",
      userData.coachId,
    );

    return NextResponse.json({
      success: true,
      message: "User profile created successfully",
      profileId,
    });
  } catch (error) {
    console.error("❌ [DEBUG] User profile creation failed:", error);
    return NextResponse.json(
      {
        error: "User profile creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Handle complete user account creation using Admin SDK
async function handleCompleteUserCreation(userData: UserCreationData) {
  console.log("👤 [DEBUG] Creating complete user account via Admin SDK:", {
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
  });

  try {
    const result = await UserManagementAdminService.createCompleteUserAccount(
      userData.email,
      userData.password,
      userData.displayName,
      (userData.role as UserRole) ?? "coach",
      userData.coachId,
    );

    return NextResponse.json({
      success: true,
      message: "Complete user account created successfully",
      uid: result.uid,
      profileId: result.profileId,
    });
  } catch (error) {
    console.error("❌ [DEBUG] Complete user creation failed:", error);
    return NextResponse.json(
      {
        error: "Complete user creation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Extract environment variable checking to reduce complexity

function getEnvironmentStatus() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing",
    BUNNY_STREAM_LIBRARY_ID: process.env.BUNNY_STREAM_LIBRARY_ID ? "✅ Set" : "❌ Missing",
    BUNNY_STREAM_API_KEY: process.env.BUNNY_STREAM_API_KEY ? "✅ Set" : "❌ Missing",
    BUNNY_CDN_HOSTNAME: process.env.BUNNY_CDN_HOSTNAME ? "✅ Set" : "❌ Missing",
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? "✅ Set" : "❌ Missing",
    VIDEO_API_KEY: process.env.VIDEO_API_KEY ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Set" : "❌ Missing",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
  };
}

export async function GET() {
  return NextResponse.json(getEnvironmentStatus());
}

// Add user role update functionality
export async function POST(request: NextRequest) {
  try {
    const { userId, newRole, action, testData, userData } = await request.json();

    if (action === "test-profile-creation") {
      return await handleTestProfileCreation(testData);
    }

    if (action === "create-user-profile") {
      return await handleUserProfileCreation(userData);
    }

    if (action === "complete-user-creation") {
      return await handleCompleteUserCreation(userData);
    }

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
