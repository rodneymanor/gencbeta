import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("📊 [Usage Stats] Fetching user usage statistics...");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId, accountLevel } = authResult;

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
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
} 