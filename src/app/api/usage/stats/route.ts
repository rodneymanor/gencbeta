import { NextResponse } from "next/server";

import { CreditsService } from "@/lib/credits-service";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET(): Promise<NextResponse> {
  try {
    console.log("📊 [Usage Stats] Fetching user usage statistics...");

    // Authenticate user using session
    const user = await getCurrentUser();
    if (!user) {
      console.log("❌ [Usage Stats] No authenticated user found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.uid;

    // Get user's account level from their profile
    const adminDb = getAdminDb();

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.data();
    const accountLevel = userData?.accountLevel ?? "free";

    console.log(`📊 [Usage Stats] Getting stats for user ${userId} (${accountLevel})`);

    // Get usage statistics
    const usageStats = await CreditsService.getUsageStats(userId, accountLevel);

    console.log(`✅ [Usage Stats] Retrieved stats for user ${userId}:`, {
      creditsUsed: usageStats.creditsUsed,
      creditsRemaining: usageStats.creditsRemaining,
      percentageUsed: usageStats.percentageUsed,
      periodType: usageStats.periodType,
    });

    return NextResponse.json(usageStats);
  } catch (error) {
    console.error("❌ [Usage Stats] Error fetching usage statistics:", error);
    return NextResponse.json({ error: "Failed to fetch usage statistics" }, { status: 500 });
  }
}
