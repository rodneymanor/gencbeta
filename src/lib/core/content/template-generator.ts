/**
 * Template Generator Service
 * Centralized script generation and template processing
 */

import { adminDb } from "@/lib/firebase-admin";
import { generateScript } from "@/lib/gemini";
import { parseStructuredResponse, createScriptElements, combineScriptElements } from "@/lib/json-extractor";
import { generateScriptWithValidation, validateScript, cleanScriptContent } from "@/lib/script-validation";
import { createSpeedWritePrompt, createAIVoicePrompt } from "@/lib/prompt-helpers";
import { createNegativeKeywordPromptInstruction } from "@/data/negative-keywords";
import { getEffectiveNegativeKeywordsForUser } from "@/lib/core/content";
import { VoiceTemplateProcessor } from "@/lib/core/content";
import { AIVoice } from "@/types/ai-voices";

export interface ScriptGenerationResult {
  success: boolean;
  content: string;
  elements?: {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  };
  tokensUsed: number;
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
  error?: string;
}

/**
 * Generates a speed write script using the content service
 */
export async function generateSpeedWriteScript(idea: string, length: string, userId: string): Promise<ScriptGenerationResult> {
  const targetWords = Math.round(parseInt(length) * 2.2);

  // Get user's negative keywords
  const negativeKeywords = await getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

  const prompt = createSpeedWritePrompt(idea, length, targetWords, negativeKeywordInstruction);

  try {
    // Generate with JSON response type and validation
    const result = await generateScriptWithValidation(
      () => generateScript(prompt, { responseType: "json" }),
      (result) => result.content ?? "",
      { maxRetries: 2, retryDelay: 500 }
    );

    const rawContent = result.content ?? "";

    // Use bulletproof JSON extraction
    const parseResult = parseStructuredResponse(rawContent, "Speed Write");
    
    if (!parseResult.success) {
      console.warn("[TemplateGenerator] Speed Write JSON parsing failed, falling back to plain text");
      const cleanedContent = cleanScriptContent(rawContent);
      const elements = { hook: "", bridge: "", goldenNugget: "", wta: cleanedContent };
      const fullContent = combineScriptElements(elements);
      
      return {
        success: false,
        content: fullContent,
        elements,
        tokensUsed: result.tokensUsed || 0,
        error: parseResult.error
      };
    }

    const elements = createScriptElements(parseResult.data);
    const fullContent = combineScriptElements(elements);

    // Validate the combined content
    const validation = validateScript(fullContent);
    if (!validation.isValid) {
      console.warn(`⚠️ [TemplateGenerator] Speed Write script has validation issues:`, validation.issues);
    }

    return {
      success: true,
      content: fullContent,
      elements,
      tokensUsed: result.tokensUsed || 0
    };
  } catch (error) {
    console.error("[TemplateGenerator] Speed Write script generation failed:", error);
    throw error;
  }
}

/**
 * Generates an educational script using the content service
 */
export async function generateEducationalScript(idea: string, length: string, userId: string): Promise<ScriptGenerationResult> {
  const targetWords = Math.round(parseInt(length) * 2.2);

  // Get user's negative keywords
  const negativeKeywords = await getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

  const prompt = `Write a complete, ready-to-read video script for an educational video about the topic below. This is the exact script the creator will read out loud.

IMPORTANT: Write the complete script with actual words, not descriptions or instructions. The output should be the finished script ready to record. Do not include any placeholder text in square brackets [like this].

Target Length: ${length} seconds (~${targetWords} words)

Script Structure:
1. Strong opening hook
2. Explain the core problem or challenge
3. Present your solution with specific steps or examples
4. End with clear value or call to action

Tone: Conversational, confident, and helpful. Use "you" frequently. Keep sentences short and punchy.

Video Topic: ${idea}${negativeKeywordInstruction}

Write the complete script now:`;

  try {
    const result = await generateScriptWithValidation(
      () => generateScript(prompt),
      (result) => result.content ?? "",
      { maxRetries: 2, retryDelay: 500 }
    );

    const cleanedContent = cleanScriptContent(result.content ?? "");
    return {
      success: true,
      content: cleanedContent,
      tokensUsed: result.tokensUsed || 0
    };
  } catch (error) {
    console.error("[TemplateGenerator] Educational script generation failed:", error);
    throw error;
  }
}

/**
 * Generates an AI voice script using the content service
 */
export async function generateAIVoiceScript(idea: string, length: string, userId: string): Promise<ScriptGenerationResult> {
  // Get user's active voice
  const activeVoice = await getActiveVoice(userId);
  if (!activeVoice) {
    return {
      success: false,
      content: "No active AI voice found",
      tokensUsed: 0,
      error: "No active AI voice configured"
    };
  }

  // Get user's negative keywords
  const negativeKeywords = await getEffectiveNegativeKeywordsForUser(userId);
  const negativeKeywordInstruction = createNegativeKeywordPromptInstruction(negativeKeywords);

  const randomTemplate = activeVoice.templates[Math.floor(Math.random() * activeVoice.templates.length)];
  const targetWordCount = VoiceTemplateProcessor.calculateTargetWordCount(randomTemplate, parseInt(length));

  const prompt = createAIVoicePrompt(
    idea,
    length,
    targetWordCount,
    randomTemplate.hook,
    randomTemplate.bridge,
    randomTemplate.nugget,
    randomTemplate.wta,
    negativeKeywordInstruction
  );

  try {
    // Generate with JSON response type for clean output
    const result = await generateScript(prompt, { responseType: "json" });
    const rawContent = result.content ?? "";

    // Use bulletproof JSON extraction
    const parseResult = parseStructuredResponse(rawContent, "AI Voice");
    
    if (!parseResult.success) {
      console.warn("[TemplateGenerator] AI Voice JSON parsing failed, falling back to plain text");
      const cleanedContent = cleanScriptContent(rawContent);
      const elements = { hook: "", bridge: "", goldenNugget: "", wta: cleanedContent };
      const fullContent = combineScriptElements(elements);
      
      return {
        success: false,
        content: fullContent,
        elements,
        tokensUsed: result.tokensUsed || 0,
        voice: { id: activeVoice.id, name: activeVoice.name, badges: activeVoice.badges },
        error: parseResult.error
      };
    }

    const elements = createScriptElements(parseResult.data);
    const fullContent = combineScriptElements(elements);

    // Validate the combined content
    const validation = validateScript(fullContent);
    if (!validation.isValid) {
      console.warn(`⚠️ [TemplateGenerator] AI Voice script has validation issues:`, validation.issues);
    }

    return {
      success: true,
      content: fullContent,
      elements,
      tokensUsed: result.tokensUsed || 0,
      voice: { id: activeVoice.id, name: activeVoice.name, badges: activeVoice.badges }
    };
  } catch (error) {
    console.error("[TemplateGenerator] AI Voice script generation failed:", error);
    throw error;
  }
}

/**
 * Gets the user's active AI voice
 */
async function getActiveVoice(userId: string): Promise<AIVoice | null> {
  try {
    // Get user's active voice
    const voicesSnapshot = await adminDb
      .collection("aiVoices")
      .where("userId", "==", userId)
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
    console.warn("[TemplateGenerator] Failed to fetch active voice:", error);
    return null;
  }
} 