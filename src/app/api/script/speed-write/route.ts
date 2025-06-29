import { NextRequest, NextResponse } from "next/server";

import { SPEED_WRITE_CONFIG } from "@/config/speed-write-prompt";
import { generateScript } from "@/lib/gemini";
import { trackApiUsage, UsageTracker } from "@/lib/usage-tracker";

// Validate environment setup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is not set");
}

// Educational prompt template
const EDUCATIONAL_PROMPT_TEMPLATE = `Write a complete, ready-to-read video script for an educational video about the topic below. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record.

Target Length Guidelines:
- 20 seconds = ~50 words
- 60 seconds = ~130 words  
- 90 seconds = ~195 words

Script Structure:
1. Strong opening hook (choose one approach):
   - "The easiest way to [achieve goal] is..."
   - "Give me 30 seconds and I'll show you..."
   - "Here are 3 ways to [solve problem]..."
   - "This might be the best advice on [topic] you'll ever hear..."
   - "Stop [doing wrong thing]. Here's what works instead..."

2. Explain the core problem or challenge
3. Present your solution with specific steps or examples
4. End with clear value or call to action

Tone: Conversational, confident, and helpful. Use "you" frequently. Keep sentences short and punchy.

Video Topic: {VIDEO_IDEA}
Target Length: {TARGET_LENGTH} seconds

Write the complete script now:`;

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
  approach: "speed-write" | "educational";
}

interface SpeedWriteResponse {
  success: boolean;
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

async function processSpeedWriteRequest(body: SpeedWriteRequest): Promise<{
  speedWriteResult: any;
  educationalResult: any;
  processingTime: number;
}> {
  const { idea, length } = body;

  console.log(`📝 [SpeedWrite] Generating scripts for: "${idea.substring(0, 50)}..."`);

  // Generate both scripts in parallel
  const [speedWriteResult, educationalResult] = await Promise.allSettled([
    generateSpeedWriteScript(idea, length),
    generateEducationalScript(idea, length),
  ]);

  return { speedWriteResult, educationalResult, processingTime: Date.now() };
}

async function createScriptOptions(
  speedWriteResult: any,
  educationalResult: any,
  length: string
): Promise<{ optionA: ScriptOption | null; optionB: ScriptOption | null }> {
  const optionA = speedWriteResult.status === "fulfilled" && speedWriteResult.value.success
    ? createScriptOption("option-a", "Speed Write Formula", speedWriteResult.value.content!, "speed-write")
    : null;

  const optionB = educationalResult.status === "fulfilled" && educationalResult.value.success
    ? createScriptOption("option-b", "Educational Approach", educationalResult.value.content!, "educational")
    : null;

  return { optionA, optionB };
}

async function trackUsageForResults(
  userId: string,
  speedWriteResult: any,
  educationalResult: any,
  processingTime: number,
  idea: string,
  length: string
): Promise<void> {
  await Promise.allSettled([
    trackApiUsage(userId, "speed-write", "speed-write-a", {
      tokensUsed: speedWriteResult.status === "fulfilled" ? speedWriteResult.value.tokensUsed : 0,
      responseTime: processingTime / 2,
      success: speedWriteResult.status === "fulfilled" && speedWriteResult.value.success,
      error: speedWriteResult.status === "rejected" ? speedWriteResult.reason?.message : undefined,
    }, { scriptLength: length, inputLength: idea.length }),

    trackApiUsage(userId, "speed-write", "speed-write-b", {
      tokensUsed: educationalResult.status === "fulfilled" ? educationalResult.value.tokensUsed : 0,
      responseTime: processingTime / 2,
      success: educationalResult.status === "fulfilled" && educationalResult.value.success,
      error: educationalResult.status === "rejected" ? educationalResult.reason?.message : undefined,
    }, { scriptLength: length, inputLength: idea.length }),
  ]);
}

export async function POST(request: NextRequest): Promise<NextResponse<SpeedWriteResponse>> {
  const startTime = Date.now();
  console.log("🚀 [SpeedWrite] Starting A/B script generation...");

  try {
    // Parse and validate request
    const body: SpeedWriteRequest = await request.json();
    const { idea, userId = "anonymous" } = body;

    if (!idea?.trim()) {
      return NextResponse.json({
        success: false,
        optionA: null,
        optionB: null,
        error: "Script idea is required",
      }, { status: 400 });
    }

    // Rate limiting check
    const rateLimitOk = await UsageTracker.checkRateLimit(userId);
    if (!rateLimitOk) {
      return NextResponse.json({
        success: false,
        optionA: null,
        optionB: null,
        error: "Rate limit exceeded. Please try again in a few minutes.",
      }, { status: 429 });
    }

    const { speedWriteResult, educationalResult } = await processSpeedWriteRequest(body);
    const processingTime = Date.now() - startTime;

    const { optionA, optionB } = await createScriptOptions(speedWriteResult, educationalResult, body.length);

    await trackUsageForResults(userId, speedWriteResult, educationalResult, processingTime, idea, body.length);

    // Check if at least one script was generated successfully
    if (!optionA && !optionB) {
      const error = speedWriteResult.status === "rejected" 
        ? speedWriteResult.reason?.message 
        : "Failed to generate scripts";

      return NextResponse.json({
        success: false,
        optionA: null,
        optionB: null,
        error: error ?? "Failed to generate scripts. Please try again.",
      }, { status: 500 });
    }

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

    return NextResponse.json({
      success: false,
      optionA: null,
      optionB: null,
      error: "An unexpected error occurred. Please try again.",
      processingTime,
    }, { status: 500 });
  }
}

async function generateSpeedWriteScript(idea: string, length: string) {
  // Calculate target word count based on length
  const targetWords = Math.round(parseInt(length) * 2.2); // ~130 words per minute / 60 seconds * 2.2 = words per second
  
  const prompt = `Write a complete, ready-to-read video script using the Speed Write formula. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record.

Speed Write Formula:
1. Hook: Start with "If [specific problem], [try this action]." (8-12 words)
2. Advice: Give simple, actionable steps they can take right now
3. Reason: Explain why it works, starting with "This is..."
4. Benefit: End with the result they'll get, starting with "So you don't..." or "So you can..."

Target: ~${targetWords} words (${length} seconds)
Tone: Conversational, like talking to a friend. Use "you" frequently. Keep it simple and energetic.

Video Topic: ${idea}

Write the complete script now:`;

  return generateScript(prompt, { temperature: 0.8, maxTokens: 400 });
}

async function generateEducationalScript(idea: string, length: string) {
  const targetWords = Math.round(parseInt(length) * 2.2);
  
  const prompt = EDUCATIONAL_PROMPT_TEMPLATE
    .replace("{VIDEO_IDEA}", idea)
    .replace("{TARGET_LENGTH}", length);
    
  return generateScript(prompt, { temperature: 0.7, maxTokens: 400 });
}

function createScriptOption(
  id: string, 
  title: string, 
  content: string, 
  approach: "speed-write" | "educational"
): ScriptOption {
  const estimatedDuration = estimateVideoDuration(content);
  
  return {
    id,
    title,
    content: content.trim(),
    estimatedDuration,
    approach,
  };
}

function estimateVideoDuration(content: string): string {
  // Average reading speed: 150-160 words per minute
  // For video, account for pauses: ~130 WPM effective
  const wordCount = content.split(/\s+/).length;
  const estimatedSeconds = Math.round((wordCount / 130) * 60);
  
  // Compare with target
  const target = 60; // Assuming target length is 60 seconds
  const variance = Math.abs(estimatedSeconds - target);
  
  if (variance <= 5) {
    return `~60s`;
  } else if (estimatedSeconds < target) {
    return `~${estimatedSeconds}s (shorter than 60s target)`;
  } else {
    return `~${estimatedSeconds}s (longer than 60s target)`;
  }
} 