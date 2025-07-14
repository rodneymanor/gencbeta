import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";
import { adminDb } from "@/lib/firebase-admin";
import { generateScript } from "@/lib/gemini";
import { parseStructuredResponse, createScriptElements, combineScriptElements } from "@/lib/json-extractor";
import { NegativeKeywordsService } from "@/lib/negative-keywords-service";
import { createAIVoicePrompt } from "@/lib/prompt-helpers";
import { validateScript, cleanScriptContent } from "@/lib/script-validation";
import { VoiceTemplateProcessor } from "@/lib/voice-template-processor";
import type { AIVoice } from "@/types/ai-voices";

import type { ScriptInput, ScriptResult } from "./speed";

export interface VoiceScriptResult extends ScriptResult {
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
}

export class VoiceEngine {
  constructor(private input: ScriptInput) {}

  async generate(): Promise<VoiceScriptResult> {
    const activeVoice = await this.getActiveVoice();
    if (!activeVoice) {
      throw new Error("No active AI voice found for user");
    }

    const negativeKeywords = await NegativeKeywordsService.getEffectiveNegativeKeywordsForUser(this.input.userId);
    const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

    const randomTemplate = activeVoice.templates[Math.floor(Math.random() * activeVoice.templates.length)];
    const targetWordCount = VoiceTemplateProcessor.calculateTargetWordCount(
      randomTemplate,
      parseInt(this.input.length),
    );

    const prompt = createAIVoicePrompt(
      this.input.idea,
      this.input.length,
      targetWordCount,
      randomTemplate.hook,
      randomTemplate.bridge,
      randomTemplate.nugget,
      randomTemplate.wta,
      negativeKeywordInstruction,
    );

    try {
      // Generate with JSON response type for clean output
      const result = await generateScript(prompt, { responseType: "json" });
      const rawContent = result.content ?? "";

      // Use bulletproof JSON extraction
      const parseResult = parseStructuredResponse(rawContent, "AI Voice");

      if (!parseResult.success) {
        console.warn("[VoiceEngine] JSON parsing failed, falling back to plain text");
        const cleanedContent = cleanScriptContent(rawContent);
        const elements = { hook: "", bridge: "", goldenNugget: "", wta: cleanedContent };
        const fullContent = combineScriptElements(elements);

        return {
          success: false,
          content: fullContent,
          elements,
          voice: { id: activeVoice.id, name: activeVoice.name, badges: activeVoice.badges },
          error: parseResult.error,
        };
      }

      const elements = createScriptElements(parseResult.data);
      const fullContent = combineScriptElements(elements);

      // Validate the combined content
      const validation = validateScript(fullContent);
      if (!validation.isValid) {
        console.warn(`⚠️ [VoiceEngine] Script has validation issues:`, validation.issues);
      }

      return {
        success: true,
        content: fullContent,
        elements,
        voice: { id: activeVoice.id, name: activeVoice.name, badges: activeVoice.badges },
      };
    } catch (error) {
      console.error("[VoiceEngine] Script generation failed:", error);
      throw error;
    }
  }

  private async getActiveVoice(): Promise<AIVoice | null> {
    try {
      // Get user's active voice
      const voicesSnapshot = await adminDb
        .collection("aiVoices")
        .where("userId", "==", this.input.userId)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!voicesSnapshot.empty) {
        const doc = voicesSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AIVoice;
      }

      // Check for shared active voices
      const sharedSnapshot = await adminDb
        .collection("aiVoices")
        .where("isShared", "==", true)
        .where("isActive", "==", true)
        .limit(1)
        .get();

      if (!sharedSnapshot.empty) {
        const doc = sharedSnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AIVoice;
      }

      return null;
    } catch (error) {
      console.warn("[VoiceEngine] Failed to fetch active voice:", error);
      return null;
    }
  }
}
