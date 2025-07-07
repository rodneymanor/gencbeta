import { NextResponse } from "next/server";

import { CreditsService } from "@/lib/credits-service";
import { getAdminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/server-auth";

async function getUserAccountLevel(userId: string): Promise<string> {
  const adminDb = getAdminDb();
  const userDoc = await adminDb.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    console.log(`❌ [Usage Stats] User document not found for ${userId}`);
    throw new Error("User profile not found");
  }

  const userData = userDoc.data();
  const accountLevel = userData?.accountLevel ?? "free";

  console.log(`📊 [Usage Stats] User account level: ${accountLevel}`);
  return accountLevel;
}

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
    console.log(`📊 [Usage Stats] Authenticated user: ${userId}`);

    // Get user's account level and usage statistics
    try {
      const accountLevel = await getUserAccountLevel(userId);
      const usageStats = await CreditsService.getUsageStats(userId, accountLevel);

      console.log(`✅ [Usage Stats] Retrieved stats for user ${userId}:`, {
        creditsUsed: usageStats.creditsUsed,
        creditsRemaining: usageStats.creditsRemaining,
        percentageUsed: usageStats.percentageUsed,
        periodType: usageStats.periodType,
      });

      return NextResponse.json(usageStats);
    } catch (firestoreError) {
      console.error("❌ [Usage Stats] Firestore error:", firestoreError);
      return NextResponse.json(
        {
          error: "Database error",
          details: firestoreError instanceof Error ? firestoreError.message : "Unknown database error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ [Usage Stats] Error fetching usage statistics:", error);
    console.error("❌ [Usage Stats] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return NextResponse.json(
      {
        error: "Failed to fetch usage statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
