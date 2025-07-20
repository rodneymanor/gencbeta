/**
 * Context Enricher - Enriches input with user, brand, and content context
 * Merges all contextual information needed for script generation
 */

import { DurationConfig } from "../duration-config";
import { UnifiedScriptInput, ScriptContext } from "../types";

export interface EnrichedInput {
  input: UnifiedScriptInput;
  context: ScriptContext;
  enrichments: {
    targetWordCount: number;
    componentWordCounts: {
      hook: number;
      bridge: number;
      goldenNugget: number;
      wta: number;
    };
    voiceGuidelines: {
      tone: string;
      style: string;
      vocabulary: string[];
      avoidPhrases: string[];
    };
    contentGuidelines: {
      openingStyle: string;
      pacing: string;
      emphasis: string[];
    };
  };
}

export class ContextEnricher {
  /**
   * Enrich input with all necessary context
   */
  static enrich(input: UnifiedScriptInput, context: ScriptContext): EnrichedInput {
    // Get duration-specific configurations
    const durationConfig = DurationConfig.getConfig(input.duration);

    // Extract voice guidelines from context
    const voiceGuidelines = this.extractVoiceGuidelines(input, context);

    // Determine content guidelines based on type and tone
    const contentGuidelines = this.determineContentGuidelines(input);

    // Calculate component word counts
    const componentWordCounts = {
      hook: durationConfig.hookWords,
      bridge: durationConfig.bridgeWords,
      goldenNugget: durationConfig.nuggetWords,
      wta: durationConfig.wtaWords,
    };

    return {
      input,
      context,
      enrichments: {
        targetWordCount: durationConfig.totalWords,
        componentWordCounts,
        voiceGuidelines,
        contentGuidelines,
      },
    };
  }

  /**
   * Extract voice guidelines from user context
   */
  private static extractVoiceGuidelines(
    input: UnifiedScriptInput,
    context: ScriptContext,
  ): EnrichedInput["enrichments"]["voiceGuidelines"] {
    const voice = context.voice;
    const profile = context.profile;

    // Default guidelines
    const guidelines = {
      tone: input.tone,
      style: "conversational",
      vocabulary: [] as string[],
      avoidPhrases: [...context.negativeKeywords],
    };

    // Enhance with voice data if available
    if (voice) {
      guidelines.style = voice.style || guidelines.style;

      if (voice.vocabulary) {
        guidelines.vocabulary = voice.vocabulary;
      }

      if (voice.avoidPhrases) {
        guidelines.avoidPhrases = [...guidelines.avoidPhrases, ...voice.avoidPhrases];
      }
    }

    // Enhance with profile preferences
    if (profile?.preferences) {
      if (profile.preferences.writingStyle) {
        guidelines.style = profile.preferences.writingStyle;
      }
    }

    // Apply tone-specific adjustments
    switch (input.tone) {
      case "casual":
        guidelines.vocabulary.push("you know", "like", "basically", "honestly");
        break;
      case "professional":
        guidelines.avoidPhrases.push("um", "uh", "like", "basically");
        guidelines.vocabulary.push("therefore", "moreover", "specifically");
        break;
      case "energetic":
        guidelines.vocabulary.push("amazing", "incredible", "mind-blowing", "game-changer");
        break;
      case "educational":
        guidelines.vocabulary.push("let me explain", "here's how", "the key is", "importantly");
        break;
    }

    return guidelines;
  }

  /**
   * Determine content guidelines based on script type and tone
   */
  private static determineContentGuidelines(
    input: UnifiedScriptInput,
  ): EnrichedInput["enrichments"]["contentGuidelines"] {
    const guidelines = {
      openingStyle: "standard",
      pacing: "medium",
      emphasis: [] as string[],
    };

    // Type-specific guidelines
    switch (input.type) {
      case "speed":
        guidelines.openingStyle = "direct";
        guidelines.pacing = "fast";
        guidelines.emphasis = ["brevity", "clarity", "impact"];
        break;

      case "educational":
        guidelines.openingStyle = "question";
        guidelines.pacing = "measured";
        guidelines.emphasis = ["clarity", "structure", "takeaway"];
        break;

      case "viral":
        guidelines.openingStyle = "hook";
        guidelines.pacing = "dynamic";
        guidelines.emphasis = ["surprise", "emotion", "shareability"];
        break;
    }

    // Duration-specific adjustments
    if (input.duration === "15" || input.duration === "20") {
      guidelines.pacing = "fast";
      guidelines.emphasis.push("immediacy");
    } else if (input.duration === "60" || input.duration === "90") {
      guidelines.emphasis.push("depth");
    }

    // Tone adjustments
    if (input.tone === "energetic") {
      guidelines.pacing = guidelines.pacing === "measured" ? "medium" : "fast";
    } else if (input.tone === "professional") {
      guidelines.openingStyle = guidelines.openingStyle === "hook" ? "direct" : guidelines.openingStyle;
    }

    return guidelines;
  }

  /**
   * Merge multiple contexts with priority handling
   */
  static mergeContexts(
    primary: Partial<EnrichedInput["enrichments"]>,
    secondary: Partial<EnrichedInput["enrichments"]>,
  ): EnrichedInput["enrichments"] {
    return {
      targetWordCount: primary.targetWordCount || secondary.targetWordCount || 66,
      componentWordCounts: {
        ...secondary.componentWordCounts,
        ...primary.componentWordCounts,
      } as EnrichedInput["enrichments"]["componentWordCounts"],
      voiceGuidelines: {
        ...secondary.voiceGuidelines,
        ...primary.voiceGuidelines,
        vocabulary: [...(secondary.voiceGuidelines?.vocabulary || []), ...(primary.voiceGuidelines?.vocabulary || [])],
        avoidPhrases: [
          ...(secondary.voiceGuidelines?.avoidPhrases || []),
          ...(primary.voiceGuidelines?.avoidPhrases || []),
        ],
      } as EnrichedInput["enrichments"]["voiceGuidelines"],
      contentGuidelines: {
        ...secondary.contentGuidelines,
        ...primary.contentGuidelines,
        emphasis: [...(secondary.contentGuidelines?.emphasis || []), ...(primary.contentGuidelines?.emphasis || [])],
      } as EnrichedInput["enrichments"]["contentGuidelines"],
    };
  }
}
