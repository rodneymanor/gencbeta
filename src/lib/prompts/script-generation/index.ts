/**
 * Script generation prompt library
 * Exports all script generation prompts for easy access
 */

import { PromptLibrary } from "../types";

import {
  SPEED_WRITE_PROMPTS,
  speedWritePrompt,
  speedWriteEducationalPrompt,
  speedWriteViralPrompt,
  SpeedWriteVariables,
  SpeedWriteResult,
  createSpeedWriteVariables,
  calculateTargetWords,
} from "./speed-write";

// Aggregate all script generation prompts
export const SCRIPT_GENERATION_LIBRARY: PromptLibrary = {
  "speed-write": {
    standard: SPEED_WRITE_PROMPTS.standard,
    educational: SPEED_WRITE_PROMPTS.educational,
    viral: SPEED_WRITE_PROMPTS.viral,
  },
};

// Re-export Speed Write components for easy access
export {
  // Prompts
  speedWritePrompt,
  speedWriteEducationalPrompt,
  speedWriteViralPrompt,
  SPEED_WRITE_PROMPTS,

  // Types
  type SpeedWriteVariables,
  type SpeedWriteResult,

  // Utilities
  createSpeedWriteVariables,
  calculateTargetWords,
};

// Convenience functions for script generation
export async function generateSpeedWriteScript(
  idea: string,
  length: "20" | "60" | "90",
  options?: {
    variant?: keyof typeof SPEED_WRITE_PROMPTS;
    negativeKeywordInstruction?: string;
    tone?: SpeedWriteVariables["tone"];
    platform?: SpeedWriteVariables["platform"];
  },
): Promise<any> {
  const { executePrompt } = await import("../prompt-manager");

  const promptId = options?.variant ? `speed-write-${options.variant}` : "speed-write-v2";

  const variables = createSpeedWriteVariables(idea, length, {
    negativeKeywordInstruction: options?.negativeKeywordInstruction,
    tone: options?.tone,
    platform: options?.platform,
  });

  return executePrompt<SpeedWriteResult>(promptId, { variables });
}

// Export the library for registration
export default SCRIPT_GENERATION_LIBRARY;
