import { NextRequest, NextResponse } from "next/server";

import { AIVoicesService } from "@/lib/ai-voices-service";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { VoiceCreationRequest } from "@/types/ai-voices";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateApiKey(request);
    if (!authResult.success) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const userId = authResult.user.uid;
    console.log(`🎤 [API] Creating custom voice for user: ${userId}`);

    const body: VoiceCreationRequest = await request.json();

    // Validate required fields
    if (!body.profileUrl) {
      return NextResponse.json({ error: "Profile URL is required" }, { status: 400 });
    }

    if (!body.platform) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }

    if (!["tiktok", "instagram"].includes(body.platform)) {
      return NextResponse.json({ error: "Platform must be either 'tiktok' or 'instagram'" }, { status: 400 });
    }

    console.log(`🎤 [API] Creating voice from ${body.platform} profile: ${body.profileUrl}`);

    const newVoice = await AIVoicesService.createCustomVoice(userId, body);

    console.log(`✅ [API] Successfully created custom voice: ${newVoice.id}`);

    return NextResponse.json(newVoice);
  } catch (error) {
    console.error("🔥 [API] Failed to create custom voice:", error);

    if (error instanceof Error) {
      // Provide more specific error messages
      if (error.message.includes("Voice limit reached")) {
        return NextResponse.json({ error: error.message }, { status: 429 });
      }

      if (error.message.includes("Failed to analyze transcription")) {
        return NextResponse.json(
          { error: "Unable to analyze the provided content. Please try with a different profile or contact support." },
          { status: 422 },
        );
      }

      if (error.message.includes("Failed to generate any templates")) {
        return NextResponse.json(
          {
            error: "Unable to generate voice templates from the provided content. Please try with a different profile.",
          },
          { status: 422 },
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create custom voice" }, { status: 500 });
  }
}
