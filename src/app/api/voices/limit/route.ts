import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function GET(_request: NextRequest) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const limit = await AIVoicesService.getCustomVoiceLimit(userId);

    return NextResponse.json(limit);
  } catch (error) {
    console.error("🔥 [API] Failed to get voice limit:", error);
    return NextResponse.json({ error: "Failed to get voice limit" }, { status: 500 });
  }
}
