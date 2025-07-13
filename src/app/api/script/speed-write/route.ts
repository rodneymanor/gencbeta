import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { ScriptService } from "@/core/script/script-service";
import { CreditsService } from "@/lib/credits-service";
import { trackApiUsageAdmin } from "@/lib/usage-tracker-admin";

// Validate environment setup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is not set");
}

interface SpeedWriteRequest {
  idea: string;
  length: "20" | "60" | "90";
  type?: "speed" | "educational" | "voice";
}

interface SpeedWriteResponse {
  success: boolean;
  optionA?: any;
  optionB?: any;
  error?: string;
  processingTime?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse<SpeedWriteResponse>> {
  const startTime = Date.now();

  try {
    // Authenticate user (keeping existing auth)
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<SpeedWriteResponse>;
    }

    const { user } = authResult;

    const body: SpeedWriteRequest = await request.json();

    // Validate request
    if (!body.idea || !body.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Idea and length are required",
        },
        { status: 400 },
      );
    }

    console.log("✍️ [SCRIPT] Processing script generation request...");

    // Check credits
    const creditCheck = await CreditsService.canPerformAction(
      user.uid,
      "script_generation",
      "free", // Default to free tier for now
    );

    if (!creditCheck.canPerform) {
      return NextResponse.json(
        {
          success: false,
          error: creditCheck.reason || "Insufficient credits",
        },
        { status: 402 },
      );
    }

    // Generate script(s)
    let result;
    if (body.type) {
      // Single script type
      const scriptResult = await ScriptService.generate(body.type, {
        idea: body.idea,
        length: body.length,
        userId: user.uid,
      });

      result = {
        optionA: scriptResult,
        optionB: null,
      };
    } else {
      // A/B testing (default)
      result = await ScriptService.generateOptions({
        idea: body.idea,
        length: body.length,
        userId: user.uid,
      });
    }

    const processingTime = Date.now() - startTime;

    // Track usage
    await trackApiUsageAdmin(
      user.uid,
      "script-generation",
      "speed-write-a",
      {
        responseTime: processingTime,
        success: true,
      },
      {
        scriptLength: body.length,
        inputLength: body.idea.length,
      },
    );

    console.log("✅ [SCRIPT] Script generation completed successfully");

    return NextResponse.json({
      success: true,
      optionA: result.optionA,
      optionB: result.optionB,
      processingTime,
    });
  } catch (error) {
    console.error("❌ [SCRIPT] Script generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate script",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
