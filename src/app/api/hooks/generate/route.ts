import { NextRequest, NextResponse } from "next/server";

import { authenticateWithFirebaseToken } from "@/lib/firebase-auth-helpers";
import { GeminiService } from "@/lib/services/gemini-service";
import { createHookGenerationPrompt, type HookGenerationResponse } from "@/lib/prompts/hook-generation";
import { trackUsage } from "@/lib/usage-tracker";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateWithFirebaseToken(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    console.log("🎣 [HOOKS] Starting hook generation for user:", user.uid);

    // Parse request body
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json({ error: "Input is required for hook generation" }, { status: 400 });
    }

    // Check if input is too long
    if (input.length > 1000) {
      return NextResponse.json({ error: "Input is too long. Please keep it under 1000 characters." }, { status: 400 });
    }

    console.log("🎯 [HOOKS] Generating hooks for input:", input.substring(0, 50) + "...");

    // Create the prompt
    const prompt = createHookGenerationPrompt(input);

    // Call Gemini service
    const geminiService = new GeminiService();
    const response = await geminiService.generateContent({
      prompt,
      model: "gemini-2.0-flash",
      temperature: 0.8,
      maxTokens: 2000,
      responseType: "json",
    });

    if (!response.success || !response.content) {
      console.error("❌ [HOOKS] Gemini generation failed:", response.error);
      return NextResponse.json({ error: "Failed to generate hooks" }, { status: 500 });
    }

    // Parse the response
    let hookData: HookGenerationResponse;
    try {
      hookData = JSON.parse(response.content);

      // Validate the response structure
      if (!hookData.hooks || !Array.isArray(hookData.hooks)) {
        throw new Error("Invalid response structure");
      }

      // Validate each hook
      hookData.hooks = hookData.hooks.filter(
        (hook) => hook.hook && typeof hook.hook === "string" && hook.template && typeof hook.template === "string",
      );

      if (hookData.hooks.length === 0) {
        throw new Error("No valid hooks generated");
      }
    } catch (parseError) {
      console.error("❌ [HOOKS] Failed to parse Gemini response:", parseError);
      console.error("Raw response:", response.content);
      return NextResponse.json({ error: "Failed to parse generated hooks" }, { status: 500 });
    }

    // Track usage
    try {
      await trackUsage(user.uid, {
        action: "hook_generation",
        creditsUsed: 1,
        metadata: {
          inputLength: input.length,
          hooksGenerated: hookData.hooks.length,
          tokensUsed: response.tokensUsed,
        },
      });
    } catch (trackingError) {
      console.error("⚠️ [HOOKS] Usage tracking failed:", trackingError);
      // Continue anyway - don't fail the request due to tracking
    }

    console.log("✅ [HOOKS] Successfully generated", hookData.hooks.length, "hooks");

    return NextResponse.json(hookData);
  } catch (error) {
    console.error("❌ [HOOKS] Error generating hooks:", error);
    return NextResponse.json(
      {
        error: "Failed to generate hooks",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
