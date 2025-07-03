import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";
import { adminDb } from "@/lib/firebase-admin";
import { generateScript } from "@/lib/gemini";
import { trackApiUsageAdmin, UsageTrackerAdmin } from "@/lib/usage-tracker-admin";
import { VoiceTemplateProcessor } from "@/lib/voice-template-processor";
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
  const targetWordCount = VoiceTemplateProcessor.calculateTargetWordCount(randomTemplate, parseInt(length));

  return `ROLE:
You are an expert content strategist and copywriter. Your primary skill is deconstructing information and skillfully reassembling it into a different, predefined narrative or structural framework.

OBJECTIVE:
Your task is to take the [1. Source Content] and rewrite it so that it perfectly fits the structure, tone, and cadence of the [2. Structural Template]. The goal is to produce a new, seamless piece of content that accomplishes the goal of the Source Content while flawlessly embodying the style of the Structural Template.

PRIMARY CONSTRAINT:
The final output must adhere closely to the provided template. The deviation from the template's core structure and language should be minimal, ideally less than 15%. The new content should feel as though it was originally created for this specific format.

[1. SOURCE CONTENT - The "What"]
(This is the information you want to communicate.)

${idea}

[2. STRUCTURAL TEMPLATE - The "How"]
(This is the format, style, and narrative structure you want to follow.)

Hook: ${randomTemplate.hook}

Bridge: ${randomTemplate.bridge}

Golden Nugget: ${randomTemplate.nugget}

What To Act: ${randomTemplate.wta}

Execution Instructions for AI:
Your task is to adapt my source content into a script using the provided template. Follow these instructions precisely to ensure a high-quality, coherent, and effective result.

1. Analyze and Deconstruct
First, thoroughly analyze the chosen template's components (hook, bridge, nugget, wta). Identify its core narrative function (e.g., is it a personal story, a persuasion framework, a step-by-step guide, or a philosophical lesson?). Concurrently, analyze the core components of my source content to identify the main problem, solution, key facts, and central message.

2. Interpret and Map Concepts
Your primary goal is to logically map the key ideas from my source content onto the [placeholders] in the template. Do not perform a literal word replacement; interpret the contextual meaning of each placeholder (e.g., [Negative Consequence], [Desired Outcome]) and fill it with the most fitting concept from my source material.

3. Adopt the Narrative Voice
You must adopt the specific tone and narrative voice implied by the template's structure and language. If the template is written in the first person, your script should be too. If it is authoritative, your tone should be confident. The final output must feel authentic to the template's style.

4. Ensure Cohesion and Flow
Assemble the filled hook, bridge, nugget, and wta sections into a single, seamless script. The transition from one section to the next must be smooth and natural. The final script should not sound like a form that has been filled out, but like a story or argument that flows logically from beginning to end.

5. Format the Final Output
Present the final, complete script as a single block of text.

Do not use labels like hook:, bridge:, etc. in your final answer.

Separate the content generated for each section (hook, bridge, nugget, and wta) with a single line break.

The output must be a clean script, ready to be copied and pasted.

Target approximately ${targetWordCount} words for a ${length}-second read.`;
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
    const creditCheck = await CreditsService.canPerformAction(userId, "script_generation", accountLevel);
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
      "script_generation",
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
