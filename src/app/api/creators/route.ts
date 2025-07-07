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
    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "super_admin")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const creators = await UserManagementService.getCoachCreators(user.uid);
    return NextResponse.json(creators);
  } catch (error) {
    console.error("Error fetching creators:", error);
    return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { creatorUid } = await request.json();
    if (!creatorUid) {
      return NextResponse.json({ error: "Creator UID required" }, { status: 400 });
    }

    await UserManagementService.removeCreatorFromCoach(creatorUid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing creator:", error);
    return NextResponse.json({ error: "Failed to remove creator" }, { status: 500 });
  }
}
