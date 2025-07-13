import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { ScriptService } from "@/core/script/script-service";
import { CreditsService } from "@/lib/credits-service";
import { trackApiUsageAdmin } from "@/lib/usage-tracker-admin";

interface ScriptWriteRequest {
  idea: string;
  length: "20" | "60" | "90";
  type?: "speed" | "educational" | "voice";
}

interface ScriptWriteResponse {
  success: boolean;
  optionA?: any;
  optionB?: any;
  error?: string;
  processingTime?: number;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate user (keeping existing auth)
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ScriptWriteRequest = await request.json();
    
    // Validate request
    if (!body.idea || !body.length) {
      return NextResponse.json({ error: "Idea and length are required" }, { status: 400 });
    }

    console.log("✍️ [SCRIPT] Processing script generation request...");

    // Check credits
    const creditsService = new CreditsService();
    const hasCredits = await creditsService.checkCredits(user.uid, "script_generation");
    if (!hasCredits) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
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
    await trackApiUsageAdmin(user.uid, "script_generation", {
      idea: body.idea,
      length: body.length,
      type: body.type || "ab_testing",
      processingTime,
    });

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
        error: "Failed to generate script",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
} 