import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";
import { generateScript } from "@/lib/gemini";
import { parseStructuredResponse, createScriptElements, combineScriptElements } from "@/lib/json-extractor";
import { NegativeKeywordsService } from "@/lib/negative-keywords-service";
import { createSpeedWritePrompt } from "@/lib/prompt-helpers";
import { generateScriptWithValidation, validateScript, cleanScriptContent } from "@/lib/script-validation";

export interface ScriptInput {
  idea: string;
  length: "20" | "60" | "90";
  userId: string;
}

export interface ScriptResult {
  success: boolean;
  content: string;
  elements?: {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  };
  error?: string;
}

export class SpeedEngine {
  constructor(private input: ScriptInput) {}

  async generate(): Promise<ScriptResult> {
    const targetWords = Math.round(parseInt(this.input.length) * 2.2);

    // Get user's negative keywords
    const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(this.input.userId);
    const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

    const prompt = createSpeedWritePrompt(this.input.idea, this.input.length, targetWords, negativeKeywordInstruction);

    try {
      // Generate with JSON response type and validation
      const result = await generateScriptWithValidation(
        () => generateScript(prompt, { responseType: "json" }),
        (result) => result.content ?? "",
        { maxRetries: 2, retryDelay: 500 },
      );

      const rawContent = result.content ?? "";

      // Use bulletproof JSON extraction
      const parseResult = parseStructuredResponse(rawContent, "Speed Write");

      if (!parseResult.success) {
        console.warn("[SpeedEngine] JSON parsing failed, falling back to plain text");
        const cleanedContent = cleanScriptContent(rawContent);
        const elements = { hook: "", bridge: "", goldenNugget: "", wta: cleanedContent };
        const fullContent = combineScriptElements(elements);

        return {
          success: false,
          content: fullContent,
          elements,
          error: parseResult.error,
        };
      }

      const elements = createScriptElements(parseResult.data);
      const fullContent = combineScriptElements(elements);

      // Validate the combined content
      const validation = validateScript(fullContent);
      if (!validation.isValid) {
        console.warn(`⚠️ [SpeedEngine] Script has validation issues:`, validation.issues);
      }

      return {
        success: true,
        content: fullContent,
        elements,
      };
    } catch (error) {
      console.error("[SpeedEngine] Script generation failed:", error);
      throw error;
    }
  }
}
