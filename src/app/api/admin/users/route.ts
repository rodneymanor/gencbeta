import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server-auth";
import { UserManagementService } from "@/lib/user-management";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await UserManagementService.getUserProfile(user.uid);
    if (!userProfile || userProfile.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [allUsers, allCoaches] = await Promise.all([
      UserManagementService.getAllUsers(),
      UserManagementService.getAllCoaches(),
    ]);

    return NextResponse.json({ users: allUsers, coaches: allCoaches });
  } catch (error) {
    console.error("Error fetching admin data:", error);
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await UserManagementService.getUserProfile(user.uid);
    if (!userProfile || userProfile.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: "User UID required" }, { status: 400 });
    }

    await UserManagementService.deactivateUser(uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deactivating user:", error);
    return NextResponse.json({ error: "Failed to deactivate user" }, { status: 500 });
  }
}
