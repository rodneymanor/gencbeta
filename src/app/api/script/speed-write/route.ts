import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { ScriptService } from "@/lib/core/script/script-service";
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

// All script generation logic moved to ScriptService

async function generateEducationalScript(idea: string, length: string, userId: string) {
  const targetWords = Math.round(parseInt(length) * 2.2);

  // Get user's negative keywords
  const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

  const prompt = `Write a complete, ready-to-read video script for an educational video about the topic below. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record. Do not include any placeholder text in square brackets [like this].

Target Length: ${length} seconds (~${targetWords} words)

Script Structure:
1. Strong opening hook
2. Explain the core problem or challenge
3. Present your solution with specific steps or examples
4. End with clear value or call to action

Tone: Conversational, confident, and helpful. Use "you" frequently. Keep sentences short and punchy.

Video Topic: ${idea}${negativeKeywordInstruction}

Write the complete script now:`;

  try {
    const result = await generateScriptWithValidation(
      () => generateScript(prompt),
      (result) => result.content ?? "",
      { maxRetries: 2, retryDelay: 500 }
    );

    const cleanedContent = cleanScriptContent(result.content ?? "");
    return {
      ...result,
      content: cleanedContent
    };
  } catch (error) {
    console.error("[SpeedWrite] Educational script generation failed:", error);
    throw error;
  }
}

function createScriptOption(
  id: string,
  title: string,
  content: string,
  approach: "speed-write" | "educational" | "ai-voice",
  voice?: { id: string; name: string; badges: string[] },
  elements?: ScriptElements,
): ScriptOption {
  return {
    id,
    title,
    content,
    elements,
    estimatedDuration: "60s", // This could be calculated based on word count
    approach,
    voice,
  };
}

async function processSpeedWriteRequest(
  body: SpeedWriteRequest,
  userId: string,
): Promise<{
  speedWriteResult: any;
  educationalResult: any;
  aiVoiceResult?: any;
  processingTime: number;
}> {
  const { idea, length } = body;

  console.log(`📝 [SpeedWrite] Generating scripts for: "${idea.substring(0, 50)}..."`);

  // Check for active AI voice
  const activeVoice = await getActiveVoice(userId);

  const promises: Promise<any>[] = [generateSpeedWriteScript(idea, length, userId), generateEducationalScript(idea, length, userId)];

  // Add AI voice generation if available
  if (activeVoice && activeVoice.templates && activeVoice.templates.length > 0) {
    console.log(`[SpeedWrite] Including AI Voice: ${activeVoice.name}`);
    promises.push(generateAIVoiceScript(idea, length, activeVoice, userId));
  }

  const results = await Promise.allSettled(promises);

  return {
    speedWriteResult: results[0],
    educationalResult: results[1],
    aiVoiceResult: results[2] || null,
    processingTime: Date.now(),
  };
}

async function createScriptOptions(
  speedWriteResult: any,
  educationalResult: any,
  aiVoiceResult: any,
  length: string,
): Promise<{ optionA: ScriptOption | null; optionB: ScriptOption | null }> {
  // Prioritize AI Voice if available and successful
  if (aiVoiceResult?.status === "fulfilled" && aiVoiceResult.value.success) {
    const optionA = createScriptOption(
      "option-a",
      `${aiVoiceResult.value.voice.name} Voice`,
      aiVoiceResult.value.content,
      "ai-voice",
      aiVoiceResult.value.voice,
      aiVoiceResult.value.elements,
    );

    const optionB =
      speedWriteResult.status === "fulfilled" && speedWriteResult.value.success
        ? createScriptOption(
            "option-b",
            "Speed Write Formula",
            speedWriteResult.value.content,
            "speed-write",
            undefined,
            speedWriteResult.value.elements,
          )
        : educationalResult.status === "fulfilled" && educationalResult.value.success
          ? createScriptOption(
              "option-b",
              "Educational Approach",
              educationalResult.value.content,
              "educational",
            )
          : null;

    return { optionA, optionB };
  }

  // Default to original A/B structure
  const optionA =
    speedWriteResult.status === "fulfilled" && speedWriteResult.value.success
      ? createScriptOption(
          "option-a",
          "Speed Write Formula",
          speedWriteResult.value.content,
          "speed-write",
          undefined,
          speedWriteResult.value.elements,
        )
      : null;

  const optionB =
    educationalResult.status === "fulfilled" && educationalResult.value.success
      ? createScriptOption(
          "option-b",
          "Educational Approach",
          educationalResult.value.content,
          "educational",
        )
      : null;

  return { optionA, optionB };
}

function validateRequest(body: SpeedWriteRequest): { isValid: boolean; error?: string } {
  if (!body.idea?.trim()) {
    return { isValid: false, error: "Script idea is required" };
  }
  return { isValid: true };
}

function createErrorResponse(error: string, status: number = 500): NextResponse<SpeedWriteResponse> {
  return NextResponse.json(
    {
      success: false,
      optionA: null,
      optionB: null,
      error,
    },
    { status },
  );
}

async function trackUsageResults(
  userId: string,
  body: SpeedWriteRequest,
  speedWriteResult: any,
  educationalResult: any,
  processingTime: number,
): Promise<void> {
  await Promise.allSettled([
    trackApiUsageAdmin(
      userId,
      "speed-write",
      "speed-write-a",
      {
        tokensUsed: speedWriteResult.status === "fulfilled" ? speedWriteResult.value.tokensUsed : 0,
        responseTime: processingTime / 2,
        success: speedWriteResult.status === "fulfilled" && speedWriteResult.value.success,
        error: speedWriteResult.status === "rejected" ? speedWriteResult.reason?.message : undefined,
      },
      { scriptLength: body.length, inputLength: body.idea.length },
    ),
    trackApiUsageAdmin(
      userId,
      "speed-write",
      "speed-write-b",
      {
        tokensUsed: educationalResult.status === "fulfilled" ? educationalResult.value.tokensUsed : 0,
        responseTime: processingTime / 2,
        success: educationalResult.status === "fulfilled" && educationalResult.value.success,
        error: educationalResult.status === "rejected" ? educationalResult.reason?.message : undefined,
      },
      { scriptLength: body.length, inputLength: body.idea.length },
    ),
  ]);
}

export async function POST(request: NextRequest): Promise<NextResponse<SpeedWriteResponse>> {
  const startTime = Date.now();
  
  try {
    // Authenticate user (keeping existing auth)
    const user = await authenticateApiKey(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: SpeedWriteRequest = await request.json();
    
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
