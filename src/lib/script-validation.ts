/**
 * Script validation utilities for detecting and handling unfilled placeholders
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
}

/**
 * Detect unfilled placeholders in square brackets [like this]
 */
export function detectPlaceholders(content: string): PlaceholderDetectionResult {
  // Match square brackets with content inside
  const placeholderRegex = /\[([^\]]+)\]/g;
  const matches = [...content.matchAll(placeholderRegex)];
  
  const placeholders = matches.map(match => match[0]); // Full match including brackets
  
  return {
    hasPlaceholders: placeholders.length > 0,
    placeholders,
    cleanedContent: content.replace(placeholderRegex, '').trim()
  };
}

/**
 * Comprehensive script validation
 */
export function validateScript(content: string): ScriptValidationResult {
  const issues: string[] = [];
  
  // Check for placeholders
  const placeholderResult = detectPlaceholders(content);
  if (placeholderResult.hasPlaceholders) {
    issues.push(`Contains unfilled placeholders: ${placeholderResult.placeholders.join(', ')}`);
  }
  
  // Check for minimum content length
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 10) {
    issues.push('Content is too short (less than 10 words)');
  }
  
  // Check for obvious AI instruction artifacts
  const instructionPatterns = [
    /\b(hook|bridge|nugget|wta):\s*/gi,
    /\b(step \d+:)/gi,
    /\[.*?\]/g, // Any remaining brackets
    /\(.*?\)/g // Parenthetical instructions
  ];
  
  instructionPatterns.forEach((pattern, index) => {
    if (pattern.test(content)) {
      switch (index) {
        case 0:
          issues.push('Contains structural labels (hook:, bridge:, etc.)');
          break;
        case 1:
          issues.push('Contains step instructions');
          break;
        case 2:
          issues.push('Contains square bracket placeholders');
          break;
        case 3:
          issues.push('Contains parenthetical instructions');
          break;
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    content
  };
}

/**
 * Clean script content by removing common artifacts
 */
export function cleanScriptContent(content: string): string {
  return content
    // Remove structural labels
    .replace(/\b(hook|bridge|nugget|wta):\s*/gi, '')
    // Remove step labels
    .replace(/\bstep \d+:\s*/gi, '')
    // Remove empty lines
    .replace(/\n\s*\n/g, '\n')
    // Trim whitespace
    .trim();
}

/**
 * Configuration for script regeneration
 */
export interface RegenerationConfig {
  maxRetries: number;
  retryDelay: number;
}

export const DEFAULT_REGENERATION_CONFIG: RegenerationConfig = {
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * Retry wrapper for script generation with validation
 */
export async function generateScriptWithValidation<T>(
  generateFn: () => Promise<T>,
  extractContentFn: (result: T) => string,
  config: RegenerationConfig = DEFAULT_REGENERATION_CONFIG
): Promise<T> {
  let lastResult: T;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await generateFn();
      const content = extractContentFn(result);
      
      // Validate the generated content
      const validation = validateScript(content);
      
      if (validation.isValid) {
        console.log(`✅ Script validation passed on attempt ${attempt}`);
        return result;
      }
      
      console.warn(`⚠️ Script validation failed on attempt ${attempt}:`, validation.issues);
      lastResult = result;
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Script generation failed on attempt ${attempt}:`, error);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
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