import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";

export async function GET(request: NextRequest, { params }: { params: { voiceId: string } }) {
  try {
    const { voiceId } = params;

    if (!voiceId) {
      return NextResponse.json({ error: "Voice ID is required" }, { status: 400 });
    }

    const examples = await AIVoicesService.getVoiceExamples(voiceId);

    return NextResponse.json(examples);
  } catch (error) {
    console.error("🔥 [API] Failed to get voice examples:", error);
    return NextResponse.json({ error: "Failed to get voice examples" }, { status: 500 });
  }
}
