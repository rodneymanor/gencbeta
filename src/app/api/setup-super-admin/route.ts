import { NextRequest, NextResponse } from "next/server";

import { UserManagementService } from "@/lib/user-management";

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "UID and email are required" }, { status: 400 });
    }

    // Create super admin profile
    const profileId = await UserManagementService.createOrUpdateUserProfile(
      uid,
      email,
      displayName ?? "Super Admin",
      "super_admin",
    );

    return NextResponse.json({
      success: true,
      message: "Super admin profile created successfully",
      profileId,
    });
  } catch (error) {
    console.error("Error creating super admin profile:", error);
    return NextResponse.json({ error: "Failed to create super admin profile" }, { status: 500 });
  }
}
