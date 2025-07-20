/**
 * Rule Engine - Applies business rules and selects generation strategies
 * Determines which generators to use and how to configure them
 */

import { ScriptType, ScriptTone } from "../types";

import { EnrichedInput } from "./context-enricher";

export interface GenerationRules {
  generators: {
    hook: {
      strategy: "template" | "ai" | "hybrid";
      templates?: string[];
      aiPromptStyle?: string;
    };
    script: {
      strategy: "formula" | "ai" | "hybrid";
      formula?: string;
      structureType?: string;
    };
    enhancement: {
      useGhostWriter: boolean;
      enhancementLevel: "light" | "medium" | "heavy";
      focusAreas: string[];
    };
  };
  constraints: {
    maxRetries: number;
    strictWordCount: boolean;
    allowCreativeDeviation: boolean;
    qualityThreshold: number;
  };
  optimizations: {
    cacheStrategy: "aggressive" | "normal" | "minimal";
    parallelGeneration: boolean;
    useTemplateCache: boolean;
  };
}

export class RuleEngine {
  /**
   * Apply rules to determine generation strategy
   */
  static applyRules(enrichedInput: EnrichedInput): GenerationRules {
    const { input, enrichments } = enrichedInput;

    // Base rules
    const rules: GenerationRules = {
      generators: {
        hook: this.determineHookStrategy(input.type, input.tone),
        script: this.determineScriptStrategy(input.type, input.duration),
        enhancement: this.determineEnhancementStrategy(input.type, input.tone),
      },
      constraints: this.determineConstraints(input.duration, input.type),
      optimizations: this.determineOptimizations(enrichedInput),
    };

    // Apply special rules based on context
    this.applyContextualRules(rules, enrichedInput);

    return rules;
  }

  /**
   * Determine hook generation strategy
   */
  private static determineHookStrategy(type: ScriptType, tone: ScriptTone): GenerationRules["generators"]["hook"] {
    // Speed scripts use templates for consistency
    if (type === "speed") {
      return {
        strategy: "template",
        templates: this.getHookTemplates(type, tone),
      };
    }

    // Educational scripts use hybrid approach
    if (type === "educational") {
      return {
        strategy: "hybrid",
        templates: this.getHookTemplates(type, tone),
        aiPromptStyle: "question-based",
      };
    }

    // Viral scripts use AI for creativity
    return {
      strategy: "ai",
      aiPromptStyle: "attention-grabbing",
    };
  }

  /**
   * Determine script generation strategy
   */
  private static determineScriptStrategy(type: ScriptType, duration: string): GenerationRules["generators"]["script"] {
    // Short scripts use formula for speed
    if (duration === "15" || duration === "20") {
      return {
        strategy: "formula",
        formula: "compact",
        structureType: "direct",
      };
    }

    // Educational always uses structured formula
    if (type === "educational") {
      return {
        strategy: "formula",
        formula: "educational",
        structureType: "problem-solution",
      };
    }

    // Longer viral content uses AI
    if (type === "viral" && (duration === "60" || duration === "90")) {
      return {
        strategy: "ai",
        structureType: "narrative",
      };
    }

    // Default to hybrid
    return {
      strategy: "hybrid",
      formula: "standard",
      structureType: "flexible",
    };
  }

  /**
   * Determine enhancement strategy
   */
  private static determineEnhancementStrategy(
    type: ScriptType,
    tone: ScriptTone,
  ): GenerationRules["generators"]["enhancement"] {
    // Speed scripts need light enhancement
    if (type === "speed") {
      return {
        useGhostWriter: true,
        enhancementLevel: "light",
        focusAreas: ["clarity", "impact"],
      };
    }

    // Educational needs clarity enhancement
    if (type === "educational") {
      return {
        useGhostWriter: true,
        enhancementLevel: "medium",
        focusAreas: ["clarity", "structure", "examples"],
      };
    }

    // Viral needs heavy creative enhancement
    return {
      useGhostWriter: true,
      enhancementLevel: "heavy",
      focusAreas: ["emotion", "surprise", "memorability"],
    };
  }

  /**
   * Determine constraints based on script parameters
   */
  private static determineConstraints(duration: string, type: ScriptType): GenerationRules["constraints"] {
    const baseConstraints = {
      maxRetries: 3,
      strictWordCount: true,
      allowCreativeDeviation: false,
      qualityThreshold: 0.7,
    };

    // Short scripts need strict constraints
    if (duration === "15" || duration === "20") {
      return {
        ...baseConstraints,
        strictWordCount: true,
        allowCreativeDeviation: false,
      };
    }

    // Viral content allows more creativity
    if (type === "viral") {
      return {
        ...baseConstraints,
        strictWordCount: false,
        allowCreativeDeviation: true,
        qualityThreshold: 0.8,
      };
    }

    return baseConstraints;
  }

  /**
   * Determine optimization strategies
   */
  private static determineOptimizations(enrichedInput: EnrichedInput): GenerationRules["optimizations"] {
    const { input } = enrichedInput;

    // Speed scripts need aggressive caching
    if (input.type === "speed") {
      return {
        cacheStrategy: "aggressive",
        parallelGeneration: true,
        useTemplateCache: true,
      };
    }

    // Viral content needs less caching for uniqueness
    if (input.type === "viral") {
      return {
        cacheStrategy: "minimal",
        parallelGeneration: false,
        useTemplateCache: false,
      };
    }

    // Default balanced approach
    return {
      cacheStrategy: "normal",
      parallelGeneration: true,
      useTemplateCache: true,
    };
  }

  /**
   * Apply contextual rules based on user context
   */
  private static applyContextualRules(rules: GenerationRules, enrichedInput: EnrichedInput): void {
    const { context, input } = enrichedInput;

    // If user has custom voice, prioritize AI generation
    if (context.voice?.isCustom) {
      rules.generators.hook.strategy = "ai";
      rules.generators.script.strategy = "ai";
    }

    // If user provided reference notes, increase quality threshold
    if (input.context?.notes) {
      rules.constraints.qualityThreshold = Math.min(rules.constraints.qualityThreshold + 0.1, 0.95);
    }

    // If comprehensive reference mode, allow more creative deviation
    if (input.context?.referenceMode === "comprehensive") {
      rules.constraints.allowCreativeDeviation = true;
      rules.generators.enhancement.enhancementLevel = "heavy";
    }
  }

  /**
   * Get hook templates based on type and tone
   */
  private static getHookTemplates(type: ScriptType, tone: ScriptTone): string[] {
    const templates: Record<string, string[]> = {
      "speed-casual": ["Here's something crazy:", "You won't believe this:", "Quick story:"],
      "speed-professional": ["Here's what you need to know:", "Let me share something important:", "Consider this:"],
      "educational-casual": ["Ever wondered why", "Did you know that", "Here's how to"],
      "educational-professional": ["Research shows that", "Studies indicate", "Evidence suggests"],
      "viral-energetic": ["STOP what you're doing!", "This changed my life:", "Nobody talks about this:"],
    };

    const key = `${type}-${tone}`;
    return templates[key] || templates["speed-casual"];
  }
}
