import { EducationalEngine } from "./engines/educational";
import { SpeedEngine } from "./engines/speed";
import type { ScriptInput } from "./engines/speed";
import { VoiceEngine } from "./engines/voice";
import type { VoiceScriptResult } from "./engines/voice";

export type ScriptType = "speed" | "educational" | "voice";

export interface ScriptServiceResult {
  success: boolean;
  content: string;
  elements?: {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  };
  voice?: {
    id: string;
    name: string;
    badges: string[];
  };
  error?: string;
}

export const ScriptService = {
  /**
   * Generates a script using the specified engine type
   * @param type - The type of script to generate
   * @param input - The script input parameters
   * @returns Promise resolving to the generated script
   */
  async generate(type: ScriptType, input: ScriptInput): Promise<ScriptServiceResult> {
    const engineMap: Record<ScriptType, typeof SpeedEngine | typeof EducationalEngine | typeof VoiceEngine> = {
      speed: SpeedEngine,
      educational: EducationalEngine,
      voice: VoiceEngine,
    };

    const Engine = engineMap[type];
    if (!Engine) {
      throw new Error(`Unknown script type: ${type}`);
    }

    try {
      const engine = new Engine(input);
      const result = await engine.generate();

      // Handle voice-specific results
      if (type === "voice") {
        const voiceResult = result as VoiceScriptResult;
        return {
          success: voiceResult.success,
          content: voiceResult.content,
          elements: voiceResult.elements,
          voice: voiceResult.voice,
          error: voiceResult.error,
        };
      }

      // Handle standard results
      return {
        success: result.success,
        content: result.content,
        elements: result.elements,
        error: result.error,
      };
    } catch (error) {
      console.error(`[ScriptService] ${type} script generation failed:`, error);
      throw error;
    }
  },

  /**
   * Generates multiple script options (A/B testing)
   * @param input - The script input parameters
   * @returns Promise resolving to two script options
   */
  async generateOptions(input: ScriptInput): Promise<{
    optionA: ScriptServiceResult | null;
    optionB: ScriptServiceResult | null;
  }> {
    try {
      // Generate speed and educational scripts in parallel
      const [speedResult, educationalResult] = await Promise.allSettled([
        this.generate("speed", input),
        this.generate("educational", input),
      ]);

      // Try to generate voice script if speed or educational failed
      let voiceResult: ScriptServiceResult | null = null;
      if (speedResult.status === "rejected" || educationalResult.status === "rejected") {
        try {
          voiceResult = await this.generate("voice", input);
        } catch (error) {
          console.warn("[ScriptService] Voice script generation failed:", error);
        }
      }

      // Create option A (speed or voice fallback)
      const optionA = speedResult.status === "fulfilled" ? speedResult.value : voiceResult;

      // Create option B (educational or voice fallback)
      const optionB =
        educationalResult.status === "fulfilled"
          ? educationalResult.value
          : voiceResult && optionA !== voiceResult
            ? voiceResult
            : null;

      return { optionA, optionB };
    } catch (error) {
      console.error("[ScriptService] Failed to generate script options:", error);
      throw error;
    }
  },
};
