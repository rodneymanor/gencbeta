/**
 * Script Wrapper Generator
 * Wraps existing script generation logic in the new modular architecture
 * Phase 1: Zero-risk migration that maintains 100% compatibility
 */

import { BaseGenerator, GeneratorResult } from "./base-generator";
import { EnrichedInput, GenerationRules } from "../preprocessors";
import { ScriptGenerationService } from "../../services/script-generation-service";

export class ScriptWrapper extends BaseGenerator {
  private scriptService: ScriptGenerationService;

  constructor() {
    super();
    this.scriptService = new ScriptGenerationService();
  }

  /**
   * Generate complete script using existing service
   * This maintains 100% compatibility while providing the new interface
   */
  async generate(
    enrichedInput: EnrichedInput,
    rules: GenerationRules,
  ): Promise<{
    hook: GeneratorResult;
    bridge: GeneratorResult;
    goldenNugget: GeneratorResult;
    wta: GeneratorResult;
    fullScript: string;
  }> {
    const { input, context } = enrichedInput;

    // Convert to old format
    const oldFormatInput = {
      idea: input.idea,
      length: input.duration,
      type: input.type,
      tone: input.tone,
      platform: "general" as const,
      ideaContext: input.context?.notes,
      ideaContextMode: input.context?.referenceMode,
    };

    try {
      // Use existing service
      const result = await this.scriptService.generateScript(oldFormatInput, context.userId);

      if (!result.success) {
        throw new Error(result.error || "Script generation failed");
      }

      // Extract structured elements
      const elements = this.extractElements(result);

      return {
        hook: {
          content: elements.hook,
          wordCount: this.countWords(elements.hook),
          metadata: { strategy: "existing-service", confidence: 1.0 },
        },
        bridge: {
          content: elements.bridge,
          wordCount: this.countWords(elements.bridge),
          metadata: { strategy: "existing-service", confidence: 1.0 },
        },
        goldenNugget: {
          content: elements.goldenNugget,
          wordCount: this.countWords(elements.goldenNugget),
          metadata: { strategy: "existing-service", confidence: 1.0 },
        },
        wta: {
          content: elements.wta,
          wordCount: this.countWords(elements.wta),
          metadata: { strategy: "existing-service", confidence: 1.0 },
        },
        fullScript: result.content || "",
      };
    } catch (error) {
      console.error("ScriptWrapper generation failed:", error);
      throw error;
    }
  }

  /**
   * Extract script elements from existing service response
   */
  private extractElements(result: any): {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  } {
    // If we have structured elements, use them
    if (result.elements && typeof result.elements === "object") {
      if (result.elements.hook) {
        return {
          hook: result.elements.hook || "",
          bridge: result.elements.bridge || "",
          goldenNugget: result.elements.goldenNugget || result.elements.golden_nugget || "",
          wta: result.elements.wta || result.elements.cta || "",
        };
      }

      // Handle array format
      if (Array.isArray(result.elements)) {
        const elements = { hook: "", bridge: "", goldenNugget: "", wta: "" };

        result.elements.forEach((element: any) => {
          if (element.hook) elements.hook = element.hook;
          if (element.bridge) elements.bridge = element.bridge;
          if (element.goldenNugget || element.golden_nugget) {
            elements.goldenNugget = element.goldenNugget || element.golden_nugget;
          }
          if (element.cta || element.wta) {
            elements.wta = element.cta || element.wta;
          }
        });

        return elements;
      }
    }

    // Fallback: try to parse from content string
    if (result.content) {
      const { ScriptParser } = require("../script-parser");
      const parsed = ScriptParser.parse(result.content);
      if (parsed) {
        return parsed;
      }
    }

    // Last resort: use the content as-is
    return {
      hook: result.content || "",
      bridge: "",
      goldenNugget: "",
      wta: "",
    };
  }
}
