import { GeminiService } from "@/lib/gemini";
import { BrandQuestionnaire } from "@/types/brand-profile";

export interface PEQData {
  problems: string[];
  excuses: string[];
  questions: string[];
}

export interface PEQExtractionResult {
  success: boolean;
  data?: PEQData;
  error?: string;
}

export class PEQExtractionService {
  /**
   * Extract Problems, Excuses, and Questions from brand profile questionnaire
   */
  static async extractPEQ(questionnaire: BrandQuestionnaire): Promise<PEQExtractionResult> {
    try {
      console.log("🔍 [PEQ] Extracting Problems, Excuses, Questions from brand profile");

      const prompt = this.buildPEQExtractionPrompt(questionnaire);

      const result = await GeminiService.generateContent({
        prompt,
        maxTokens: 1000,
        temperature: 0.7,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to generate PEQ data");
      }

      const text = result.content!;
      console.log("🤖 [PEQ] Raw AI response:", text);

      // Parse the JSON response
      let parsedPEQ: PEQData;
      try {
        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("❌ [PEQ] No JSON found in AI response");
          throw new Error("No JSON found in response");
        }

        console.log("🔍 [PEQ] Extracted JSON:", jsonMatch[0]);
        parsedPEQ = JSON.parse(jsonMatch[0]);
        console.log("✅ [PEQ] Parsed PEQ data:", JSON.stringify(parsedPEQ, null, 2));
      } catch (parseError) {
        console.error("❌ [PEQ] Failed to parse AI response:", parseError);
        console.error("❌ [PEQ] Raw text was:", text);
        throw new Error("Failed to parse AI response");
      }

      // Validate the structure
      if (!parsedPEQ.problems || !parsedPEQ.excuses || !parsedPEQ.questions) {
        throw new Error("Invalid PEQ structure - missing required fields");
      }

      console.log(
        `✅ [PEQ] Successfully extracted ${parsedPEQ.problems.length} problems, ${parsedPEQ.excuses.length} excuses, ${parsedPEQ.questions.length} questions`,
      );

      return {
        success: true,
        data: parsedPEQ,
      };
    } catch (error) {
      console.error("❌ [PEQ] Failed to extract PEQ data:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build the AI prompt for PEQ extraction
   */
  private static buildPEQExtractionPrompt(questionnaire: BrandQuestionnaire): string {
    return `You are an expert content strategist specializing in audience psychology and pain point analysis. 

Your task is to analyze the brand questionnaire responses below and extract specific Problems, Excuses, and Questions (PEQ) that the target audience experiences.

BRAND QUESTIONNAIRE RESPONSES:
- Profession/Business: ${questionnaire.profession}
- Brand Personality: ${questionnaire.brandPersonality}
- Universal Problem: ${questionnaire.universalProblem}
- Initial Hurdle: ${questionnaire.initialHurdle}
- Persistent Struggle: ${questionnaire.persistentStruggle}
- Visible Triumph: ${questionnaire.visibleTriumph}
- Ultimate Transformation: ${questionnaire.ultimateTransformation}

EXTRACTION REQUIREMENTS:

1. **PROBLEMS** (5-7 items): Specific pain points, challenges, and frustrations the audience faces. These should be actionable problems that content can address.

2. **EXCUSES** (4-6 items): Common justifications, rationalizations, and mental barriers that prevent the audience from taking action or solving their problems.

3. **QUESTIONS** (5-7 items): Direct questions the audience asks themselves or others about their situation, goals, and potential solutions.

CRITICAL OUTPUT REQUIREMENT: 
Your response must start IMMEDIATELY with the opening brace { and contain NOTHING else except the JSON object.

Expected JSON format:
{
  "problems": [
    "Specific problem statement 1",
    "Specific problem statement 2",
    "..."
  ],
  "excuses": [
    "Common excuse or barrier 1",
    "Common excuse or barrier 2", 
    "..."
  ],
  "questions": [
    "Direct question the audience asks 1",
    "Direct question the audience asks 2",
    "..."
  ]
}

GUIDELINES:
- Make each item specific and actionable
- Use the audience's voice and language
- Focus on emotional and practical aspects
- Ensure variety in complexity and scope
- Keep items concise but meaningful (10-15 words each)

FINAL REMINDER: Your response must be PURE JSON starting with { and ending with }. No other text whatsoever.`;
  }
}
