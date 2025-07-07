import { GeminiService } from "@/lib/gemini";
import { AIVoice, VoiceTemplate } from "@/types/ai-voices";

export interface VoiceProcessingRequest {
  sourceContent: string;
  voiceTemplate: VoiceTemplate;
  targetWordCount?: number;
}

export interface VoiceProcessingResult {
  success: boolean;
  script?: string;
  error?: string;
  metadata?: {
    templateUsed: string;
    wordCount: number;
    processingTime: number;
  };
}

export class VoiceTemplateProcessor {
  /**
   * Process source content through voice template using sophisticated prompt system
   */
  static async processContent(request: VoiceProcessingRequest): Promise<VoiceProcessingResult> {
    const startTime = Date.now();

    try {
      console.log("🎯 [VoiceProcessor] Processing content through voice template");
      console.log("📝 [VoiceProcessor] Source content:", request.sourceContent.substring(0, 100) + "...");
      console.log("🎤 [VoiceProcessor] Template ID:", request.voiceTemplate.id);

      const prompt = this.buildUniversalVoicePrompt(request);

      const result = await GeminiService.generateContent({
        prompt,
        maxTokens: 600,
        temperature: 0.7,
      });

      if (!result.success) {
        throw new Error(result.error ?? "Failed to process content through voice template");
      }

      const script = result.content!.trim();
      const wordCount = script.split(/\s+/).length;
      const processingTime = Date.now() - startTime;

      console.log(`✅ [VoiceProcessor] Generated script: ${wordCount} words in ${processingTime}ms`);

      return {
        success: true,
        script,
        metadata: {
          templateUsed: request.voiceTemplate.id,
          wordCount,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("❌ [VoiceProcessor] Failed to process content:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          templateUsed: request.voiceTemplate.id,
          wordCount: 0,
          processingTime,
        },
      };
    }
  }

  /**
   * Build the sophisticated universal voice prompt
   */
  private static buildUniversalVoicePrompt(request: VoiceProcessingRequest): string {
    const { sourceContent, voiceTemplate, targetWordCount = 150 } = request;

    return `ROLE:
You are an expert content strategist and copywriter. Your primary skill is deconstructing information and skillfully reassembling it into a different, predefined narrative or structural framework.

OBJECTIVE:
Your task is to take the [1. Source Content] and rewrite it so that it perfectly fits the structure, tone, and cadence of the [2. Structural Template]. The goal is to produce a new, seamless piece of content that accomplishes the goal of the Source Content while flawlessly embodying the style of the Structural Template.

PRIMARY CONSTRAINT:
The final output must adhere closely to the provided template. The deviation from the template's core structure and language should be minimal, ideally less than 15%. The new content should feel as though it was originally created for this specific format.

[1. SOURCE CONTENT - The "What"]
(This is the information you want to communicate.)

${sourceContent}

[2. STRUCTURAL TEMPLATE - The "How"]
(This is the format, style, and narrative structure you want to follow.)

Hook: ${voiceTemplate.hook}

Bridge: ${voiceTemplate.bridge}

Golden Nugget: ${voiceTemplate.nugget}

What To Act: ${voiceTemplate.wta}

Execution Instructions for AI:
Your task is to adapt my source content into a script using the provided template. Follow these instructions precisely to ensure a high-quality, coherent, and effective result.

1. Analyze and Deconstruct
First, thoroughly analyze the chosen template's components (hook, bridge, nugget, wta). Identify its core narrative function (e.g., is it a personal story, a persuasion framework, a step-by-step guide, or a philosophical lesson?). Concurrently, analyze the core components of my source content to identify the main problem, solution, key facts, and central message.

2. Interpret and Map Concepts
Your primary goal is to logically map the key ideas from my source content onto the [placeholders] in the template. Do not perform a literal word replacement; interpret the contextual meaning of each placeholder (e.g., [Negative Consequence], [Desired Outcome]) and fill it with the most fitting concept from my source material.

3. Adopt the Narrative Voice
You must adopt the specific tone and narrative voice implied by the template's structure and language. If the template is written in the first person, your script should be too. If it is authoritative, your tone should be confident. The final output must feel authentic to the template's style.

4. Ensure Cohesion and Flow
Assemble the filled hook, bridge, nugget, and wta sections into a single, seamless script. The transition from one section to the next must be smooth and natural. The final script should not sound like a form that has been filled out, but like a story or argument that flows logically from beginning to end.

5. Format the Final Output
Present the final, complete script as a single block of text.

Do not use labels like hook:, bridge:, etc. in your final answer.

Separate the content generated for each section (hook, bridge, nugget, and wta) with a single line break.

The output must be a clean script, ready to be copied and pasted.

Target approximately ${targetWordCount} words for a one-minute read.`;
  }

  /**
   * Select a random template from available voice templates
   */
  static selectRandomTemplate(voice: AIVoice): VoiceTemplate | null {
    if (!voice.templates || voice.templates.length === 0) {
      console.warn("❌ [VoiceProcessor] No templates available for voice:", voice.name);
      return null;
    }

    const randomIndex = Math.floor(Math.random() * voice.templates.length);
    const selectedTemplate = voice.templates[randomIndex];

    console.log(
      `🎲 [VoiceProcessor] Selected random template ${randomIndex + 1}/${voice.templates.length} for voice: ${voice.name}`,
    );

    return selectedTemplate;
  }

  /**
   * Calculate target word count based on voice template characteristics
   */
  static calculateTargetWordCount(template: VoiceTemplate, baseDuration: number = 60): number {
    // Base calculation: ~2.2-2.5 words per second for natural speech
    let wordsPerSecond = 2.3;

    // Adjust based on template characteristics
    const templateText = `${template.hook} ${template.bridge} ${template.nugget} ${template.wta}`;

    // If template has shorter sentences, increase pace
    const avgSentenceLength =
      templateText.split(/[.!?]/).reduce((acc, sentence) => {
        return acc + sentence.trim().split(/\s+/).length;
      }, 0) / templateText.split(/[.!?]/).length;

    if (avgSentenceLength < 8) {
      wordsPerSecond = 2.5; // Faster for punchy templates
    } else if (avgSentenceLength > 15) {
      wordsPerSecond = 2.0; // Slower for complex templates
    }

    const targetWords = Math.round(baseDuration * wordsPerSecond);

    console.log(
      `📊 [VoiceProcessor] Calculated target: ${targetWords} words for ${baseDuration}s (${wordsPerSecond} wps)`,
    );

    return targetWords;
  }
}
