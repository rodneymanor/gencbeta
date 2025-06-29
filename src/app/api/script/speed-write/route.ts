import { NextRequest, NextResponse } from "next/server";
import { generateScript } from "@/lib/gemini";
import { trackApiUsage, UsageTracker } from "@/lib/usage-tracker";
import { SPEED_WRITE_CONFIG } from "@/config/speed-write-prompt";

// Validate environment setup
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is not set");
}

// Educational prompt template
const EDUCATIONAL_PROMPT_TEMPLATE = `Using the video idea below, write a script for an educational and informative video. Keep in mind that the video script will be read out loud and not shown on the screen.

The script should follow this format:
- Hook (starting with one of these lines, adapted to the topic):
  • "The easiest way for you to..."
  • "Give me 30 seconds and I'll show you how to..."
  • "Here are 4 ways that you can [achieve X]"
  • "This might just be the best advice on [niche] that I've ever heard..."
  • "Stop doing [insert activity] alone. One of the best strategies to [insert goal] is [insert strategy]."
  • "Here's a quick and easy way to [insert action]."
  • "Top [insert number] tips for [insert activity or goal]."
  • "If you're a [insert group or membership], keep watching."
  • "Want to guarantee [insert desired outcome]? Try this."

- Describe the problem in more detail
- Discuss the solution  
- Give more detail or examples of the solution
- Call to action

Total script should be a maximum of 120 words with extremely conversational tone and casual word choice.

Video Idea: {VIDEO_IDEA}`;

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
  const prompt = `${SPEED_WRITE_CONFIG.systemPrompt}

Video Idea: ${idea}
Target Length: ${length} seconds

Please generate a script following the Speed Write formula exactly:
1. Hook (8-12 words starting with "If...")
2. Simple actionable advice
3. Why this advice works (starting with "This is...")
4. The benefit (starting with "So you don't...")

Keep it conversational and engaging.`;

  return generateScript(prompt, { temperature: 0.8, maxTokens: 400 });
}

async function generateEducationalScript(idea: string, length: string) {
  const prompt = EDUCATIONAL_PROMPT_TEMPLATE.replace("{VIDEO_IDEA}", idea);
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