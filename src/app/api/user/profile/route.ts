import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server-auth";
import { UserManagementService } from "@/lib/user-management";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await UserManagementService.getUserProfile(user.uid);
    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("❌ [API /user/profile] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
