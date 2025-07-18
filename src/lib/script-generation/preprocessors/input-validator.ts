/**
 * Input Validator - First step in the processing pipeline
 * Validates and sanitizes all inputs before processing
 */

import { UnifiedScriptInput, ScriptDuration, ScriptType, ScriptTone } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedInput?: UnifiedScriptInput;
}

export class InputValidator {
  private static readonly MIN_IDEA_LENGTH = 10;
  private static readonly MAX_IDEA_LENGTH = 1000;
  private static readonly VALID_DURATIONS: ScriptDuration[] = ["15", "20", "30", "45", "60", "90"];
  private static readonly VALID_TYPES: ScriptType[] = ["speed", "educational", "viral"];
  private static readonly VALID_TONES: ScriptTone[] = ["casual", "professional", "energetic", "educational"];

  /**
   * Validate and sanitize script generation input
   */
  static validate(input: UnifiedScriptInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate idea
    if (!input.idea || typeof input.idea !== "string") {
      errors.push("Idea is required and must be a string");
    } else {
      const trimmedIdea = input.idea.trim();

      if (trimmedIdea.length < this.MIN_IDEA_LENGTH) {
        errors.push(`Idea must be at least ${this.MIN_IDEA_LENGTH} characters long`);
      }

      if (trimmedIdea.length > this.MAX_IDEA_LENGTH) {
        warnings.push(
          `Idea is very long (${trimmedIdea.length} chars). Consider being more concise for better results.`,
        );
      }

      // Check for potential issues
      if (this.containsOnlyEmojis(trimmedIdea)) {
        errors.push("Idea cannot contain only emojis");
      }

      if (this.containsProhibitedContent(trimmedIdea)) {
        errors.push("Idea contains prohibited content");
      }
    }

    // Validate duration
    if (!this.VALID_DURATIONS.includes(input.duration)) {
      errors.push(`Invalid duration. Must be one of: ${this.VALID_DURATIONS.join(", ")}`);
    }

    // Validate type
    if (!this.VALID_TYPES.includes(input.type)) {
      errors.push(`Invalid type. Must be one of: ${this.VALID_TYPES.join(", ")}`);
    }

    // Validate tone
    if (!this.VALID_TONES.includes(input.tone)) {
      errors.push(`Invalid tone. Must be one of: ${this.VALID_TONES.join(", ")}`);
    }

    // Validate context if provided
    if (input.context) {
      if (input.context.notes && typeof input.context.notes !== "string") {
        errors.push("Context notes must be a string");
      }

      if (input.context.notes && input.context.notes.length > 5000) {
        warnings.push("Context notes are very long. This may affect generation quality.");
      }

      const validReferenceModes = ["inspiration", "reference", "template", "comprehensive"];
      if (input.context.referenceMode && !validReferenceModes.includes(input.context.referenceMode)) {
        errors.push(`Invalid reference mode. Must be one of: ${validReferenceModes.join(", ")}`);
      }
    }

    // Check for logical inconsistencies
    if (input.duration === "15" && input.type === "educational") {
      warnings.push("15-second educational content may be too brief. Consider using 30+ seconds.");
    }

    if (input.tone === "professional" && input.type === "viral") {
      warnings.push('Professional tone with viral type may conflict. Consider "energetic" tone for viral content.');
    }

    // Return results
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Sanitize input
    const sanitizedInput: UnifiedScriptInput = {
      idea: input.idea.trim(),
      duration: input.duration,
      type: input.type,
      tone: input.tone,
      context: input.context
        ? {
            notes: input.context.notes?.trim(),
            voiceId: input.context.voiceId,
            referenceMode: input.context.referenceMode,
          }
        : undefined,
    };

    return {
      isValid: true,
      errors: [],
      warnings,
      sanitizedInput,
    };
  }

  /**
   * Check if string contains only emojis
   */
  private static containsOnlyEmojis(str: string): boolean {
    const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+$/u;
    return emojiRegex.test(str);
  }

  /**
   * Check for prohibited content
   */
  private static containsProhibitedContent(str: string): boolean {
    const prohibited = [
      // Add any prohibited terms or patterns here
      // This is a placeholder - implement based on your content policy
    ];

    const lowerStr = str.toLowerCase();
    return prohibited.some((term) => lowerStr.includes(term));
  }
}
