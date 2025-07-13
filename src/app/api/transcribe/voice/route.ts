import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { GeminiService } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log("🎤 [VOICE] Starting voice transcription...");

    const body = await request.json();
    const { audio, format } = body;

    if (!audio) {
      return NextResponse.json({ error: "Missing audio data" }, { status: 400 });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, "base64");

    console.log("🔄 [VOICE] Processing audio with Gemini...");

    // Use Gemini for speech-to-text
    const geminiService = new GeminiService();

    try {
      // Create a temporary file-like object for Gemini
      const audioData = {
        mimeType: format === "wav" ? "audio/wav" : "audio/mpeg",
        data: audioBuffer,
      };

      const transcriptionResult = await geminiService.transcribeAudio(audioData);

      if (!transcriptionResult || !transcriptionResult.trim()) {
        return NextResponse.json({ error: "No speech detected in audio" }, { status: 400 });
      }

      console.log("✅ [VOICE] Transcription successful");

      return NextResponse.json({
        success: true,
        transcription: transcriptionResult.trim(),
      });
    } catch (transcriptionError) {
      console.error("❌ [VOICE] Gemini transcription failed:", transcriptionError);

      // Fallback to browser Speech Recognition API if available
      return NextResponse.json(
        {
          error: "Speech transcription failed",
          details: transcriptionError instanceof Error ? transcriptionError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ [VOICE] Error processing voice transcription:", error);
    return NextResponse.json(
      {
        error: "Failed to process voice transcription",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
