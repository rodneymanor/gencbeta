import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";
import { adminDb } from "@/lib/firebase-admin";
import { generateScript } from "@/lib/gemini";
import { trackApiUsageAdmin, UsageTrackerAdmin } from "@/lib/usage-tracker-admin";
import { AIVoice } from "@/types/ai-voices";

// Validate environment setup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is not set");
}

interface SpeedWriteRequest {
  idea: string;
  length: "20" | "60" | "90";
  userId?: string;
}

interface ScriptOption {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: "speed-write" | "educational" | "ai-voice";
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
}

interface SpeedWriteResponse {
  success: boolean;
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

async function getActiveVoice(userId: string): Promise<AIVoice | null> {
  try {
    // Get user's active voice
    const voicesSnapshot = await adminDb
      .collection("aiVoices")
      .where("userId", "==", userId)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!voicesSnapshot.empty) {
      const doc = voicesSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as AIVoice;
    }

    // Check for shared active voices
    const sharedSnapshot = await adminDb
      .collection("aiVoices")
      .where("isShared", "==", true)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!sharedSnapshot.empty) {
      const doc = sharedSnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as AIVoice;
    }

    return null;
  } catch (error) {
    console.warn("[SpeedWrite] Failed to fetch active voice:", error);
    return null;
  }
}

function createVoicePrompt(activeVoice: AIVoice, idea: string, length: string): string {
  const randomTemplate = activeVoice.templates[Math.floor(Math.random() * activeVoice.templates.length)];
  const targetWords = Math.round(parseInt(length) * 2.2);

  return `Write a complete, ready-to-read video script in the style of ${activeVoice.name}${activeVoice.creatorInspiration ? ` (inspired by ${activeVoice.creatorInspiration})` : ""}.

Use this template structure for the topic "${idea}":

HOOK: ${randomTemplate.hook}
BRIDGE: ${randomTemplate.bridge}
GOLDEN NUGGET: ${randomTemplate.nugget}
WHAT TO ACT (WTA): ${randomTemplate.wta}

Requirements:
- Target length: ${length} seconds (~${targetWords} words)
- Replace bracketed placeholders with content specific to "${idea}"
- Maintain voice characteristics: ${activeVoice.badges.join(", ")}
- Keep the same energy and tone as the original template
- Write the complete script ready to record

Script Topic: ${idea}
Target Length: ${length} seconds

Write the complete script now:`;
}

async function generateAIVoiceScript(idea: string, length: string, activeVoice: AIVoice) {
  const prompt = createVoicePrompt(activeVoice, idea, length);

  try {
    const result = await generateScript(prompt);
    return {
      ...result,
      approach: "ai-voice" as const,
      voice: {
        id: activeVoice.id,
        name: activeVoice.name,
        badges: activeVoice.badges,
      },
    };
  } catch (error) {
    console.error("[SpeedWrite] AI Voice script generation failed:", error);
    throw error;
  }
}

async function generateSpeedWriteScript(idea: string, length: string) {
  const targetWords = Math.round(parseInt(length) * 2.2);

  const prompt = `Write a complete, ready-to-read video script using the Speed Write formula. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record.

Target Length: ${length} seconds (~${targetWords} words)

Speed Write Formula:
1. HOOK: Start with attention-grabbing opener
2. BRIDGE: Connect hook to main content  
3. GOLDEN NUGGET: Deliver core value/insight
4. WHAT TO ACT (WTA): Clear call to action

Script Topic: ${idea}

Write the complete script now:`;

  return generateScript(prompt);
}

async function generateEducationalScript(idea: string, length: string) {
  const targetWords = Math.round(parseInt(length) * 2.2);

  const prompt = `Write a complete, ready-to-read video script for an educational video about the topic below. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record.

Target Length: ${length} seconds (~${targetWords} words)

Script Structure:
1. Strong opening hook
2. Explain the core problem or challenge
3. Present your solution with specific steps or examples
4. End with clear value or call to action

Tone: Conversational, confident, and helpful. Use "you" frequently. Keep sentences short and punchy.

Video Topic: ${idea}

Write the complete script now:`;

  return generateScript(prompt);
}

function createScriptOption(
  id: string,
  title: string,
  content: string,
  approach: "speed-write" | "educational" | "ai-voice",
  voice?: { id: string; name: string; badges: string[] },
): ScriptOption {
  return {
    id,
    title,
    content,
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

  const promises: Promise<any>[] = [generateSpeedWriteScript(idea, length), generateEducationalScript(idea, length)];

  // Add AI voice generation if available
  if (activeVoice && activeVoice.templates && activeVoice.templates.length > 0) {
    console.log(`[SpeedWrite] Including AI Voice: ${activeVoice.name}`);
    promises.push(generateAIVoiceScript(idea, length, activeVoice));
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
      aiVoiceResult.value.content!,
      "ai-voice",
      aiVoiceResult.value.voice,
    );

    const optionB =
      speedWriteResult.status === "fulfilled" && speedWriteResult.value.success
        ? createScriptOption("option-b", "Speed Write Formula", speedWriteResult.value.content!, "speed-write")
        : educationalResult.status === "fulfilled" && educationalResult.value.success
          ? createScriptOption("option-b", "Educational Approach", educationalResult.value.content!, "educational")
          : null;

    return { optionA, optionB };
  }

  // Default to original A/B structure
  const optionA =
    speedWriteResult.status === "fulfilled" && speedWriteResult.value.success
      ? createScriptOption("option-a", "Speed Write Formula", speedWriteResult.value.content!, "speed-write")
      : null;

  const optionB =
    educationalResult.status === "fulfilled" && educationalResult.value.success
      ? createScriptOption("option-b", "Educational Approach", educationalResult.value.content!, "educational")
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
  console.log("🚀 [SpeedWrite] Starting A/B script generation...");

  try {
    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<SpeedWriteResponse>;
    }

    const { user, rateLimitResult } = authResult;
    const userId = user.uid;
    const accountLevel = user.role === "super_admin" || user.role === "coach" ? "pro" : "free";
    const body: SpeedWriteRequest = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return createErrorResponse(validation.error!, 400);
    }

    // Check rate limiting from auth result
    if (!rateLimitResult.allowed) {
      return createErrorResponse(rateLimitResult.reason ?? "Rate limit exceeded", 429);
    }

    // Check if user has enough credits
    const creditCheck = await CreditsService.canPerformAction(userId, "SCRIPT_GENERATION", accountLevel);
    if (!creditCheck.canPerform) {
      return createErrorResponse(creditCheck.reason ?? "Insufficient credits", 402);
    }

    // Process scripts
    const { speedWriteResult, educationalResult, aiVoiceResult } = await processSpeedWriteRequest(body, userId);
    const processingTime = Date.now() - startTime;

    const { optionA, optionB } = await createScriptOptions(
      speedWriteResult,
      educationalResult,
      aiVoiceResult,
      body.length,
    );

    // Check if at least one script was generated successfully
    if (!optionA && !optionB) {
      const error =
        speedWriteResult.status === "rejected" ? speedWriteResult.reason?.message : "Failed to generate scripts";
      return createErrorResponse(error ?? "Failed to generate scripts. Please try again.", 500);
    }

    // Deduct credits for successful generation
    await CreditsService.trackUsageAndDeductCredits(
      userId,
      "SCRIPT_GENERATION",
      accountLevel,
      {
        service: "gemini",
        tokensUsed: (speedWriteResult.status === "fulfilled" ? speedWriteResult.value.tokensUsed : 0) +
                   (educationalResult.status === "fulfilled" ? educationalResult.value.tokensUsed : 0),
        responseTime: processingTime,
        success: true,
        timestamp: new Date().toISOString(),
        metadata: { scriptLength: body.length, inputLength: body.idea.length },
      }
    );

    // Track usage
    await trackUsageResults(userId, body, speedWriteResult, educationalResult, processingTime);

    console.log(`✅ [SpeedWrite] Generated ${optionA ? 1 : 0} + ${optionB ? 1 : 0} scripts in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      optionA,
      optionB,
      processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ [SpeedWrite] Generation failed after ${processingTime}ms:`, error);

    return NextResponse.json(
      {
        success: false,
        optionA: null,
        optionB: null,
        error: "An unexpected error occurred. Please try again.",
        processingTime,
      },
      { status: 500 },
    );
  }
}
