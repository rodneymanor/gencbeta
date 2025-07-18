/**
 * Centralized duration configuration for script generation
 * All duration-related calculations in one place for easy maintenance
 */

import { ScriptDuration, DurationMetrics } from "./types";

export class DurationConfig {
  private static readonly WORDS_PER_SECOND = 2.2;

  private static readonly configs: Record<ScriptDuration, DurationMetrics> = {
    "15": {
      totalWords: 33,
      hookWords: 7,
      bridgeWords: 9,
      nuggetWords: 13,
      wtaWords: 4,
      hookSeconds: 3,
      bridgeSeconds: 4,
      nuggetSeconds: 6,
      wtaSeconds: 2,
    },
    "20": {
      totalWords: 44,
      hookWords: 7,
      bridgeWords: 11,
      nuggetWords: 18,
      wtaWords: 8,
      hookSeconds: 3,
      bridgeSeconds: 5,
      nuggetSeconds: 8,
      wtaSeconds: 4,
    },
    "30": {
      totalWords: 66,
      hookWords: 7,
      bridgeWords: 15,
      nuggetWords: 29,
      wtaWords: 15,
      hookSeconds: 3,
      bridgeSeconds: 7,
      nuggetSeconds: 13,
      wtaSeconds: 7,
    },
    "45": {
      totalWords: 99,
      hookWords: 11,
      bridgeWords: 22,
      nuggetWords: 44,
      wtaWords: 22,
      hookSeconds: 5,
      bridgeSeconds: 10,
      nuggetSeconds: 20,
      wtaSeconds: 10,
    },
    "60": {
      totalWords: 132,
      hookWords: 11,
      bridgeWords: 33,
      nuggetWords: 59,
      wtaWords: 29,
      hookSeconds: 5,
      bridgeSeconds: 15,
      nuggetSeconds: 27,
      wtaSeconds: 13,
    },
    "90": {
      totalWords: 198,
      hookWords: 15,
      bridgeWords: 44,
      nuggetWords: 88,
      wtaWords: 44,
      hookSeconds: 7,
      bridgeSeconds: 20,
      nuggetSeconds: 40,
      wtaSeconds: 20,
    },
  };

  static getConfig(duration: ScriptDuration): DurationMetrics {
    return this.configs[duration];
  }

  static getWordsPerSecond(): number {
    return this.WORDS_PER_SECOND;
  }

  static calculateDuration(wordCount: number): number {
    return Math.round(wordCount / this.WORDS_PER_SECOND);
  }

  static getPromptVariables(duration: ScriptDuration): string {
    const config = this.getConfig(duration);
    return `
You must create a ${duration}-second script (approximately ${config.totalWords} words total).

Use this exact structure:
- Hook: ${config.hookSeconds} seconds (${config.hookWords} words)
- Bridge: ${config.bridgeSeconds} seconds (${config.bridgeWords} words)
- Golden Nugget: ${config.nuggetSeconds} seconds (${config.nuggetWords} words)
- WTA: ${config.wtaSeconds} seconds (${config.wtaWords} words)

IMPORTANT: The total word count must be close to ${config.totalWords} words for proper ${duration}-second delivery.`;
  }
}
