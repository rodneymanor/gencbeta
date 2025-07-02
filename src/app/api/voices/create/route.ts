import { NextRequest, NextResponse } from "next/server";
import { AIVoicesService } from "@/lib/ai-voices-service";
import { VoiceCreationRequest } from "@/types/ai-voices";

export async function POST(request: NextRequest) {
  try {
    // TODO: Get user ID from auth context
    const userId = "temp-user-id"; // Temporary until auth is implemented

    const body: VoiceCreationRequest = await request.json();

    if (!body.profileUrl || !body.platform) {
      return NextResponse.json(
        { error: "Profile URL and platform are required" },
        { status: 400 }
      );
    }

    const newVoice = await AIVoicesService.createCustomVoice(userId, body);

    return NextResponse.json(newVoice);
  } catch (error) {
    console.error("🔥 [API] Failed to create custom voice:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create custom voice" },
      { status: 500 }
    );
  }
} 