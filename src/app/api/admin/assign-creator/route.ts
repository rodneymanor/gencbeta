import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server-auth";
import { UserManagementService } from "@/lib/user-management";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await UserManagementService.getUserProfile(user.uid);
    if (!userProfile || userProfile.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { creatorUid, coachUid } = await request.json();
    if (!creatorUid || !coachUid) {
      return NextResponse.json({ error: "Creator UID and Coach UID required" }, { status: 400 });
    }

    await UserManagementService.assignCreatorToCoach(creatorUid, coachUid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning creator:", error);
    return NextResponse.json({ error: "Failed to assign creator" }, { status: 500 });
  }
}
