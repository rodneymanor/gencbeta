/**
 * Script Validator Service
 * Centralized script validation and quality assurance
 */

export interface PlaceholderDetectionResult {
  hasPlaceholders: boolean;
  placeholders: string[];
  cleanedContent?: string;
}

export interface ScriptValidationResult {
  isValid: boolean;
  issues: string[];
  content: string;
  score: number;
  suggestions: string[];
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: "error" | "warning" | "info";
  test: (content: string) => boolean;
  message: string;
}

export interface RegenerationConfig {
  maxRetries: number;
  retryDelay: number;
  validationRules: ValidationRule[];
}

export const DEFAULT_REGENERATION_CONFIG: RegenerationConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  validationRules: getDefaultValidationRules(),
};

/**
 * Comprehensive script validation with scoring
 * @param content - Script content to validate
 * @param rules - Validation rules to apply
 * @returns Validation result with score and suggestions
 */
export function validateScript(
  content: string,
  rules: ValidationRule[] = getDefaultValidationRules(),
): ScriptValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  rules.forEach((rule) => {
    if (rule.test(content)) {
      issues.push(rule.message);

      // Deduct points based on severity
      switch (rule.severity) {
        case "error":
          score -= 20;
          break;
        case "warning":
          score -= 10;
          break;
        case "info":
          score -= 5;
          break;
      }

      // Add suggestions for common issues
      if (rule.id === "placeholders") {
        suggestions.push("Remove or replace all placeholder text in square brackets");
      } else if (rule.id === "structural_labels") {
        suggestions.push('Remove structural labels like "hook:", "bridge:", etc.');
      } else if (rule.id === "too_short") {
        suggestions.push("Add more content to reach minimum word count");
      } else if (rule.id === "too_long") {
        suggestions.push("Consider shortening the content for better engagement");
      }
    }
  });

  // Add positive suggestions for good content
  if (score >= 80) {
    suggestions.push("Content quality is good - ready for use");
  } else if (score >= 60) {
    suggestions.push("Content needs minor improvements before use");
  } else {
    suggestions.push("Content needs significant revision before use");
  }

  return {
    isValid: issues.length === 0,
    issues,
    content,
    score: Math.max(0, score),
    suggestions,
  };
}

/**
 * Detect unfilled placeholders in square brackets [like this]
 * @param content - Content to check for placeholders
 * @returns Placeholder detection result
 */
export function detectPlaceholders(content: string): PlaceholderDetectionResult {
  // Match square brackets with content inside
  const placeholderRegex = /\[([^\]]+)\]/g;
  const matches = [...content.matchAll(placeholderRegex)];

  const placeholders = matches.map((match) => match[0]); // Full match including brackets

  return {
    hasPlaceholders: placeholders.length > 0,
    placeholders,
    cleanedContent: content.replace(placeholderRegex, "").trim(),
  };
}

/**
 * Clean script content by removing common artifacts
 * @param content - Content to clean
 * @returns Cleaned content
 */
export function cleanScriptContent(content: string): string {
  return (
    content
      // Remove structural labels
      .replace(/\b(hook|bridge|nugget|wta):\s*/gi, "")
      // Remove step labels
      .replace(/\bstep \d+:\s*/gi, "")
      // Remove empty lines
      .replace(/\n\s*\n/g, "\n")
      // Trim whitespace
      .trim()
  );
}

/**
 * Retry wrapper for script generation with validation
 * @param generateFn - Function that generates script content
 * @param extractContentFn - Function to extract content from generation result
 * @param config - Regeneration configuration
 * @returns Generated result
 */
export async function generateScriptWithValidation<T>(
  generateFn: () => Promise<T>,
  extractContentFn: (result: T) => string,
  config: RegenerationConfig = DEFAULT_REGENERATION_CONFIG,
): Promise<T> {
  let lastResult: T;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await generateFn();
      const content = extractContentFn(result);

      // Validate the generated content
      const validation = validateScript(content, config.validationRules);

      if (validation.isValid) {
        console.log(`✅ Script validation passed on attempt ${attempt} (score: ${validation.score})`);
        return result;
      }

      console.warn(
        `⚠️ Script validation failed on attempt ${attempt} (score: ${validation.score}):`,
        validation.issues,
      );
      lastResult = result;

      // If this isn't the last attempt, wait before retrying
      if (attempt < config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      }
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Script generation failed on attempt ${attempt}:`, error);

      // If this isn't the last attempt, wait before retrying
      if (attempt < config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      }
    }
  }

  // If we get here, all attempts failed
  if (lastError) {
    throw lastError;
  }

  // Return the last result even if it has validation issues
  console.warn(`⚠️ Returning script with validation issues after ${config.maxRetries} attempts`);
  return lastResult!;
}

/**
 * Get default validation rules
 * @returns Array of default validation rules
 */
function getDefaultValidationRules(): ValidationRule[] {
  return [
    {
      id: "placeholders",
      name: "Unfilled Placeholders",
      description: "Detects unfilled placeholders in square brackets",
      severity: "error",
      test: (content: string) => /\[([^\]]+)\]/.test(content),
      message: "Contains unfilled placeholders in square brackets",
    },
    {
      id: "structural_labels",
      name: "Structural Labels",
      description: "Detects structural labels like hook:, bridge:, etc.",
      severity: "error",
      test: (content: string) => /\b(hook|bridge|nugget|wta):\s*/gi.test(content),
      message: "Contains structural labels (hook:, bridge:, etc.)",
    },
    {
      id: "step_instructions",
      name: "Step Instructions",
      description: "Detects step instructions in content",
      severity: "warning",
      test: (content: string) => /\bstep \d+:/gi.test(content),
      message: "Contains step instructions",
    },
    {
      id: "parenthetical_instructions",
      name: "Parenthetical Instructions",
      description: "Detects parenthetical instructions",
      severity: "warning",
      test: (content: string) => /\([^)]*\)/.test(content),
      message: "Contains parenthetical instructions",
    },
    {
      id: "too_short",
      name: "Content Too Short",
      description: "Checks if content meets minimum word count",
      severity: "error",
      test: (content: string) => content.trim().split(/\s+/).length < 10,
      message: "Content is too short (less than 10 words)",
    },
    {
      id: "too_long",
      name: "Content Too Long",
      description: "Checks if content exceeds maximum word count",
      severity: "warning",
      test: (content: string) => content.trim().split(/\s+/).length > 300,
      message: "Content is too long (more than 300 words)",
    },
    {
      id: "repetitive_words",
      name: "Repetitive Words",
      description: "Detects excessive word repetition",
      severity: "warning",
      test: (content: string) => {
        const words = content.toLowerCase().split(/\s+/);
        const wordCounts = words.reduce(
          (acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return Object.values(wordCounts).some((count) => count > 5);
      },
      message: "Contains repetitive words",
    },
    {
      id: "missing_punctuation",
      name: "Missing Punctuation",
      description: "Detects missing punctuation at sentence endings",
      severity: "info",
      test: (content: string) => {
        const sentences = content.split(/[.!?]/).filter((s) => s.trim().length > 0);
        return sentences.some((sentence) => sentence.trim().length > 50);
      },
      message: "Some sentences may be missing punctuation",
    },
  ];
}

/**
 * Analyze script readability
 * @param content - Script content to analyze
 * @returns Readability analysis
 */
export function analyzeReadability(content: string): {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
  complexity: "simple" | "moderate" | "complex";
} {
  const words = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const sentences = content.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Simple Flesch Reading Ease calculation
  const readabilityScore = Math.max(0, Math.min(100, 206.835 - 1.015 * avgWordsPerSentence));

  let complexity: "simple" | "moderate" | "complex";
  if (readabilityScore >= 80) {
    complexity = "simple";
  } else if (readabilityScore >= 60) {
    complexity = "moderate";
  } else {
    complexity = "complex";
  }

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 100) / 100,
    readabilityScore: Math.round(readabilityScore * 100) / 100,
    complexity,
  };
}

/**
 * Check if script follows content structure guidelines
 * @param content - Script content to check
 * @returns Structure analysis
 */
export function analyzeContentStructure(content: string): {
  hasHook: boolean;
  hasBridge: boolean;
  hasNugget: boolean;
  hasWta: boolean;
  structureScore: number;
  suggestions: string[];
} {
  const lowerContent = content.toLowerCase();

  const hasHook =
    lowerContent.includes("hook") ||
    lowerContent.includes("what if") ||
    lowerContent.includes("imagine") ||
    lowerContent.includes("?");

  const hasBridge =
    lowerContent.includes("bridge") ||
    lowerContent.includes("but") ||
    lowerContent.includes("however") ||
    lowerContent.includes("so");

  const hasNugget =
    lowerContent.includes("nugget") ||
    lowerContent.includes("key") ||
    lowerContent.includes("important") ||
    lowerContent.includes("secret");

  const hasWta =
    lowerContent.includes("wta") ||
    lowerContent.includes("click") ||
    lowerContent.includes("subscribe") ||
    lowerContent.includes("follow");

  const structureScore = [hasHook, hasBridge, hasNugget, hasWta].filter(Boolean).length * 25;

  const suggestions: string[] = [];
  if (!hasHook) suggestions.push("Add a compelling hook at the beginning");
  if (!hasBridge) suggestions.push("Include a bridge to connect ideas");
  if (!hasNugget) suggestions.push("Add a key insight or nugget of value");
  if (!hasWta) suggestions.push("Include a clear call-to-action");

  return {
    hasHook,
    hasBridge,
    hasNugget,
    hasWta,
    structureScore,
    suggestions,
  };
}
