import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function GET(_request: NextRequest) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const { sharedVoices, customVoices } = await AIVoicesService.getAvailableVoices(userId);

    return NextResponse.json({ sharedVoices, customVoices });
  } catch (error) {
    console.error("🔥 [API] Failed to get voices:", error);
    return NextResponse.json({ error: "Failed to get voices" }, { status: 500 });
  }
}
