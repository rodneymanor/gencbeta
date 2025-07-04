import { NextRequest, NextResponse } from "next/server";

import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { CreditsService } from "@/lib/credits-service";
import { adminDb } from "@/lib/firebase-admin";
import { generateScript } from "@/lib/gemini";
import { NegativeKeywordsService } from "@/lib/negative-keywords-service";
import { generateScriptWithValidation, validateScript, cleanScriptContent } from "@/lib/script-validation";
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

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface ScriptOption {
  id: string;
  title: string;
  content: string;
  elements?: ScriptElements; // New structured elements
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

function createVoicePrompt(activeVoice: AIVoice, idea: string, length: string, negativeKeywordInstruction: string): string {
  const randomTemplate = activeVoice.templates[Math.floor(Math.random() * activeVoice.templates.length)];
  const targetWordCount = VoiceTemplateProcessor.calculateTargetWordCount(randomTemplate, parseInt(length));

  return `ROLE:
You are an expert content strategist and copywriter. Your primary skill is deconstructing information and skillfully reassembling it into a different, predefined narrative or structural framework.

OBJECTIVE:
Your task is to take the [1. Source Content] and rewrite it so that it perfectly fits the structure, tone, and cadence of the [2. Structural Template]. Return the result in a structured JSON format with each element clearly separated.

CRITICAL PLACEHOLDER REPLACEMENT RULE:
Any text in square brackets [like this] in the template are PLACEHOLDERS that MUST be replaced with actual, specific content from your source material. NEVER leave any square brackets or placeholder text in your final output. Every [placeholder] must become real words.

[1. SOURCE CONTENT - The "What"]
${idea}

[2. STRUCTURAL TEMPLATE - The "How"]
Hook: ${randomTemplate.hook}
Bridge: ${randomTemplate.bridge}
Golden Nugget: ${randomTemplate.nugget}
What To Act: ${randomTemplate.wta}

INSTRUCTIONS:
1. Replace ALL placeholders [like this] with actual content from the source material
2. Maintain the template's tone and narrative voice
3. Ensure smooth transitions between sections
4. Target approximately ${targetWordCount} words for a ${length}-second read

${negativeKeywordInstruction}

Return your response in this exact JSON format:
{
  "hook": "Your adapted hook section with all placeholders replaced",
  "bridge": "Your adapted bridge section with all placeholders replaced",
  "goldenNugget": "Your adapted golden nugget section with all placeholders replaced", 
  "wta": "Your adapted what-to-act section with all placeholders replaced"
}

FINAL CHECK: Ensure NO square brackets [like this] remain in your JSON response.`;
}

async function generateAIVoiceScript(idea: string, length: string, activeVoice: AIVoice, userId: string) {
  // Get user's negative keywords
  const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);
  
  const prompt = createVoicePrompt(activeVoice, idea, length, negativeKeywordInstruction);

  try {
    // Use validation wrapper to ensure no placeholders remain
    const result = await generateScriptWithValidation(
      () => generateScript(prompt),
      (result) => result.content ?? "",
      { maxRetries: 3, retryDelay: 1000 }
    );

    // Clean and validate the content
    const rawContent = result.content ?? "";
    
    // Parse the structured response
    let elements: ScriptElements;
    try {
      const parsed = JSON.parse(rawContent);
      elements = {
        hook: parsed.hook ?? "",
        bridge: parsed.bridge ?? "",
        goldenNugget: parsed.goldenNugget ?? "",
        wta: parsed.wta ?? ""
      };
    } catch (parseError) {
      console.warn("[SpeedWrite] Failed to parse AI voice structured response, falling back to plain text");
      // Fallback: return as single content block with cleaned content
      const cleanedContent = cleanScriptContent(rawContent);
      elements = {
        hook: "",
        bridge: "",
        goldenNugget: "",
        wta: cleanedContent
      };
    }

    // Combine elements into full script content
    const fullContent = [elements.hook, elements.bridge, elements.goldenNugget, elements.wta]
      .filter(Boolean)
      .join('\n\n');

    const validation = validateScript(fullContent);
    if (!validation.isValid) {
      console.warn(`⚠️ [SpeedWrite] AI Voice script has validation issues:`, validation.issues);
    }
    
    return {
      ...result,
      content: fullContent,
      elements,
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

async function generateSpeedWriteScript(idea: string, length: string, userId: string) {
  const targetWords = Math.round(parseInt(length) * 2.2);

  // Get user's negative keywords
  const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

  const prompt = `Write a video script using the Speed Write formula. Return the script in a structured JSON format with each element clearly separated.

IMPORTANT: Write actual words, not descriptions or instructions. Each section should be complete and ready to record.

Target Length: ${length} seconds (~${targetWords} words)

Script Topic: ${idea}${negativeKeywordInstruction}

Return your response in this exact JSON format:
{
  "hook": "Your attention-grabbing opener that hooks the viewer immediately",
  "bridge": "Your transition that connects the hook to the main content",
  "goldenNugget": "Your core value, insight, or main teaching point",
  "wta": "Your clear call to action that tells viewers what to do next"
}

Make sure each section flows naturally into the next when read aloud.`;

  try {
    const result = await generateScriptWithValidation(
      () => generateScript(prompt),
      (result) => result.content ?? "",
      { maxRetries: 2, retryDelay: 500 }
    );

    const rawContent = result.content ?? "";

    // Parse the structured response
    let elements: ScriptElements;
    try {
      const parsed = JSON.parse(rawContent);
      elements = {
        hook: parsed.hook ?? "",
        bridge: parsed.bridge ?? "",
        goldenNugget: parsed.goldenNugget ?? "",
        wta: parsed.wta ?? ""
      };
    } catch (parseError) {
      console.warn("[SpeedWrite] Failed to parse structured response, falling back to plain text");
      // Fallback: return as single content block with cleaned content
      const cleanedContent = cleanScriptContent(rawContent);
      elements = {
        hook: "",
        bridge: "",
        goldenNugget: "",
        wta: cleanedContent
      };
    }

    // Combine elements into full script content
    const fullContent = [elements.hook, elements.bridge, elements.goldenNugget, elements.wta]
      .filter(Boolean)
      .join('\n\n');

    return {
      ...result,
      content: fullContent,
      elements
    };
  } catch (error) {
    console.error("[SpeedWrite] Speed Write script generation failed:", error);
    throw error;
  }
}

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
