/**
 * Unified script generation service - the new entry point for all script generation
 * Combines the adapter, context provider, and configuration for a clean interface
 */

import { ScriptGenerationAdapter } from "./adapter";
import { ScriptContextProvider } from "./context-provider";
import { DurationConfig } from "./duration-config";
import { InputValidator, ContextEnricher, RuleEngine } from "./preprocessors";
import { UnifiedScriptInput, GeneratedScript, ScriptDuration } from "./types";

export class UnifiedScriptService {
  private adapter: ScriptGenerationAdapter;
  private contextProvider: ScriptContextProvider;

  constructor() {
    this.adapter = new ScriptGenerationAdapter();
    this.contextProvider = ScriptContextProvider.getInstance();
  }

  /**
   * Main entry point for script generation with the new architecture
   */
  async generateScript(
    input: UnifiedScriptInput,
    userId: string,
    testFeatureFlags?: Record<string, boolean>,
  ): Promise<GeneratedScript> {
    // Step 1: Validate input
    const validation = InputValidator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn("Input warnings:", validation.warnings);
    }

    // Use sanitized input
    const sanitizedInput = validation.sanitizedInput!;

    // Step 2: Load context with caching
    const context = await this.contextProvider.loadContext(userId);

    // Step 3: Enrich input with context
    const enrichedInput = ContextEnricher.enrich(sanitizedInput, context);

    // Step 4: Apply rules to determine generation strategy
    const rules = RuleEngine.applyRules(enrichedInput);

    // Step 5: Generate script through adapter with rules
    const script = await this.adapter.generateWithRules(enrichedInput, rules, testFeatureFlags);

    // Step 6: Validate output meets duration requirements
    this.validateOutput(script, sanitizedInput.duration);

    return script;
  }

  /**
   * Generate multiple variations of a script
   */
  async generateVariations(input: UnifiedScriptInput, userId: string, count: number = 3): Promise<GeneratedScript[]> {
    const validation = InputValidator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const context = await this.contextProvider.loadContext(userId);
    const scripts = await this.adapter.generateVariations(validation.sanitizedInput!, context, count);

    // Validate all outputs
    scripts.forEach((script) => this.validateOutput(script, validation.sanitizedInput!.duration));

    return scripts;
  }

  /**
   * Get duration configuration for UI display
   */
  getDurationOptions() {
    return [
      { value: "15", label: "15 seconds", words: 33 },
      { value: "20", label: "20 seconds", words: 44 },
      { value: "30", label: "30 seconds", words: 66 },
      { value: "45", label: "45 seconds", words: 99 },
      { value: "60", label: "60 seconds", words: 132 },
      { value: "90", label: "90 seconds", words: 198 },
    ];
  }

  /**
   * Invalidate cache for a specific user (useful after profile updates)
   */
  invalidateUserCache(userId: string): void {
    this.contextProvider.invalidateUserCache(userId);
  }

  /**
   * Generate script with explicit preprocessing steps (for testing)
   */
  async generateScriptWithSteps(
    input: UnifiedScriptInput,
    userId: string,
    testFeatureFlags?: Record<string, boolean>,
  ): Promise<{
    script: GeneratedScript;
    steps: {
      validation: ReturnType<typeof InputValidator.validate>;
      enrichedInput: ReturnType<typeof ContextEnricher.enrich>;
      rules: ReturnType<typeof RuleEngine.applyRules>;
    };
  }> {
    // Step 1: Validate
    const validation = InputValidator.validate(input);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    // Step 2: Load context
    const context = await this.contextProvider.loadContext(userId);

    // Step 3: Enrich
    const enrichedInput = ContextEnricher.enrich(validation.sanitizedInput!, context);

    // Step 4: Apply rules
    const rules = RuleEngine.applyRules(enrichedInput);

    // Step 5: Generate
    const script = await this.adapter.generateWithRules(enrichedInput, rules, testFeatureFlags);

    // Step 6: Validate output
    this.validateOutput(script, validation.sanitizedInput!.duration);

    return {
      script,
      steps: {
        validation,
        enrichedInput,
        rules,
      },
    };
  }

  private validateOutput(script: GeneratedScript, targetDuration: ScriptDuration): void {
    const config = DurationConfig.getConfig(targetDuration);
    const tolerance = 0.2; // 20% tolerance

    const minWords = Math.floor(config.totalWords * (1 - tolerance));
    const maxWords = Math.ceil(config.totalWords * (1 + tolerance));

    if (script.metadata.wordCount < minWords || script.metadata.wordCount > maxWords) {
      console.warn(
        `Script word count (${script.metadata.wordCount}) outside target range ` +
          `${minWords}-${maxWords} for ${targetDuration}s duration`,
      );
    }
  }
}
