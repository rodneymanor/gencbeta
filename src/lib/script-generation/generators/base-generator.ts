/**
 * Base Generator Class
 * Common functionality for all content generators
 */

import { EnrichedInput, GenerationRules } from "../preprocessors";

export interface GeneratorResult {
  content: string;
  wordCount: number;
  metadata?: {
    strategy: string;
    confidence: number;
    [key: string]: any; // Allow additional metadata properties
  };
}

export abstract class BaseGenerator {
  /**
   * Generate content based on enriched input and rules
   */
  abstract generate(enrichedInput: EnrichedInput, rules: GenerationRules): Promise<GeneratorResult>;

  /**
   * Count words in generated content
   */
  protected countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Apply negative keywords filter
   */
  protected filterNegativeKeywords(text: string, negativeKeywords: string[]): string {
    let filtered = text;
    negativeKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      filtered = filtered.replace(regex, "");
    });
    return filtered.trim();
  }

  /**
   * Ensure content meets word count target
   */
  protected adjustToWordCount(text: string, targetWords: number, tolerance: number = 0.2): string {
    const currentWords = this.countWords(text);
    const minWords = Math.floor(targetWords * (1 - tolerance));
    const maxWords = Math.ceil(targetWords * (1 + tolerance));

    if (currentWords >= minWords && currentWords <= maxWords) {
      return text;
    }

    // TODO: Implement smart trimming/expansion
    return text;
  }
}
