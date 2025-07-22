/**
 * Modern script generation service using the new modular Gemini and prompt architecture
 * Replaces the old ScriptService with cleaner, more maintainable code
 */

import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";

import { NegativeKeywordsService } from "../negative-keywords-service";
import { createSpeedWriteVariables, SpeedWriteResult, executePrompt, ensurePromptLibraryInitialized } from "../prompts";
import {
  createDurationOptimizedVariables,
  validateDurationOptimizedInput,
  type DurationOptimizedScriptInput,
} from "../prompts/integrations/duration-integration";
import {
  createIdeaContextVariables,
  validateIdeaContext,
  type IdeaContextConfig,
} from "../prompts/modifiers/idea-context";
import { parseInlineLabels } from "../script-analysis";
import { ScriptParser } from "../script-generation/script-parser";

// Input interfaces
export interface ScriptGenerationInput {
  idea: string;
  length: "15" | "20" | "30" | "45" | "60" | "90";
  userId: string;
  type?: "speed" | "educational" | "viral";
  tone?: "casual" | "professional" | "energetic" | "educational";
  platform?: "tiktok" | "instagram" | "youtube" | "general";
  ideaContext?: {
    selectedNotes: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
    }>;
    contextMode: "inspiration" | "reference" | "template" | "comprehensive";
  };
}

// Output interfaces
export interface ScriptGenerationResult {
  success: boolean;
  content: string;
  elements?: SpeedWriteResult | string | any[];
  metadata?: {
    promptId: string;
    model: string;
    tokensUsed?: number;
    responseTime?: number;
    targetWords: number;
    actualWords: number;
  };
  error?: string;
}

export interface ScriptOptionsResult {
  optionA: ScriptGenerationResult | null;
  optionB: ScriptGenerationResult | null;
}

/**
 * Modern script generation service
 */
export class ScriptGenerationService {
  private static instance: ScriptGenerationService;

  static getInstance(): ScriptGenerationService {
    if (!ScriptGenerationService.instance) {
      ScriptGenerationService.instance = new ScriptGenerationService();
    }
    return ScriptGenerationService.instance;
  }

  constructor() {
    // Ensure prompt library is initialized
    ensurePromptLibraryInitialized();
  }

  /**
   * Generate a single script using the modular prompt system
   */
  async generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
    try {
      console.log(`🚀 [ScriptGeneration] Generating ${input.type ?? "speed"} script for user ${input.userId}`);

      // Get user's negative keywords
      const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(input.userId);
      const fullNegativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

      // Truncate if too long for prompt validation (max 500 chars)
      const negativeKeywordInstruction =
        fullNegativeKeywordInstruction.length > 500
          ? fullNegativeKeywordInstruction.substring(0, 497) + "..."
          : fullNegativeKeywordInstruction;

      console.log(
        `🔍 [ScriptGeneration] Negative keyword instruction length: ${fullNegativeKeywordInstruction.length} -> ${negativeKeywordInstruction.length}`,
      );

      // Determine prompt variant
      const variant = this.getPromptVariant(input.type);
      const promptId = variant === "standard" ? "speed-write-v2" : `speed-write-${variant}`;

      // Create duration-optimized variables
      let variables = createDurationOptimizedVariables(
        {
          ...input,
          enableDurationOptimization: true,
        },
        {
          negativeKeywordInstruction,
        },
      );

      // Add idea context if provided
      if (input.ideaContext && input.ideaContext.selectedNotes.length > 0) {
        const ideaContextConfig: IdeaContextConfig = {
          selectedNotes: input.ideaContext.selectedNotes.map((note) => ({
            id: note.id,
            userId: input.userId, // Add required userId field
            title: note.title,
            content: note.content,
            tags: note.tags,
            type: "text" as const,
            source: "manual" as const,
            starred: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })),
          contextMode: input.ideaContext.contextMode,
          maxContextLength: 2000,
          includeMetadata: true,
        };

        // Validate idea context
        const validation = validateIdeaContext(ideaContextConfig);
        if (validation.isValid) {
          const ideaContextVars = createIdeaContextVariables(ideaContextConfig);
          variables = { ...variables, ...ideaContextVars };
          console.log(
            `🎯 [ScriptGeneration] Added idea context with ${ideaContextConfig.selectedNotes.length} notes in ${ideaContextConfig.contextMode} mode`,
          );
        } else {
          console.warn(`⚠️ [ScriptGeneration] Invalid idea context:`, validation.errors);
        }
      }

      // Execute prompt
      console.log(`🔍 [ScriptGeneration] Executing prompt ${promptId} with variables:`, variables);
      const result = await executePrompt<SpeedWriteResult>(promptId, {
        variables,
        validateInput: true,
        parseOutput: true,
      });

      console.log(`🔍 [ScriptGeneration] Prompt execution result:`, result);

      if (!result.success) {
        console.error(`❌ [ScriptGeneration] Prompt execution failed:`, result.error);
        return {
          success: false,
          content: "",
          error: result.error ?? "Failed to generate script",
        };
      }

      // Convert structured result to content string
      const elements = result.content!;
      console.log(`🔍 [ScriptGeneration] Raw elements from prompt:`, elements);

      // Check if we got raw prompt template instead of JSON (common issue)
      if (
        typeof elements === "string" &&
        elements.length > 1000 &&
        elements.includes("HOOK GUIDELINES") &&
        elements.includes("BRIDGE GUIDELINES")
      ) {
        console.error(
          `❌ [ScriptGeneration] Received raw prompt template instead of JSON. This indicates an AI model issue.`,
        );
        console.error(`❌ [ScriptGeneration] Raw content sample:`, elements.substring(0, 200));
        return {
          success: false,
          content: "",
          error: "AI model returned invalid response format. Please try again.",
        };
      }

      // Handle nested script structure
      const scriptElements = elements.script || elements;
      console.log(`🔍 [ScriptGeneration] Script elements for combining:`, scriptElements);

      // Validate that we have all required components
      if (typeof scriptElements === "object" && !Array.isArray(scriptElements)) {
        const missingComponents = [];
        if (!scriptElements.hook) missingComponents.push("hook");
        if (!scriptElements.bridge) missingComponents.push("bridge");
        if (!scriptElements.goldenNugget && !scriptElements.golden_nugget) missingComponents.push("goldenNugget");
        if (!scriptElements.wta && !scriptElements.cta) missingComponents.push("wta");

        if (missingComponents.length > 0) {
          console.error(`❌ [ScriptGeneration] Missing required components: ${missingComponents.join(", ")}`);
          console.error(`❌ [ScriptGeneration] Received elements:`, scriptElements);
          return {
            success: false,
            content: "",
            error: `Script generation incomplete - missing components: ${missingComponents.join(", ")}`,
          };
        }
      }

      const content = this.combineScriptElements(scriptElements);
      const actualWords = this.countWords(content);

      console.log(`🔍 [ScriptGeneration] Generated content:`, content);
      console.log(`🔍 [ScriptGeneration] Word count:`, actualWords);

      // Parse elements if they contain inline labels or are unstructured
      let parsedElements = scriptElements;
      if (typeof scriptElements === "string") {
        // First try inline labels
        if (
          scriptElements.includes("(Hook)") ||
          scriptElements.includes("(Bridge)") ||
          scriptElements.includes("(Golden Nugget)") ||
          scriptElements.includes("(CTA)")
        ) {
          console.log(`🔍 [ScriptGeneration] Parsing inline labels for editor`);
          parsedElements = parseInlineLabels(scriptElements);
          console.log(`🔍 [ScriptGeneration] Parsed structured elements:`, parsedElements);
        } else {
          // Try to parse unstructured text with pause markers
          console.log(`🔍 [ScriptGeneration] Attempting to parse unstructured script`);
          const parsed = ScriptParser.parse(scriptElements);
          if (parsed) {
            parsedElements = parsed;
            console.log(`🔍 [ScriptGeneration] Successfully parsed unstructured script:`, parsedElements);
          }
        }
      }

      return {
        success: true,
        content,
        elements: parsedElements,
        metadata: {
          promptId,
          model: "gemini-1.5-flash", // Default from service
          tokensUsed: result.tokensUsed,
          responseTime: result.responseTime,
          targetWords: variables.targetWords,
          actualWords,
        },
      };
    } catch (error) {
      console.error("❌ [ScriptGeneration] Generation failed:", error);
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Generate A/B test options (two different scripts)
   */
  async generateOptions(input: ScriptGenerationInput): Promise<ScriptOptionsResult> {
    console.log(`🎯 [ScriptGeneration] Generating A/B options for user ${input.userId}`);

    try {
      // Generate two scripts with different approaches
      const [optionA, optionB] = await Promise.all([
        this.generateScript({ ...input, type: "speed" }),
        this.generateScript({
          ...input,
          type: input.type === "educational" ? "educational" : "viral",
        }),
      ]);

      console.log(`🔍 [ScriptGeneration] Option A result:`, optionA);
      console.log(`🔍 [ScriptGeneration] Option B result:`, optionB);

      return {
        optionA: optionA.success ? optionA : null,
        optionB: optionB.success ? optionB : null,
      };
    } catch (error) {
      console.error("❌ [ScriptGeneration] A/B generation failed:", error);
      return {
        optionA: null,
        optionB: null,
      };
    }
  }

  /**
   * Batch generate multiple scripts
   */
  async generateBatch(
    inputs: ScriptGenerationInput[],
    options?: { concurrency?: number; failFast?: boolean },
  ): Promise<ScriptGenerationResult[]> {
    const { concurrency = 3, failFast = false } = options || {};

    console.log(`🔥 [ScriptGeneration] Batch generating ${inputs.length} scripts`);

    const results: ScriptGenerationResult[] = [];

    for (let i = 0; i < inputs.length; i += concurrency) {
      const batch = inputs.slice(i, i + concurrency);

      try {
        const batchResults = await Promise.all(batch.map((input) => this.generateScript(input)));

        results.push(...batchResults);

        // Check for failures if failFast is enabled
        if (failFast && batchResults.some((result) => !result.success)) {
          console.warn("⚠️ [ScriptGeneration] Batch stopped due to failure (failFast enabled)");
          break;
        }
      } catch (error) {
        console.error("❌ [ScriptGeneration] Batch error:", error);
        if (failFast) {
          throw error;
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ [ScriptGeneration] Batch completed: ${successCount}/${results.length} successful`);

    return results;
  }

  // Private helper methods
  private getPromptVariant(type?: string): "standard" | "educational" | "viral" {
    switch (type) {
      case "educational":
        return "educational";
      case "viral":
        return "viral";
      default:
        return "standard";
    }
  }

  private combineScriptElements(elements: SpeedWriteResult | string | any[]): string {
    console.log(`🔍 [ScriptGeneration] combineScriptElements input:`, elements);

    // Handle case where elements is already a string (some prompts return formatted text)
    if (typeof elements === "string") {
      // First, remove the [HOOK], [BRIDGE], etc. prefixes
      const cleanContent = elements
        .replace(/\[HOOK\]\s*/g, "")
        .replace(/\[BRIDGE\]\s*/g, "")
        .replace(/\[GOLDEN NUGGET\]\s*/g, "")
        .replace(/\[WTA\]\s*/g, "")
        .trim();

      // Check if content contains inline labels like "(Hook)", "(Bridge)", etc.
      if (
        cleanContent.includes("(Hook)") ||
        cleanContent.includes("(Bridge)") ||
        cleanContent.includes("(Golden Nugget)") ||
        cleanContent.includes("(CTA)")
      ) {
        console.log(`🔍 [ScriptGeneration] Detected inline labels, parsing elements`);
        const parsedElements = parseInlineLabels(cleanContent);
        console.log(`🔍 [ScriptGeneration] Parsed elements:`, parsedElements);

        // If parsing was successful, use ONLY the parsed content (no duplication)
        if (parsedElements.hook || parsedElements.bridge || parsedElements.goldenNugget || parsedElements.wta) {
          const combinedContent = [
            parsedElements.hook,
            parsedElements.bridge,
            parsedElements.goldenNugget,
            parsedElements.wta,
          ]
            .filter(Boolean)
            .join("\n\n");
          return combinedContent;
        }
      }

      return cleanContent;
    }

    // Handle array format (new prompt responses)
    if (Array.isArray(elements) && elements.length > 0) {
      const firstElement = elements[0];

      // If the array contains an object with a 'script' property, use that
      if (firstElement && typeof firstElement === "object" && firstElement.script) {
        return firstElement.script;
      }

      // Check if array contains separate objects for each script component
      // e.g., [{hook: "..."}, {bridge: "..."}, {goldenNugget: "..."}, {cta: "..."}]
      const hasHook = elements.some((el) => el.hook);
      const hasBridge = elements.some((el) => el.bridge);
      const hasGoldenNugget = elements.some((el) => el.goldenNugget || el.golden_nugget);
      const hasCta = elements.some((el) => el.cta || el.wta);

      if (hasHook || hasBridge || hasGoldenNugget || hasCta) {
        console.log(`🔍 [ScriptGeneration] Detected array with separate script components`);
        const combinedParts = {
          hook: "",
          bridge: "",
          goldenNugget: "",
          wta: "",
        };

        // Combine all elements
        elements.forEach((element) => {
          if (element.hook) combinedParts.hook = element.hook;
          if (element.bridge) combinedParts.bridge = element.bridge;
          if (element.goldenNugget || element.golden_nugget) {
            combinedParts.goldenNugget = element.goldenNugget || element.golden_nugget;
          }
          if (element.cta || element.wta) {
            combinedParts.wta = element.cta || element.wta;
          }
        });

        return [combinedParts.hook, combinedParts.bridge, combinedParts.goldenNugget, combinedParts.wta]
          .filter(Boolean)
          .join("\n\n");
      }

      // If the array contains an object with hook, bridge, etc., use those
      if (firstElement && typeof firstElement === "object" && firstElement.hook) {
        const { hook, bridge, goldenNugget, golden_nugget, wta, cta } = firstElement;
        const nugget = goldenNugget || golden_nugget;
        const action = wta || cta;
        return [hook, bridge, nugget, action].filter(Boolean).join("\n\n");
      }

      // If the array contains objects with segment and content properties, extract content
      if (firstElement && typeof firstElement === "object" && firstElement.segment && firstElement.content) {
        return elements
          .map((element) => element.content)
          .filter(Boolean)
          .join("\n\n");
      }

      // If it's just an array of strings, join them
      return elements.filter(Boolean).join("\n\n");
    }

    // Handle normal object structure
    if (elements && typeof elements === "object" && !Array.isArray(elements)) {
      // Handle both camelCase and snake_case field names, and both 'wta' and 'cta'
      const hook = elements.hook;
      const bridge = elements.bridge;
      const goldenNugget = elements.goldenNugget || elements.golden_nugget;
      const wta = elements.wta || elements.cta;

      // Log if any required field is missing
      if (!hook || !bridge || !goldenNugget || !wta) {
        console.warn(`🔍 [ScriptGeneration] Missing script elements:`, {
          hasHook: !!hook,
          hasBridge: !!bridge,
          hasGoldenNugget: !!goldenNugget,
          hasWta: !!wta,
          elements,
        });
      }

      return [hook, bridge, goldenNugget, wta].filter(Boolean).join("\n\n");
    }
    console.warn(`🔍 [ScriptGeneration] Unknown elements format:`, elements);
    return "";
  }

  private countWords(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}

// Export singleton instance
export const scriptGenerationService = ScriptGenerationService.getInstance();

// Convenience functions for backward compatibility
export async function generateScript(input: ScriptGenerationInput): Promise<ScriptGenerationResult> {
  return scriptGenerationService.generateScript(input);
}

export async function generateScriptOptions(input: ScriptGenerationInput): Promise<ScriptOptionsResult> {
  return scriptGenerationService.generateOptions(input);
}

// Legacy compatibility layer for existing ScriptService API
export class ScriptService {
  static async generate(
    type: "speed" | "educational" | "voice",
    input: { idea: string; length: "20" | "60" | "90"; userId: string },
  ): Promise<ScriptGenerationResult> {
    // Map legacy 'voice' type to 'viral' for now
    const mappedType = type === "voice" ? "viral" : type;

    return scriptGenerationService.generateScript({
      idea: input.idea,
      length: input.length,
      userId: input.userId,
      type: mappedType,
    });
  }

  static async generateOptions(input: {
    idea: string;
    length: "20" | "60" | "90";
    userId: string;
  }): Promise<ScriptOptionsResult> {
    return scriptGenerationService.generateOptions({
      idea: input.idea,
      length: input.length,
      userId: input.userId,
    });
  }
}
