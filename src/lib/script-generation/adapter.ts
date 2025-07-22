/**
 * Adapter layer for gradual migration from old to new script generation architecture
 * This allows us to use the new interface while keeping the existing service working
 */

import { ScriptGenerationService } from "../services/script-generation-service";

import { DurationConfig } from "./duration-config";
import { ScriptWrapper } from "./generators/script-wrapper";
import { EnrichedInput, GenerationRules } from "./preprocessors";
import { ScriptParser } from "./script-parser";
import { UnifiedScriptInput, GeneratedScript, ScriptContext } from "./types";

export class ScriptGenerationAdapter {
  private scriptService: ScriptGenerationService;

  constructor() {
    this.scriptService = new ScriptGenerationService();
  }

  /**
   * Generate a script using the new unified input format
   * Internally converts to the old format for backward compatibility
   */
  async generate(input: UnifiedScriptInput, context: ScriptContext): Promise<GeneratedScript> {
    try {
      // Convert unified input to old format
      const oldFormatInput = {
        idea: input.idea,
        length: input.duration,
        type: input.type,
        tone: input.tone,
        platform: "general" as const, // Default since we don't need platform-specific
        ideaContext:
          input.context?.referenceMode && input.context?.notes
            ? {
                selectedNotes: [
                  {
                    id: "enriched-context",
                    title: "Context Notes",
                    content: input.context.notes,
                    tags: [],
                  },
                ],
                contextMode: input.context.referenceMode,
              }
            : undefined,
        userId: context.userId,
      };

      // Call existing service
      const result = await this.scriptService.generateScript(oldFormatInput);

      // Parse the script elements
      let scriptElements;

      // First try to get structured elements from the result
      if (result.elements && typeof result.elements === "object" && result.elements.hook) {
        scriptElements = result.elements;
      } else if (result.hook && result.bridge) {
        scriptElements = {
          hook: result.hook,
          bridge: result.bridge,
          goldenNugget: result.goldenNugget || result.golden_nugget || "",
          wta: result.wta || "",
        };
      } else {
        // Parse from content string
        const content = result.content || result.elements || "";
        const parsed = ScriptParser.parse(content);
        if (parsed) {
          scriptElements = parsed;
        } else {
          // Fallback to empty structure
          scriptElements = {
            hook: "",
            bridge: "",
            goldenNugget: "",
            wta: "",
          };
        }
      }

      // Calculate word count
      const fullScript = `${scriptElements.hook} ${scriptElements.bridge} ${scriptElements.goldenNugget} ${scriptElements.wta}`;
      const wordCount = this.countWords(fullScript);

      return {
        hook: scriptElements.hook,
        bridge: scriptElements.bridge,
        goldenNugget: scriptElements.goldenNugget,
        wta: scriptElements.wta,
        metadata: {
          duration: input.duration,
          type: input.type,
          tone: input.tone,
          wordCount,
          estimatedDuration: DurationConfig.calculateDuration(wordCount),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error("Script generation failed:", error);
      throw new Error(`Failed to generate script: ${error.message}`);
    }
  }

  /**
   * Generate script with preprocessing rules using AI service
   */
  async generateWithRules(
    enrichedInput: EnrichedInput,
    rules: GenerationRules,
    testFeatureFlags?: Record<string, boolean>,
  ): Promise<GeneratedScript> {
    try {
      // Use the wrapper for all generation - it calls the enhanced AI service
      const wrapper = new ScriptWrapper();
      const result = await wrapper.generate(enrichedInput, rules);

      // Debug logging
      console.log("🔍 [Adapter] Wrapper result:", {
        hasHook: !!result.hook?.content,
        hasBridge: !!result.bridge?.content,
        hasGoldenNugget: !!result.goldenNugget?.content,
        hasWta: !!result.wta?.content,
        hookContent: result.hook?.content?.substring(0, 50),
        bridgeContent: result.bridge?.content?.substring(0, 50),
        goldenNuggetContent: result.goldenNugget?.content?.substring(0, 50),
        wtaContent: result.wta?.content?.substring(0, 50),
      });

      // Convert wrapper result to GeneratedScript format
      return {
        hook: result.hook.content,
        bridge: result.bridge.content,
        goldenNugget: result.goldenNugget.content,
        wta: result.wta.content,
        metadata: {
          duration: enrichedInput.input.duration,
          type: enrichedInput.input.type,
          tone: enrichedInput.input.tone,
          wordCount:
            result.hook.wordCount + result.bridge.wordCount + result.goldenNugget.wordCount + result.wta.wordCount,
          estimatedDuration: this.calculateDuration(
            result.hook.wordCount + result.bridge.wordCount + result.goldenNugget.wordCount + result.wta.wordCount,
          ),
          generatedAt: new Date(),
          generationMethod: "ai_enhanced",
        },
      };
    } catch (error) {
      console.error("generateWithRules failed, falling back to legacy method:", error);
      // Fallback to existing method if wrapper fails
      return this.generate(enrichedInput.input, enrichedInput.context);
    }
  }

  /**
   * Generate multiple script variations
   */
  async generateVariations(
    input: UnifiedScriptInput,
    context: ScriptContext,
    count: number = 3,
  ): Promise<GeneratedScript[]> {
    const promises = Array(count)
      .fill(null)
      .map(() => this.generate(input, context));

    return Promise.all(promises);
  }

  private countWords(script: any): number {
    const text = `${script.hook || ""} ${script.bridge || ""} ${script.goldenNugget || ""} ${script.wta || ""}`;
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private calculateDuration(wordCount: number): number {
    // Estimate duration at 2.2 words per second
    return Math.round(wordCount / 2.2);
  }
}
