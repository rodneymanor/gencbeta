/**
 * Speed Write prompt module for social media script generation
 * Uses the proven Speed Write formula: Hook → Bridge → Golden Nugget → WTA
 */

import { Prompt } from "../types";

import { formatHookExamplesForPrompt } from "./hook-examples";

// Speed Write specific interfaces
export interface SpeedWriteVariables {
  idea: string;
  length: "15" | "20" | "30" | "45" | "60" | "90";
  targetWords: number;
  durationSubPrompt?: string;
  negativeKeywordInstruction?: string;
  tone?: "casual" | "professional" | "energetic" | "educational";
  platform?: "tiktok" | "instagram" | "youtube" | "general";
  ideaContext?: string;
  hasIdeaContext?: boolean;
  ideaContextMode?: string;
  selectedNotesCount?: number;
  hookGuidelines?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface SpeedWriteResult {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

/**
 * Generate dynamic hook guidelines based on script type
 */
function generateHookGuidelines(scriptType?: "speed" | "educational" | "viral", tone?: string): string {
  // Simple, direct hook patterns without money/income examples
  const hookPatterns = {
    speed: [
      "Most people don't realize {surprising fact about topic}",
      "Here's the {number}-second trick that {outcome}",
      "Stop {common mistake} - do this instead",
      "The secret {professionals/experts} use for {topic}",
      "Why {common belief} is completely wrong",
    ],
    educational: [
      "The science behind {topic} will blow your mind",
      "Here's what actually happens when you {action}",
      "{Number} things about {topic} nobody teaches you",
      "Let me show you how {process} really works",
      "The truth about {topic} that textbooks won't tell you",
    ],
    viral: [
      "Wait until you see what happens when {scenario}",
      "I tried {method} for {timeframe} and {unexpected result}",
      "This {simple thing} changed everything about {topic}",
      "Nobody talks about this {topic} hack",
      "{Authority figure} doesn't want you to know this about {topic}",
    ],
  };

  const selectedType = scriptType || "speed";
  const patterns = hookPatterns[selectedType] || hookPatterns.speed;

  // Randomly select 3 patterns to show
  const shuffled = [...patterns].sort(() => Math.random() - 0.5);
  const selectedPatterns = shuffled.slice(0, 3);

  return `
HOOK RULES:
1. NEVER use generic hooks about "making money" or "unlimited income"
2. BANNED PATTERNS: "Want a [...]?", "Want to [...]?", "Do you want [...]?", "Would you like [...]?"
3. Make it specific to the EXACT topic given
4. Create pattern interrupts that stop scrolling
5. Keep it under 3 seconds (15-20 words max)

HOOK PATTERNS TO ADAPT:
${selectedPatterns.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Remember: Take these patterns and make them SPECIFIC to the given topic. Use diverse question structures, statements, or contrarian approaches - never repetitive "Want" patterns.`;
}

// Sub-prompts for composition
export const SPEED_WRITE_SUB_PROMPTS = {
  hookGuidelines: generateHookGuidelines(), // Default with all types

  bridgeGuidelines: `
BRIDGE GUIDELINES:
- Smoothly transition from hook to main content
- Maintain engagement while setting up the value
- Acknowledge the problem or build context
- Keep it brief but meaningful

BRIDGE EXAMPLES BY CONTEXT:
Problem Setup:
- "Here's why this matters more than you think..."
- "The reason this works is actually surprising..."
- "Let me explain what's really happening..."
- "Most people miss this crucial detail..."

Buildup/Anticipation:
- "What I'm about to show you changed everything..."
- "The solution is simpler than you'd expect..."
- "Here's the part nobody talks about..."
- "This discovery will save you hours..."

Contradiction/Myth-Busting:
- "But here's what the experts won't tell you..."
- "The truth is completely different..."
- "Everything you've been taught is wrong..."
- "There's a better way that actually works..."

Transition/Context:
- "To understand this, you need to know..."
- "The key insight came from..."
- "Here's what makes all the difference..."
- "The secret lies in understanding..."

Choose bridges that maintain momentum and create anticipation for your golden nugget.`,

  goldenNuggetGuidelines: `
GOLDEN NUGGET GUIDELINES:
- Deliver the core value, insight, or teaching point
- Be specific and actionable
- Provide clear, memorable takeaways
- Make it worth the viewer's time
- Include concrete examples or steps when possible`,

  wtaGuidelines: `
WHAT TO ACT (WTA) GUIDELINES:
- End with a clear, specific call to action
- Tell viewers exactly what to do next
- Make it feel natural, not pushy
- Align with the content's value proposition

WTA EXAMPLES BY APPROACH:
Engagement-Focused:
- "Try this and let me know how it goes!"
- "What's your experience with this? Comment below!"
- "Share this with someone who needs it!"
- "Drop a 🔥 if this helped you!"

Action-Oriented:
- "Implement this strategy and track your progress."
- "Give this a shot and share your results!"
- "Test this out and tell me what happens!"
- "Apply these principles and measure the results."

Follow/Subscribe:
- "Follow for more quick tips like this!"
- "Follow for evidence-based strategies."
- "Follow if this blew your mind!"
- "Follow for daily content tips!"

Value-Driven:
- "Save this for later - you'll thank me!"
- "Save this for future reference."
- "Which part surprised you the most?"
- "Connect for more proven methods."

Choose CTAs that feel natural and encourage the specific action you want viewers to take.`,

  lengthGuidelines: `
LENGTH OPTIMIZATION:
- 20 seconds: ~44 words - Ultra-concise, punch impact, single core point
- 60 seconds: ~132 words - Balanced depth, clear structure, room for examples
- 90 seconds: ~198 words - Detailed explanation, multiple points, comprehensive coverage`,

  platformOptimization: `
PLATFORM OPTIMIZATION:
- TikTok: Fast-paced, trend-aware, younger audience, visual storytelling
- Instagram: Aesthetic-focused, lifestyle integration, hashtag-friendly
- YouTube: Educational depth, retention-focused, searchable content
- General: Universal appeal, platform-agnostic messaging`,
};

// Main Speed Write prompt definition
export const speedWritePrompt: Prompt = {
  id: "speed-write-v2",
  name: "Speed Write Script Generator",
  description: "Generate engaging social media scripts using the proven Speed Write formula with 4-part structure",
  version: "2.0.0",
  tags: ["script", "social-media", "content-creation", "speed-write"],
  author: "Content Creation Team",
  template: `Create a compelling video script about "{{idea}}". 

CRITICAL: The hook MUST be about "{{idea}}" specifically. Do NOT use generic hooks about money, income, or success.

TARGET: {{length}} seconds (~{{targetWords}} words)
{{#if tone}}TONE: {{tone}}{{/if}}
{{#if platform}}PLATFORM: {{platform}}{{/if}}
{{#if negativeKeywordInstruction}}{{negativeKeywordInstruction}}{{/if}}

{{#if hasIdeaContext}}{{ideaContext}}{{/if}}

{{#if durationSubPrompt}}{{durationSubPrompt}}{{/if}}

{{#if hookGuidelines}}{{hookGuidelines}}{{else}}${SPEED_WRITE_SUB_PROMPTS.hookGuidelines}{{/if}}

${SPEED_WRITE_SUB_PROMPTS.bridgeGuidelines}

${SPEED_WRITE_SUB_PROMPTS.goldenNuggetGuidelines}

${SPEED_WRITE_SUB_PROMPTS.wtaGuidelines}

${SPEED_WRITE_SUB_PROMPTS.lengthGuidelines}

{{#if platform}}${SPEED_WRITE_SUB_PROMPTS.platformOptimization}{{/if}}

WRITING REQUIREMENTS:
- Write in a conversational, natural speaking style
- Use short, punchy sentences that flow when spoken aloud
- Avoid jargon or overly complex language
- Make each section transition smoothly to the next
- Ensure the content feels authentic and valuable
- Stay within the target word count (±10%)

OUTPUT FORMAT:
You MUST return a JSON object with exactly these 4 fields:
{
  "hook": "Your attention-grabbing opening line",
  "bridge": "Your transition that connects hook to main content",
  "goldenNugget": "Your main value/insight/teaching point",
  "wta": "Your clear call to action"
}

ALL FOUR FIELDS ARE REQUIRED. Never leave any field empty.`,

  config: {
    systemInstruction: `You are an expert social media script writer that ALWAYS returns valid JSON.

CRITICAL RULES:
1. ALWAYS return a JSON object with hook, bridge, goldenNugget, and wta fields
2. NEVER leave any field empty or null
3. Make hooks specific to the exact topic given
4. BANNED HOOK PATTERNS: "Want a [...]?", "Want to [...]?", "Do you want [...]?", "Would you like [...]?"
5. Use diverse hook structures - statements, contrarian approaches, curiosity gaps, specific questions
6. Each script must have all 4 components filled with relevant content

You must output valid JSON. No other format is acceptable.`,

    temperature: 0.8,
    maxTokens: 1000,
    responseType: "json",

    jsonSchema: {
      type: "object",
      properties: {
        hook: {
          type: "string",
          description: "Attention-grabbing opener that hooks the viewer immediately",
        },
        bridge: {
          type: "string",
          description: "Transition that connects the hook to the main content",
        },
        goldenNugget: {
          type: "string",
          description: "Core value, insight, or main teaching point",
        },
        wta: {
          type: "string",
          description: "Clear call to action that tells viewers what to do next",
        },
      },
      required: ["hook", "bridge", "goldenNugget", "wta"],
      additionalProperties: false,
    },

    validation: {
      required: ["idea", "length", "targetWords"],
      optional: ["negativeKeywordInstruction", "tone", "platform"],
      minLength: {
        idea: 10,
      },
      maxLength: {
        idea: 1000,
        negativeKeywordInstruction: 500,
      },
      pattern: {
        length: /^(15|20|30|45|60|90)$/,
      },
    },

    examples: [
      {
        input: {
          idea: "How to remember everything you read",
          length: "30",
          targetWords: 66,
          tone: "educational",
        },
        output: JSON.stringify({
          hook: "Here's why you forget 90% of what you read.",
          bridge: "Your brain isn't designed to store information - it's designed to use it.",
          goldenNugget:
            "After reading, immediately teach the concept to an imaginary student. This forces active recall and locks it in memory.",
          wta: "Try this with the next article you read!",
        }),
      },
      {
        input: {
          idea: "Why most people fail at productivity",
          length: "30",
          targetWords: 66,
          tone: "professional",
        },
        output: JSON.stringify({
          hook: "The biggest productivity mistake? Trying to do everything.",
          bridge: "Successful people don't do more - they do less, better.",
          goldenNugget: "Pick your top 3 priorities daily. Everything else can wait.",
          wta: "Start tomorrow with just 3 priorities. Trust the process.",
        }),
      },
    ],
  },
};

// Variant prompts for different use cases
export const speedWriteEducationalPrompt: Prompt = {
  ...speedWritePrompt,
  id: "speed-write-educational",
  name: "Speed Write Educational Script",
  description: "Educational variant of Speed Write optimized for teaching and learning content",
  config: {
    ...speedWritePrompt.config,
    systemInstruction: `You are an educational content creator that ALWAYS returns valid JSON.

CRITICAL RULES:
1. ALWAYS return a JSON object with hook, bridge, goldenNugget, and wta fields
2. NEVER leave any field empty or null
3. Make complex topics simple and engaging
4. Focus on clear, educational value in every component

You must output valid JSON with all 4 fields. No other format is acceptable.`,
    temperature: 0.7, // Slightly lower for more focused educational content
  },
};

export const speedWriteViralPrompt: Prompt = {
  ...speedWritePrompt,
  id: "speed-write-viral",
  name: "Speed Write Viral Script",
  description: "Viral-optimized variant with higher engagement focus",
  config: {
    ...speedWritePrompt.config,
    systemInstruction: `You are a viral content strategist that ALWAYS returns valid JSON.

CRITICAL RULES:
1. ALWAYS return a JSON object with hook, bridge, goldenNugget, and wta fields
2. NEVER leave any field empty or null
3. Make hooks SPECIFIC to the exact topic - no generic openings
4. BANNED HOOK PATTERNS: "Want a [...]?", "Want to [...]?", "Do you want [...]?", "Would you like [...]?"
5. Create pattern interrupts that are unique to THIS topic
6. BANNED WORDS: "unlimited", "money", "income" (unless the topic is specifically about these)

You must output valid JSON with all 4 fields. No other format is acceptable.`,
    temperature: 0.9, // Higher creativity for viral content
  },
};

// Helper function to calculate target words
export function calculateTargetWords(length: string): number {
  const lengthNumber = parseInt(length);
  return Math.round(lengthNumber * 2.2); // ~2.2 words per second speaking rate
}

/**
 * Generate type-specific hook guidelines for prompts
 */
export function generateTypeSpecificHookGuidelines(
  scriptType: "speed" | "educational" | "viral",
  tone?: string,
): string {
  return generateHookGuidelines(scriptType, tone);
}

// Helper function to create Speed Write variables with duration optimization
export function createSpeedWriteVariables(
  idea: string,
  length: "15" | "20" | "30" | "45" | "60" | "90",
  options?: {
    negativeKeywordInstruction?: string;
    tone?: SpeedWriteVariables["tone"];
    platform?: SpeedWriteVariables["platform"];
    includeDurationOptimization?: boolean;
    scriptType?: "speed" | "educational" | "viral";
  },
): SpeedWriteVariables {
  const shouldOptimize = options?.includeDurationOptimization !== false; // Default to true
  let durationSubPrompt: string | undefined;

  if (shouldOptimize) {
    try {
      // Import duration optimizer dynamically to avoid circular dependencies
      const { createDurationSubPrompt } = require("../modifiers/duration-optimizer");
      durationSubPrompt = createDurationSubPrompt(length);
    } catch (error) {
      console.warn("Failed to load duration optimizer, falling back to standard prompt:", error);
    }
  }

  return {
    idea,
    length,
    targetWords: calculateTargetWords(length),
    durationSubPrompt,
    negativeKeywordInstruction: options?.negativeKeywordInstruction,
    tone: options?.tone,
    platform: options?.platform,
    // Add dynamic hook guidelines based on script type (default to script type or 'speed')
    hookGuidelines: generateTypeSpecificHookGuidelines(options?.scriptType ?? "speed", options?.tone),
  };
}

// Export all speed write prompts
export const SPEED_WRITE_PROMPTS = {
  standard: speedWritePrompt,
  educational: speedWriteEducationalPrompt,
  viral: speedWriteViralPrompt,
} as const;
