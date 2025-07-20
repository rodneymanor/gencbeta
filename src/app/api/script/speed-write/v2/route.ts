/**
 * V2 Script Generation API - Uses the new unified architecture
 * Maintains backward compatibility while using the new system internally
 */

import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";
import { adminDb } from "@/lib/firebase-admin";
import { UnifiedScriptInput } from "@/lib/script-generation/types";
import { UnifiedScriptService } from "@/lib/script-generation/unified-service";
import { ScriptService } from "@/lib/services/script-generation-service";
import { trackApiUsageAdmin } from "@/lib/usage-tracker-admin";
import {
  validateScriptGenerationInput,
  hasRequiredFields,
  isContentSafe,
  sanitizeForGemini,
  estimateComplexity,
} from "@/lib/validation/input-validator";

interface SpeedWriteRequest {
  idea: string;
  length: "15" | "20" | "30" | "45" | "60" | "90";
  type?: "speed" | "educational" | "viral";
  tone?: "casual" | "professional" | "energetic" | "educational";
  ideaId?: string;
  ideaData?: {
    concept: string;
    hookTemplate: string;
    peqCategory: "problem" | "excuse" | "question";
    sourceText: string;
    targetAudience: string;
  };
  ideaContext?: {
    selectedNotes: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
    }>;
    contextMode: "inspiration" | "reference" | "template" | "comprehensive";
  };
  // Debug flag to return preprocessing steps
  includeDebugInfo?: boolean;
  // Test feature flags (for test page only)
  testFeatureFlags?: {
    template_hooks?: boolean;
    smart_bridges?: boolean;
  };
}

interface ScriptOption {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: "speed-write" | "educational" | "viral";
  elements?: {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  };
  metadata?: {
    targetWords: number;
    actualWords: number;
    tokensUsed?: number;
    responseTime?: number;
    generationMethod?: string;
    enhancedComponents?: {
      hook: string;
      bridge: string;
      goldenNugget: string;
      wta: string;
    };
    featureFlags?: Record<string, boolean>;
  };
}

interface SpeedWriteResponse {
  success: boolean;
  optionA?: ScriptOption | null;
  optionB?: ScriptOption | null;
  error?: string;
  processingTime?: number;
  debugInfo?: {
    validation?: any;
    enrichedInput?: any;
    rules?: any;
  };
  fallbackUsed?: boolean;
  generationMethod?: "v2" | "v1-fallback";
}

/**
 * V1 Fallback - generates scripts using the legacy ScriptService
 * Used when V2 UnifiedScriptService fails
 */
async function generateWithV1Fallback(
  body: SpeedWriteRequest,
  userId: string,
): Promise<{
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  fallbackUsed: boolean;
}> {
  console.log("🔄 [V2->V1 FALLBACK] Attempting V1 fallback generation...");

  try {
    // Convert V2 request to V1 format
    const v1Request = {
      idea: body.idea,
      length: body.length as "20" | "60" | "90", // V1 supports limited lengths
      type: body.type as "speed" | "educational" | "voice" | undefined,
      ideaContext: body.ideaContext,
    };

    let result;

    if (body.type) {
      // Single script generation
      const scriptResult = await ScriptService.generate(v1Request.type || "speed", {
        idea: v1Request.idea,
        length: v1Request.length,
        userId,
        ideaContext: v1Request.ideaContext,
      });

      const scriptOption = scriptResult?.success
        ? {
            id: "option-a",
            title: getScriptTitle(body.type),
            content: scriptResult.content || "",
            estimatedDuration: `${body.length} seconds`,
            approach: body.type === "viral" ? "viral" : body.type === "educational" ? "educational" : "speed-write",
            elements: scriptResult.elements || {
              hook: "",
              bridge: "",
              goldenNugget: "",
              wta: "",
            },
            metadata: {
              targetWords: scriptResult.metadata?.targetWords || 0,
              actualWords: scriptResult.metadata?.actualWords || 0,
              responseTime: scriptResult.metadata?.responseTime || 0,
              generationMethod: "v1-fallback",
            },
          }
        : null;

      result = {
        optionA: scriptOption,
        optionB: null,
      };
    } else {
      // A/B testing
      const abResult = await ScriptService.generateOptions({
        idea: v1Request.idea,
        length: v1Request.length,
        userId,
        ideaContext: v1Request.ideaContext,
      });

      const transformToV2Format = (
        v1Result: any,
        optionId: string,
        approach: "speed-write" | "viral",
      ): ScriptOption | null => {
        if (!v1Result?.success) return null;

        return {
          id: optionId,
          title: approach === "speed-write" ? "Speed Write Option" : "Viral Option",
          content: v1Result.content || "",
          estimatedDuration: `${body.length} seconds`,
          approach,
          elements: v1Result.elements || {
            hook: "",
            bridge: "",
            goldenNugget: "",
            wta: "",
          },
          metadata: {
            targetWords: v1Result.metadata?.targetWords || 0,
            actualWords: v1Result.metadata?.actualWords || 0,
            responseTime: v1Result.metadata?.responseTime || 0,
            generationMethod: "v1-fallback",
          },
        };
      };

      result = {
        optionA: transformToV2Format(abResult?.optionA, "option-a", "speed-write"),
        optionB: transformToV2Format(abResult?.optionB, "option-b", "viral"),
      };
    }

    console.log("✅ [V1 FALLBACK] V1 fallback generation completed successfully");
    return {
      ...result,
      fallbackUsed: true,
    };
  } catch (fallbackError) {
    console.error("❌ [V1 FALLBACK] V1 fallback also failed:", fallbackError);
    return {
      optionA: null,
      optionB: null,
      fallbackUsed: true,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SpeedWriteResponse>> {
  const startTime = Date.now();

  try {
    // Fast authentication check
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<SpeedWriteResponse>;
    }

    const { user } = authResult;

    // Parse request body
    let body: SpeedWriteRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

    // EARLY EXIT: Fast type guard check
    if (!hasRequiredFields(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: idea and length are required",
        },
        { status: 400 },
      );
    }

    // EARLY EXIT: Comprehensive input validation
    const validation = validateScriptGenerationInput(body);
    if (!validation.isValid) {
      console.log(`❌ [SCRIPT V2] Validation failed: ${validation.error} (field: ${validation.field})`);
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          suggestions: validation.suggestions,
        },
        { status: 400 },
      );
    }

    // EARLY EXIT: Content safety check
    if (!isContentSafe(body.idea)) {
      console.log(`🚨 [SCRIPT V2] Unsafe content detected: ${body.idea.substring(0, 50)}...`);
      return NextResponse.json(
        {
          success: false,
          error: "Content does not meet safety guidelines",
        },
        { status: 400 },
      );
    }

    // Log complexity for monitoring
    const complexity = estimateComplexity(body);
    console.log(`📊 [SCRIPT V2] Processing ${complexity} complexity request for user: ${user.uid}`);

    // Initialize service after validation passes
    const unifiedService = new UnifiedScriptService();

    console.log("✍️ [SCRIPT V2] Processing script generation request...");

    // Check credits
    const creditCheck = await CreditsService.canPerformAction(user.uid, "script_generation", "free");

    if (!creditCheck.canPerform) {
      return NextResponse.json(
        {
          success: false,
          error: creditCheck.reason || "Insufficient credits",
        },
        { status: 402 },
      );
    }

    // Sanitize the idea to avoid Gemini safety triggers while preserving meaning
    const sanitizedIdea = sanitizeForGemini(body.idea);
    console.log(`🔧 [SANITIZATION] Original: "${body.idea}"`);
    console.log(`🔧 [SANITIZATION] Sanitized: "${sanitizedIdea}"`);

    // Prepare unified input
    const unifiedInput: UnifiedScriptInput = {
      idea: sanitizedIdea,
      duration: body.length,
      type: body.type || "speed",
      tone: body.tone || "casual",
      context: body.ideaContext
        ? {
            notes: body.ideaContext.selectedNotes.map((note) => `${note.title}: ${note.content}`).join("\n\n"),
            referenceMode: body.ideaContext.contextMode,
          }
        : undefined,
    };

    try {
      let optionA: ScriptOption | null = null;
      let optionB: ScriptOption | null = null;
      let debugInfo: any = undefined;
      let fallbackUsed = false;
      let generationMethod: "v2" | "v1-fallback" = "v2";

      try {
        // Attempt V2 generation
        console.log("🚀 [V2 GENERATION] Attempting V2 unified service generation...");

        if (body.type) {
          // Single script generation
          let script;

          // If debug info requested, use the detailed method
          if (body.includeDebugInfo) {
            const result = await unifiedService.generateScriptWithSteps(unifiedInput, user.uid, body.testFeatureFlags);
            script = result.script;
            debugInfo = result.steps;
          } else {
            script = await unifiedService.generateScript(unifiedInput, user.uid, body.testFeatureFlags);
          }

          optionA = {
            id: "option-a",
            title: getScriptTitle(body.type),
            content: formatScriptContent(script),
            estimatedDuration: `${script.metadata.duration} seconds`,
            approach: body.type === "viral" ? "viral" : body.type === "educational" ? "educational" : "speed-write",
            elements: {
              hook: (script.hook || "").replace(/\s*\((Hook|HOOK)\)\s*$/i, "").trim(),
              bridge: (script.bridge || "").replace(/\s*\((Bridge|BRIDGE)\)\s*$/i, "").trim(),
              goldenNugget: (script.goldenNugget || script.golden_nugget || "")
                .replace(/\s*\((Golden Nugget|GOLDEN NUGGET)\)\s*$/i, "")
                .trim(),
              wta: (script.wta || script.cta || "").replace(/\s*\((CTA|WTA|Call to Action)\)\s*$/i, "").trim(),
            },
            metadata: {
              targetWords: script.metadata.wordCount,
              actualWords: script.metadata.wordCount,
              responseTime: Date.now() - startTime,
              generationMethod: script.metadata.generationMethod,
              enhancedComponents: script.metadata.enhancedComponents,
              featureFlags: script.metadata.featureFlags,
            },
          };
        } else {
          // A/B testing - generate two variations
          const [speedScript, viralScript] = await Promise.all([
            unifiedService.generateScript({ ...unifiedInput, type: "speed" }, user.uid, body.testFeatureFlags),
            unifiedService.generateScript({ ...unifiedInput, type: "viral" }, user.uid, body.testFeatureFlags),
          ]);

          // Debug logging
          console.log("🔍 [V2 Route] Speed Script Generated:", {
            hook: speedScript.hook,
            bridge: speedScript.bridge,
            goldenNugget: speedScript.goldenNugget,
            wta: speedScript.wta,
            metadata: speedScript.metadata,
          });

          optionA = {
            id: "option-a",
            title: "Speed Write Option",
            content: formatScriptContent(speedScript),
            estimatedDuration: `${speedScript.metadata.duration} seconds`,
            approach: "speed-write",
            elements: {
              hook: (speedScript.hook || "").replace(/\s*\((Hook|HOOK)\)\s*$/i, "").trim(),
              bridge: (speedScript.bridge || "").replace(/\s*\((Bridge|BRIDGE)\)\s*$/i, "").trim(),
              goldenNugget: (speedScript.goldenNugget || speedScript.golden_nugget || "")
                .replace(/\s*\((Golden Nugget|GOLDEN NUGGET)\)\s*$/i, "")
                .trim(),
              wta: (speedScript.wta || speedScript.cta || "")
                .replace(/\s*\((CTA|WTA|Call to Action)\)\s*$/i, "")
                .trim(),
            },
            metadata: {
              targetWords: speedScript.metadata.wordCount,
              actualWords: speedScript.metadata.wordCount,
              responseTime: Date.now() - startTime,
              generationMethod: speedScript.metadata.generationMethod,
              enhancedComponents: speedScript.metadata.enhancedComponents,
              featureFlags: speedScript.metadata.featureFlags,
            },
          };

          // Debug logging
          console.log("🔍 [V2 Route] Viral Script Generated:", {
            hook: viralScript.hook,
            bridge: viralScript.bridge,
            goldenNugget: viralScript.goldenNugget,
            wta: viralScript.wta,
            metadata: viralScript.metadata,
          });

          optionB = {
            id: "option-b",
            title: "Viral Option",
            content: formatScriptContent(viralScript),
            estimatedDuration: `${viralScript.metadata.duration} seconds`,
            approach: "viral",
            elements: {
              hook: (viralScript.hook || "").replace(/\s*\((Hook|HOOK)\)\s*$/i, "").trim(),
              bridge: (viralScript.bridge || "").replace(/\s*\((Bridge|BRIDGE)\)\s*$/i, "").trim(),
              goldenNugget: (viralScript.goldenNugget || viralScript.golden_nugget || "")
                .replace(/\s*\((Golden Nugget|GOLDEN NUGGET)\)\s*$/i, "")
                .trim(),
              wta: (viralScript.wta || viralScript.cta || "")
                .replace(/\s*\((CTA|WTA|Call to Action)\)\s*$/i, "")
                .trim(),
            },
            metadata: {
              targetWords: viralScript.metadata.wordCount,
              actualWords: viralScript.metadata.wordCount,
              responseTime: Date.now() - startTime,
              generationMethod: viralScript.metadata.generationMethod,
              enhancedComponents: viralScript.metadata.enhancedComponents,
              featureFlags: viralScript.metadata.featureFlags,
            },
          };
        }

        console.log("✅ [V2 GENERATION] V2 generation completed successfully");
      } catch (v2Error) {
        console.error("❌ [V2 GENERATION] V2 generation failed, attempting V1 fallback:", v2Error);

        // Check if V2 generated empty/invalid results
        const hasValidV2Results = optionA || optionB;

        if (!hasValidV2Results) {
          // Attempt V1 fallback
          const fallbackResult = await generateWithV1Fallback(body, user.uid);
          optionA = fallbackResult.optionA;
          optionB = fallbackResult.optionB;
          fallbackUsed = fallbackResult.fallbackUsed;
          generationMethod = "v1-fallback";

          // If V1 fallback also failed, throw error
          if (!optionA && !optionB) {
            throw new Error("Both V2 and V1 generation failed");
          }
        }
      }

      const processingTime = Date.now() - startTime;

      // Track usage with generation method
      await trackApiUsageAdmin(
        user.uid,
        "script-generation",
        fallbackUsed ? "speed-write-v2-fallback" : "speed-write-v2",
        {
          responseTime: processingTime,
          success: true,
          fallbackUsed,
        },
        {
          scriptLength: body.length,
          inputLength: body.idea.length,
          generationMethod,
        },
      );

      // Deduct credits
      await CreditsService.deductCredits(user.uid, "script_generation", "free", {
        idea: body.idea,
        length: body.length,
        type: body.type || "speed",
      });

      // Save the Ghost Writer idea to library if script generation was successful
      if ((optionA || optionB) && body.ideaId && body.ideaData) {
        try {
          console.log("📚 [SCRIPT V2] Saving Ghost Writer idea to library:", body.ideaId);

          const libraryDoc = adminDb.collection("ghost_writer_library").doc();
          await libraryDoc.set({
            id: libraryDoc.id,
            userId: user.uid,
            originalIdeaId: body.ideaId,
            concept: body.ideaData.concept || "",
            hook: body.idea || body.ideaData.concept || "",
            hookTemplate: body.ideaData.hookTemplate || "Concept",
            peqCategory: body.ideaData.peqCategory || "problem",
            sourceText: body.ideaData.sourceText || "",
            targetAudience: body.ideaData.targetAudience || "",
            estimatedDuration: body.length || "60",
            wordCount: body.idea.split(/\s+/).length,
            createdAt: new Date().toISOString(),
            savedAt: new Date().toISOString(),
            savedFrom: "script_generation_v2",
            generatedScripts: [
              {
                generatedAt: new Date().toISOString(),
                optionA: optionA
                  ? {
                      content: optionA.content,
                      estimatedDuration: optionA.estimatedDuration,
                    }
                  : null,
                optionB: optionB
                  ? {
                      content: optionB.content,
                      estimatedDuration: optionB.estimatedDuration,
                    }
                  : null,
              },
            ],
          });

          console.log("✅ [SCRIPT V2] Ghost Writer idea saved to library successfully");
        } catch (error) {
          console.error("⚠️ [SCRIPT V2] Failed to save Ghost Writer idea to library:", error);
          // Don't fail the script generation if saving to library fails
        }
      }

      return NextResponse.json({
        success: true,
        optionA,
        optionB,
        processingTime,
        generationMethod,
        ...(fallbackUsed && { fallbackUsed }),
        ...(debugInfo && { debugInfo }),
      });
    } catch (generationError) {
      console.error("❌ [SCRIPT V2] Generation error (all methods failed):", generationError);

      // Track failure
      await trackApiUsageAdmin(
        user.uid,
        "script-generation",
        "speed-write-v2-failed",
        {
          responseTime: Date.now() - startTime,
          success: false,
          error: generationError instanceof Error ? generationError.message : "Unknown error",
        },
        {
          scriptLength: body.length,
          inputLength: body.idea.length,
        },
      );

      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate script",
          details: generationError instanceof Error ? generationError.message : "Unknown error",
          generationMethod: "failed",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ [SCRIPT V2] Request error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function getScriptTitle(type: string): string {
  switch (type) {
    case "speed":
      return "Speed Write Option";
    case "educational":
      return "Educational Option";
    case "viral":
      return "Viral Option";
    default:
      return "Script Option";
  }
}

function formatScriptContent(script: any): string {
  // Handle both camelCase and snake_case field names, and both 'wta' and 'cta'
  const hook = script.hook || "";
  const bridge = script.bridge || "";
  const goldenNugget = script.goldenNugget || script.golden_nugget || "";
  const wta = script.wta || script.cta || "";

  // Remove any remaining inline labels from the content
  const cleanHook = hook.replace(/\s*\((Hook|HOOK)\)\s*$/i, "").trim();
  const cleanBridge = bridge.replace(/\s*\((Bridge|BRIDGE)\)\s*$/i, "").trim();
  const cleanGoldenNugget = goldenNugget.replace(/\s*\((Golden Nugget|GOLDEN NUGGET)\)\s*$/i, "").trim();
  const cleanWta = wta.replace(/\s*\((CTA|WTA|Call to Action)\)\s*$/i, "").trim();

  return `Hook: ${cleanHook}\n\nBridge: ${cleanBridge}\n\nGolden Nugget: ${cleanGoldenNugget}\n\nWTA: ${cleanWta}`;
}
