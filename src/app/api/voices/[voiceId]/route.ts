import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function DELETE(request: NextRequest, { params }: { params: { voiceId: string } }) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const { voiceId } = params;

    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    await AIVoicesService.deleteCustomVoice(userId, voiceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 [API] Failed to delete custom voice:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to delete custom voice" }, { status: 500 });
  }
}
