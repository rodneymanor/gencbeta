/**
 * Speed Write prompt module for social media script generation
 * Uses the proven Speed Write formula: Hook → Bridge → Golden Nugget → WTA
 */

import { Prompt } from "../types";

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
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface SpeedWriteResult {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

// Sub-prompts for composition
export const SPEED_WRITE_SUB_PROMPTS = {
  hookGuidelines: `
HOOK GUIDELINES:
- Start with a strong attention-grabber that makes viewers stop scrolling
- Use pattern interrupts, questions, bold statements, or intriguing scenarios
- Keep it under 3 seconds of speaking time
- Create curiosity or urgency
- Examples: "If I had to pick one thing...", "Most people get this wrong...", "Here's what nobody tells you..."`,

  bridgeGuidelines: `
BRIDGE GUIDELINES:
- Smoothly transition from hook to main content
- Maintain engagement while setting up the value
- Acknowledge the problem or build context
- Keep it brief but meaningful
- Examples: "Here's why this matters...", "The reason this works is...", "Let me explain..."`,

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
- Examples: "Try this technique...", "Share your results...", "Follow for more tips..."`,

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
  template: `Create a compelling video script using the Speed Write formula. Follow the exact structure and guidelines below.

TARGET: {{length}} seconds (~{{targetWords}} words)
TOPIC: {{idea}}
{{#if tone}}TONE: {{tone}}{{/if}}
{{#if platform}}PLATFORM: {{platform}}{{/if}}
{{#if negativeKeywordInstruction}}{{negativeKeywordInstruction}}{{/if}}

{{#if hasIdeaContext}}{{ideaContext}}{{/if}}

{{#if durationSubPrompt}}{{durationSubPrompt}}{{/if}}

${SPEED_WRITE_SUB_PROMPTS.hookGuidelines}

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

Create a script that sounds natural when read aloud and provides genuine value to the viewer.`,

  config: {
    systemInstruction: `You are an expert social media script writer specializing in the Speed Write formula. Your scripts consistently go viral because they:
1. Hook viewers immediately with pattern interrupts
2. Bridge smoothly to valuable content  
3. Deliver genuine golden nuggets of insight
4. End with natural, compelling calls to action

You understand pacing, retention, and what makes content shareable. Write scripts that sound conversational and authentic when spoken aloud.`,

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
          idea: "How to wake up early without feeling tired",
          length: "60",
          targetWords: 132,
          tone: "energetic",
          platform: "tiktok",
        },
        output: JSON.stringify({
          hook: "If you're hitting snooze 5 times every morning, you're doing it all wrong.",
          bridge:
            "Here's the one trick that changed my entire morning routine and it has nothing to do with going to bed earlier.",
          goldenNugget:
            "Set your alarm for when you naturally complete a sleep cycle. Most people wake up mid-cycle feeling groggy. Use a sleep calculator to find your optimal wake time based on 90-minute cycles.",
          wta: "Try this tonight - calculate your sleep cycles and set just ONE alarm. Comment 'CYCLE' if this helps you wake up refreshed tomorrow!",
        }),
      },
      {
        input: {
          idea: "Why most people fail at productivity",
          length: "20",
          targetWords: 44,
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
    systemInstruction: `You are an educational content creator who makes complex topics simple and engaging. Your Speed Write scripts focus on:
1. Clear, educational hooks that promise learning value
2. Bridges that build context and prepare for learning
3. Golden nuggets that teach actionable insights with examples
4. CTAs that encourage practice and further learning

Make educational content that doesn't feel like school - keep it engaging and practical.`,
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
    systemInstruction: `You are a viral content strategist who understands what makes content shareable. Your Speed Write scripts are designed for maximum engagement:
1. Hooks that create immediate emotional response or curiosity
2. Bridges that maintain momentum and build anticipation  
3. Golden nuggets that provide surprising or counterintuitive insights
4. CTAs that encourage sharing, commenting, and engagement

Write content that people can't help but share with their friends.`,
    temperature: 0.9, // Higher creativity for viral content
  },
};

// Helper function to calculate target words
export function calculateTargetWords(length: "20" | "60" | "90"): number {
  const lengthNumber = parseInt(length);
  return Math.round(lengthNumber * 2.2); // ~2.2 words per second speaking rate
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
  };
}

// Export all speed write prompts
export const SPEED_WRITE_PROMPTS = {
  standard: speedWritePrompt,
  educational: speedWriteEducationalPrompt,
  viral: speedWriteViralPrompt,
} as const;
