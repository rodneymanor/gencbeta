import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ voiceId: string }> }) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const { voiceId } = await params;

    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    const result = await AIVoicesService.activateVoice(userId, voiceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("🔥 [API] Failed to activate voice:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to activate voice" }, { status: 500 });
  }
}
