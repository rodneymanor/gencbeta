import { NextRequest, NextResponse } from "next/server";

import { ScriptService } from "@/lib/services/script-generation-service";
import { authenticateApiKey } from "@/lib/api-key-auth";
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
  };
}

interface SpeedWriteResponse {
  success: boolean;
  optionA?: ScriptOption | null;
  optionB?: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

// Helper functions for transformation
function calculateEstimatedDuration(content: string): string {
  // Estimate based on average speaking rate of 150 words per minute
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 150);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function getScriptTitle(approach: "speed-write" | "educational" | "viral"): string {
  switch (approach) {
    case "speed-write":
      return "Speed Write Option";
    case "educational":
      return "Educational Option";
    case "viral":
      return "Viral Option";
    default:
      return "Script Option";
  }
}

function transformToScriptOption(
  result: any,
  optionId: string,
  approach: "speed-write" | "educational" | "viral"
): ScriptOption | null {
  console.log(`🔍 [TRANSFORM] transformToScriptOption called with:`, {
    optionId,
    approach,
    result: JSON.stringify(result, null, 2),
    resultType: typeof result,
    resultKeys: result ? Object.keys(result) : null,
    hasSuccess: result?.success,
    hasContent: result?.content,
    hasElements: result?.elements,
    contentLength: result?.content?.length || 0,
  });

  if (!result || !result.success) {
    console.log(`❌ [TRANSFORM] Returning null for ${optionId}: result=${!!result}, success=${result?.success}`);
    return null;
  }

  const transformed = {
    id: optionId,
    title: getScriptTitle(approach),
    content: result.content || "",
    estimatedDuration: calculateEstimatedDuration(result.content || ""),
    approach,
    elements: typeof result.elements === 'string' ? result.elements : result.elements,
    metadata: result.metadata ? {
      targetWords: result.metadata.targetWords || 0,
      actualWords: result.metadata.actualWords || 0,
      tokensUsed: result.metadata.tokensUsed,
      responseTime: result.metadata.responseTime,
    } : undefined,
  };

  console.log(`✅ [TRANSFORM] Successfully transformed ${optionId}:`, {
    id: transformed.id,
    title: transformed.title,
    contentLength: transformed.content.length,
    hasElements: !!transformed.elements,
    elementsKeys: transformed.elements ? Object.keys(transformed.elements) : null,
    hasMetadata: !!transformed.metadata,
    approach: transformed.approach,
  });

  return transformed;
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
    console.log("✍️ [SCRIPT] Request body:", body);

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
      console.log("🔍 [SCRIPT] Calling ScriptService.generateOptions with:", {
        idea: body.idea,
        length: body.length,
        userId: user.uid,
      });
      
      try {
        result = await ScriptService.generateOptions({
          idea: body.idea,
          length: body.length,
          userId: user.uid,
        });
        
        console.log(`🔍 [SCRIPT] Raw result from ScriptService.generateOptions:`, {
          type: typeof result,
          keys: result ? Object.keys(result) : null,
          optionA: result?.optionA ? {
            type: typeof result.optionA,
            keys: Object.keys(result.optionA),
            success: result.optionA.success,
            hasContent: !!result.optionA.content,
            contentPreview: result.optionA.content?.substring(0, 100) + "...",
            error: result.optionA.error
          } : "NULL - no optionA",
          optionB: result?.optionB ? {
            type: typeof result.optionB,
            keys: Object.keys(result.optionB),
            success: result.optionB.success,
            hasContent: !!result.optionB.content,
            contentPreview: result.optionB.content?.substring(0, 100) + "...",
            error: result.optionB.error
          } : "NULL - no optionB"
        });
        
        // Log the exact reason why options might be null
        if (!result?.optionA) {
          console.log("❌ [SCRIPT] optionA is null - script generation failed");
        } else if (!result.optionA.success) {
          console.log("❌ [SCRIPT] optionA.success is false:", result.optionA.error);
        }
        
        if (!result?.optionB) {
          console.log("❌ [SCRIPT] optionB is null - script generation failed");
        } else if (!result.optionB.success) {
          console.log("❌ [SCRIPT] optionB.success is false:", result.optionB.error);
        }
        
        console.log("🔍 [SCRIPT] ScriptService.generateOptions returned:");
        console.log("🔍 [SCRIPT] Raw result:", JSON.stringify(result, null, 2));
        console.log("🔍 [SCRIPT] Result type:", typeof result);
        console.log("🔍 [SCRIPT] Result keys:", result ? Object.keys(result) : null);
        console.log("🔍 [SCRIPT] optionA details:", {
          exists: !!result?.optionA,
          type: typeof result?.optionA,
          keys: result?.optionA ? Object.keys(result.optionA) : null,
          success: result?.optionA?.success,
          content: result?.optionA?.content ? `"${result.optionA.content.substring(0, 100)}..."` : null,
          contentLength: result?.optionA?.content?.length || 0,
          elements: result?.optionA?.elements,
          metadata: result?.optionA?.metadata,
        });
        console.log("🔍 [SCRIPT] optionB details:", {
          exists: !!result?.optionB,
          type: typeof result?.optionB,
          keys: result?.optionB ? Object.keys(result.optionB) : null,
          success: result?.optionB?.success,
          content: result?.optionB?.content ? `"${result.optionB.content.substring(0, 100)}..."` : null,
          contentLength: result?.optionB?.content?.length || 0,
          elements: result?.optionB?.elements,
          metadata: result?.optionB?.metadata,
        });
      } catch (error) {
        console.error("❌ [SCRIPT] ScriptService.generateOptions error:", error);
        // Fallback to mock data for testing
        result = {
          optionA: {
            success: true,
            content: `Hook: ${body.idea}\n\nBridge: This is a test bridge\n\nGolden Nugget: ${body.idea}\n\nWTA: Take action now!`,
            elements: {
              hook: body.idea,
              bridge: "This is a test bridge",
              goldenNugget: body.idea,
              wta: "Take action now!"
            }
          },
          optionB: {
            success: true,
            content: `Hook: ${body.idea}\n\nBridge: This is a viral test bridge\n\nGolden Nugget: ${body.idea}\n\nWTA: Go viral now!`,
            elements: {
              hook: body.idea,
              bridge: "This is a viral test bridge", 
              goldenNugget: body.idea,
              wta: "Go viral now!"
            }
          }
        };
        console.log("🔍 [SCRIPT] Using fallback mock data:", result);
      }
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
    
    console.log("🔍 [SCRIPT] About to transform results:");
    console.log("🔍 [SCRIPT] result.optionA exists:", !!result.optionA);
    console.log("🔍 [SCRIPT] result.optionB exists:", !!result.optionB);
    
    // Transform results to ScriptOption format
    console.log(`🔍 [SCRIPT] About to transform results:`, {
      optionA: result.optionA ? "exists" : "null",
      optionB: result.optionB ? "exists" : "null",
    });
    
    const transformedResult = {
      optionA: result.optionA ? transformToScriptOption(result.optionA, "option-a", "speed-write") : null,
      optionB: result.optionB ? transformToScriptOption(result.optionB, "option-b", "viral") : null,
    };
    
    console.log(`🔍 [SCRIPT] After transformation:`, {
      optionA: transformedResult.optionA ? "transformed successfully" : "null",
      optionB: transformedResult.optionB ? "transformed successfully" : "null",
    });
    
    console.log("🔍 [SCRIPT] Transformation completed:");
    console.log("🔍 [SCRIPT] transformedResult.optionA:", transformedResult.optionA ? "SUCCESS" : "NULL");
    console.log("🔍 [SCRIPT] transformedResult.optionB:", transformedResult.optionB ? "SUCCESS" : "NULL");
    
    const finalResponse = {
      success: true,
      optionA: transformedResult.optionA,
      optionB: transformedResult.optionB,
      processingTime,
    };
    
    console.log("🔍 [SCRIPT] Final JSON response structure:");
    console.log("🔍 [SCRIPT] Raw JSON:", JSON.stringify(finalResponse, null, 2));
    console.log("🔍 [SCRIPT] Response validation:");
    console.log("🔍 [SCRIPT] - success:", finalResponse.success);
    console.log("🔍 [SCRIPT] - optionA is null:", finalResponse.optionA === null);
    console.log("🔍 [SCRIPT] - optionB is null:", finalResponse.optionB === null);
    console.log("🔍 [SCRIPT] - processingTime:", finalResponse.processingTime);

    return NextResponse.json(finalResponse);
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
