import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";
import { generateScript } from "@/lib/gemini";
import { parseStructuredResponse, createScriptElements, combineScriptElements } from "@/lib/json-extractor";
import { NegativeKeywordsService } from "@/lib/negative-keywords-service";
import { generateScriptWithValidation, validateScript, cleanScriptContent } from "@/lib/script-validation";

import type { ScriptInput, ScriptResult } from "./speed";

export class EducationalEngine {
  constructor(private input: ScriptInput) {}

  async generate(): Promise<ScriptResult> {
    const targetWords = Math.round(parseInt(this.input.length) * 2.2);

    // Get user's negative keywords
    const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(this.input.userId);
    const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

    const prompt = this.createEducationalPrompt(targetWords, negativeKeywordInstruction);

    try {
      // Generate with JSON response type and validation
      const result = await generateScriptWithValidation(
        () => generateScript(prompt, { responseType: "json" }),
        (result) => result.content ?? "",
        { maxRetries: 2, retryDelay: 500 },
      );

      const rawContent = result.content ?? "";

      // Use bulletproof JSON extraction
      const parseResult = parseStructuredResponse(rawContent, "Educational");

      if (!parseResult.success) {
        console.warn("[EducationalEngine] JSON parsing failed, falling back to plain text");
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
        console.warn(`⚠️ [EducationalEngine] Script has validation issues:`, validation.issues);
      }

      return {
        success: true,
        content: fullContent,
        elements,
      };
    } catch (error) {
      console.error("[EducationalEngine] Script generation failed:", error);
      throw error;
    }
  }

  private createEducationalPrompt(targetWords: number, negativeKeywordInstruction: string): string {
    return `ROLE:
You are an expert educator and content strategist specializing in creating educational content that teaches complex concepts in simple, engaging ways.

OBJECTIVE:
Transform the given idea into an educational script that teaches viewers something valuable while maintaining high engagement.

CONTENT STRUCTURE:
Your script must follow this exact structure with clear sections:

1. HOOK (Attention-Grabbing Opener): Start with a compelling question, surprising fact, or relatable scenario that immediately captures attention
2. BRIDGE (Connecting the Hook to the Core Idea): Smoothly transition from the hook to the main educational content
3. GOLDEN NUGGET (The Core Lesson): The main educational value - teach the key concept, strategy, or insight
4. WTA (What To Act - Call to Action): End with a clear call to action or next step for viewers

SCRIPT REQUIREMENTS:
- Target approximately ${targetWords} words for a ${this.input.length}-second read
- Use conversational, engaging language
- Include specific examples or analogies
- Make complex concepts accessible
- End with a clear takeaway or action step

${negativeKeywordInstruction}

Return your response in this exact JSON format:
{
  "hook": "Your attention-grabbing opening (3-5 seconds worth)",
  "bridge": "Your smooth transition connecting hook to main content",
  "goldenNugget": "Your main educational lesson or insight",
  "wta": "Your call to action or concluding thought"
}

SOURCE IDEA: ${this.input.idea}

FINAL CHECK: Ensure your response is ONLY valid JSON with no additional text.`;
  }
}
