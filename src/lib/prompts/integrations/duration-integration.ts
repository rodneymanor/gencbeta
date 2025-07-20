/**
 * Integration utilities for duration-optimized script generation
 * Provides seamless integration between duration customization and existing prompt system
 */

import { ScriptGenerationInput } from "../../services/script-generation-service";
import {
  createDurationSubPrompt,
  calculateTargetWordsForDuration,
  getDurationCharacteristics,
  isSupportedDuration,
  DURATION_CONFIGS,
} from "../modifiers/duration-optimizer";
import { createSpeedWriteVariables, SpeedWriteVariables } from "../script-generation/speed-write";

/**
 * Enhanced script generation input with duration optimization
 */
export interface DurationOptimizedScriptInput extends Omit<ScriptGenerationInput, "length"> {
  length: "15" | "20" | "30" | "45" | "60" | "90";
  enableDurationOptimization?: boolean;
}

/**
 * Create duration-optimized variables for script generation
 */
export function createDurationOptimizedVariables(
  input: DurationOptimizedScriptInput,
  options?: {
    negativeKeywordInstruction?: string;
  },
): SpeedWriteVariables {
  if (!isSupportedDuration(input.length)) {
    throw new Error(
      `Unsupported duration: ${input.length}. Supported durations: ${Object.keys(DURATION_CONFIGS).join(", ")}`,
    );
  }

  return createSpeedWriteVariables(input.idea, input.length, {
    negativeKeywordInstruction: options?.negativeKeywordInstruction,
    tone: input.tone,
    platform: input.platform,
    includeDurationOptimization: input.enableDurationOptimization !== false,
    scriptType: input.type, // Pass script type for hook guidelines
  });
}

/**
 * Get detailed duration information for UI display
 */
export function getDurationInfo(duration: string) {
  const config = DURATION_CONFIGS[duration];
  if (!config) {
    return null;
  }

  return {
    duration: config.duration,
    targetWords: config.targetWords,
    characteristics: config.characteristics,
    pacing: config.pacing,
    focus: config.focus,
    description: getDurationDescription(config.pacing),
  };
}

/**
 * Get human-readable description for pacing type
 */
function getDurationDescription(pacing: string): string {
  switch (pacing) {
    case "ultra-fast":
      return "Ultra-short, punchy content";
    case "fast":
      return "Quick and focused";
    case "balanced":
      return "Balanced format";
    case "detailed":
      return "Detailed explanation";
    case "comprehensive":
      return "Comprehensive content";
    case "deep":
      return "Deep dive format";
    default:
      return "Custom duration";
  }
}

/**
 * Validate script generation input with duration optimization
 */
export function validateDurationOptimizedInput(input: DurationOptimizedScriptInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic validation
  if (!input.idea || input.idea.trim().length === 0) {
    errors.push("Idea is required");
  }

  if (input.idea && input.idea.length > 1000) {
    errors.push("Idea must be less than 1000 characters");
  }

  // Duration validation
  if (!input.length) {
    errors.push("Duration is required");
  } else if (!isSupportedDuration(input.length)) {
    errors.push(`Unsupported duration: ${input.length}. Supported: ${Object.keys(DURATION_CONFIGS).join(", ")}`);
  }

  // Type validation
  if (input.type && !["speed", "educational", "viral"].includes(input.type)) {
    errors.push("Type must be speed, educational, or viral");
  }

  // Tone validation
  if (input.tone && !["casual", "professional", "energetic", "educational"].includes(input.tone)) {
    errors.push("Invalid tone specified");
  }

  // Platform validation
  if (input.platform && !["tiktok", "instagram", "youtube", "general"].includes(input.platform)) {
    errors.push("Invalid platform specified");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get optimal word count range for a duration (with tolerance)
 */
export function getWordCountRange(duration: string): { min: number; max: number; target: number } {
  const target = calculateTargetWordsForDuration(duration);
  const tolerance = Math.max(3, Math.round(target * 0.1)); // 10% tolerance, minimum 3 words

  return {
    min: target - tolerance,
    max: target + tolerance,
    target,
  };
}

/**
 * Check if a script meets the word count requirements for its duration
 */
export function validateWordCount(
  script: string,
  duration: string,
): {
  valid: boolean;
  actualWords: number;
  range: { min: number; max: number; target: number };
  message?: string;
} {
  const actualWords = script
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const range = getWordCountRange(duration);
  const valid = actualWords >= range.min && actualWords <= range.max;

  let message: string | undefined;
  if (!valid) {
    if (actualWords < range.min) {
      message = `Script is too short. Add ${range.min - actualWords} more words.`;
    } else {
      message = `Script is too long. Remove ${actualWords - range.max} words.`;
    }
  }

  return {
    valid,
    actualWords,
    range,
    message,
  };
}

/**
 * Estimate reading time for a script
 */
export function estimateReadingTime(script: string): {
  seconds: number;
  formatted: string;
} {
  const words = script
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const seconds = Math.round(words / 2.2); // 2.2 words per second

  const formatted = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  return { seconds, formatted };
}

/**
 * Get all available duration options with metadata
 */
export function getAvailableDurations() {
  return Object.values(DURATION_CONFIGS).map((config) => ({
    value: config.duration,
    label: `${config.duration} seconds`,
    description: getDurationDescription(config.pacing),
    targetWords: config.targetWords,
    characteristics: config.characteristics,
  }));
}

/**
 * Compose dynamic prompt with duration optimization
 */
export async function composeDurationOptimizedPrompt(
  input: DurationOptimizedScriptInput,
  options?: {
    negativeKeywordInstruction?: string;
    customInstructions?: string;
  },
): Promise<{
  variables: SpeedWriteVariables;
  promptId: string;
  metadata: {
    durationInfo: ReturnType<typeof getDurationInfo>;
    wordCountRange: ReturnType<typeof getWordCountRange>;
  };
}> {
  // Validate input
  const validation = validateDurationOptimizedInput(input);
  if (!validation.valid) {
    throw new Error(`Invalid input: ${validation.errors.join(", ")}`);
  }

  // Create optimized variables
  const variables = createDurationOptimizedVariables(input, {
    negativeKeywordInstruction: options?.negativeKeywordInstruction,
  });

  // Determine prompt ID based on type
  const variant = input.type === "educational" ? "educational" : input.type === "viral" ? "viral" : "standard";
  const promptId = variant === "standard" ? "speed-write-v2" : `speed-write-${variant}`;

  // Get metadata
  const durationInfo = getDurationInfo(input.length);
  const wordCountRange = getWordCountRange(input.length);

  return {
    variables,
    promptId,
    metadata: {
      durationInfo,
      wordCountRange,
    },
  };
}
