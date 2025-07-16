/**
 * Duration-specific prompt modifier for script generation
 * Intelligently adjusts prompts based on target duration while maintaining quality
 */

import { SpeedWriteVariables } from "../script-generation/speed-write";

export interface DurationConfig {
  duration: string;
  targetWords: number;
  characteristics: string[];
  pacing: "ultra-fast" | "fast" | "balanced" | "detailed" | "comprehensive" | "deep";
  focus: "single-point" | "focused" | "balanced" | "multi-point" | "comprehensive" | "thorough";
}

// Duration configurations mapping
export const DURATION_CONFIGS: Record<string, DurationConfig> = {
  "15": {
    duration: "15",
    targetWords: 33,
    characteristics: ["Single core point", "Immediate impact", "Perfect for trending topics"],
    pacing: "ultra-fast",
    focus: "single-point",
  },
  "20": {
    duration: "20",
    targetWords: 44,
    characteristics: ["Concise messaging", "Clear hook and CTA", "High retention rate"],
    pacing: "fast",
    focus: "focused",
  },
  "30": {
    duration: "30",
    targetWords: 66,
    characteristics: ["Complete structure", "Room for example", "Optimal engagement"],
    pacing: "balanced",
    focus: "balanced",
  },
  "45": {
    duration: "45",
    targetWords: 99,
    characteristics: ["Multiple points", "Context building", "Educational value"],
    pacing: "detailed",
    focus: "multi-point",
  },
  "60": {
    duration: "60",
    targetWords: 132,
    characteristics: ["Full development", "Multiple examples", "Authority building"],
    pacing: "comprehensive",
    focus: "comprehensive",
  },
  "90": {
    duration: "90",
    targetWords: 198,
    characteristics: ["Thorough coverage", "Complex topics", "Maximum value"],
    pacing: "deep",
    focus: "thorough",
  },
};

/**
 * Generate duration-specific sub-prompt that modifies the main prompt
 */
export function createDurationSubPrompt(duration: string): string {
  const config = DURATION_CONFIGS[duration];
  if (!config) {
    throw new Error(`Unsupported duration: ${duration}`);
  }

  return `
DURATION OPTIMIZATION FOR ${config.duration} SECONDS:

TARGET: Exactly ${config.targetWords} words (±5 words acceptable)
PACING: ${config.pacing.toUpperCase()}
FOCUS: ${config.focus.toUpperCase()}

${getDurationSpecificGuidelines(config)}

${getStructureGuidelines(config)}

${getContentGuidelines(config)}

FINAL CHECK: Ensure the script reads naturally in exactly ${config.duration} seconds when spoken at normal pace (2.2 words per second average).
`.trim();
}

/**
 * Get duration-specific content guidelines
 */
function getDurationSpecificGuidelines(config: DurationConfig): string {
  switch (config.pacing) {
    case "ultra-fast":
      return `ULTRA-FAST GUIDELINES:
- ONE core message only - no secondary points
- Hook must grab attention in first 2 words
- Skip bridge - go straight from hook to value
- Golden nugget must be immediately actionable
- CTA should be single word/phrase
- Every word must earn its place`;

    case "fast":
      return `FAST GUIDELINES:
- Focus on ONE main point with immediate payoff
- Hook should be 3-5 words maximum
- Bridge is 1 short sentence connecting to value
- Golden nugget is specific and concrete
- CTA is clear and simple
- No fluff or filler words`;

    case "balanced":
      return `BALANCED GUIDELINES:
- Develop ONE core concept with brief supporting detail
- Hook can include a short setup or question
- Bridge provides necessary context in 1-2 sentences
- Golden nugget includes one concrete example
- CTA can include brief reasoning
- Standard Speed Write structure works well`;

    case "detailed":
      return `DETAILED GUIDELINES:
- Explore ONE topic with supporting details
- Hook can tell a micro-story or present data
- Bridge builds context and relevance
- Golden nugget includes examples and explanation
- CTA can include multiple related actions
- Allow for brief elaboration on key points`;

    case "comprehensive":
      return `COMPREHENSIVE GUIDELINES:
- Cover main topic with multiple supporting points
- Hook can establish broader context or story
- Bridge connects multiple aspects of the topic
- Golden nugget provides detailed explanation with examples
- CTA can offer multiple related next steps
- Include transitions between major points`;

    case "deep":
      return `DEEP DIVE GUIDELINES:
- Thoroughly explore topic with multiple angles
- Hook can use extended narrative or complex setup
- Bridge connects multiple concepts and provides context
- Golden nugget includes detailed explanation, examples, and nuance
- CTA can offer comprehensive action plan
- Allow for detailed explanations and multiple examples`;

    default:
      return "";
  }
}

/**
 * Get structure guidelines based on duration
 */
function getStructureGuidelines(config: DurationConfig): string {
  switch (config.focus) {
    case "single-point":
      return `STRUCTURE: Streamlined
- Hook: 25% (8 words) - Immediate attention grab
- Value: 65% (21 words) - Core insight/action
- CTA: 10% (4 words) - Simple next step`;

    case "focused":
      return `STRUCTURE: Tight
- Hook: 25% (11 words) - Strong opener
- Bridge: 15% (7 words) - Brief transition  
- Golden Nugget: 50% (22 words) - Core value
- CTA: 10% (4 words) - Clear action`;

    case "balanced":
      return `STRUCTURE: Standard Speed Write
- Hook: 25% (16 words) - Engaging opener
- Bridge: 20% (13 words) - Context setting
- Golden Nugget: 45% (30 words) - Main value
- CTA: 10% (7 words) - Clear next step`;

    case "multi-point":
      return `STRUCTURE: Expanded
- Hook: 20% (20 words) - Story or context
- Bridge: 20% (20 words) - Problem/setup
- Golden Nugget: 50% (50 words) - Multi-part value
- CTA: 10% (9 words) - Specific actions`;

    case "comprehensive":
      return `STRUCTURE: Full Development
- Hook: 20% (26 words) - Extended engagement
- Bridge: 25% (33 words) - Full context
- Golden Nugget: 45% (59 words) - Comprehensive value
- CTA: 10% (14 words) - Multiple options`;

    case "thorough":
      return `STRUCTURE: Deep Exploration
- Hook: 20% (40 words) - Narrative setup
- Bridge: 25% (50 words) - Complete context
- Golden Nugget: 45% (89 words) - Detailed teaching
- CTA: 10% (19 words) - Comprehensive action`;

    default:
      return "";
  }
}

/**
 * Get content-specific guidelines
 */
function getContentGuidelines(config: DurationConfig): string {
  return `
CONTENT REQUIREMENTS:
- Characteristics: ${config.characteristics.join(", ")}
- Word density: Aim for exactly ${(config.targetWords / parseInt(config.duration)).toFixed(1)} words per second
- Breathing room: Include natural pauses for ${config.pacing} pacing
- Value density: Each sentence must provide clear value
- Retention: Structure for ${config.pacing} attention span
`;
}

/**
 * Calculate precise target words for any duration
 */
export function calculateTargetWordsForDuration(duration: string): number {
  const config = DURATION_CONFIGS[duration];
  if (config) {
    return config.targetWords;
  }

  // Fallback calculation for custom durations
  const seconds = parseInt(duration);
  return Math.round(seconds * 2.2); // 2.2 words per second average
}

/**
 * Get duration characteristics for UI display
 */
export function getDurationCharacteristics(duration: string): string[] {
  const config = DURATION_CONFIGS[duration];
  return config?.characteristics || [];
}

/**
 * Enhanced variable creation that includes duration optimization
 */
export function createDurationOptimizedVariables(
  idea: string,
  length: string,
  options?: {
    negativeKeywordInstruction?: string;
    tone?: SpeedWriteVariables["tone"];
    platform?: SpeedWriteVariables["platform"];
  },
): SpeedWriteVariables & { durationSubPrompt: string } {
  const targetWords = calculateTargetWordsForDuration(length);
  const durationSubPrompt = createDurationSubPrompt(length);

  return {
    idea,
    length: length as "20" | "60" | "90", // Type assertion for compatibility
    targetWords,
    durationSubPrompt,
    negativeKeywordInstruction: options?.negativeKeywordInstruction,
    tone: options?.tone,
    platform: options?.platform,
  };
}

/**
 * Validates if a duration is supported
 */
export function isSupportedDuration(duration: string): boolean {
  return duration in DURATION_CONFIGS;
}

/**
 * Get all supported durations
 */
export function getSupportedDurations(): DurationConfig[] {
  return Object.values(DURATION_CONFIGS);
}
