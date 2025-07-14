import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function GET(_request: NextRequest) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const activeVoice = await AIVoicesService.getActiveVoice(userId);

    if (!activeVoice) {
      return NextResponse.json(null);
    }

    return NextResponse.json(activeVoice);
  } catch (error) {
    console.error("🔥 [API] Failed to get active voice:", error);
    return NextResponse.json(null);
  }
}
