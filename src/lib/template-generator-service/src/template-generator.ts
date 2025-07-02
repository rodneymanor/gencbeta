import { GeminiClient } from "./gemini-client";
import { TEMPLATE_GENERATION_PROMPTS } from "./prompts";
import { MarketingSegments, ScriptTemplate, TemplateResult, TemplateInput, BatchTemplateResult } from "./types";

export class TemplateGenerator {
  private geminiClient: GeminiClient;

  constructor(apiKey?: string) {
    this.geminiClient = new GeminiClient(apiKey);
  }

  /**
   * Generate templates from marketing segments (direct input)
   */
  async generateTemplatesFromSegments(segments: MarketingSegments): Promise<TemplateResult> {
    const startTime = Date.now();

    try {
      console.log("[TemplateGenerator] Generating templates from marketing segments");

      // Validate input
      if (!this.validateMarketingSegments(segments)) {
        throw new Error("Invalid marketing segments. All segments must be non-empty strings.");
      }

      // Create templates for each segment
      const [hookResult, bridgeResult, nuggetResult, wtaResult] = await Promise.all([
        this.createTemplateFromComponent(segments.Hook, "hook"),
        this.createTemplateFromComponent(segments.Bridge, "bridge"),
        this.createTemplateFromComponent(segments["Golden Nugget"], "nugget"),
        this.createTemplateFromComponent(segments.WTA, "wta"),
      ]);

      // Check if all templates were created successfully
      if (!hookResult.success || !bridgeResult.success || !nuggetResult.success || !wtaResult.success) {
        const errors = [
          hookResult.error && `Hook: ${hookResult.error}`,
          bridgeResult.error && `Bridge: ${bridgeResult.error}`,
          nuggetResult.error && `Nugget: ${nuggetResult.error}`,
          wtaResult.error && `WTA: ${wtaResult.error}`,
        ]
          .filter(Boolean)
          .join("; ");

        throw new Error(`Template generation failed: ${errors}`);
      }

      const template: ScriptTemplate = {
        hook: hookResult.template!,
        bridge: bridgeResult.template!,
        nugget: nuggetResult.template!,
        wta: wtaResult.template!,
      };

      // Collect all placeholders
      const allPlaceholders = [
        ...(hookResult.placeholders || []),
        ...(bridgeResult.placeholders || []),
        ...(nuggetResult.placeholders || []),
        ...(wtaResult.placeholders || []),
      ];

      const processingTime = Date.now() - startTime;
      console.log(`[TemplateGenerator] Successfully generated all templates in ${processingTime}ms`);

      return {
        success: true,
        templates: template,
        originalContent: segments,
        processingTime,
        metadata: {
          inputType: "marketing_segments",
          templatesGenerated: 4,
          placeholdersIdentified: [...new Set(allPlaceholders)], // Remove duplicates
          processingMode: "parallel",
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("[TemplateGenerator] Failed to generate templates:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
      };
    }
  }

  /**
   * Generate templates from raw transcription (auto-analyze first)
   */
  async generateTemplatesFromTranscription(transcription: string): Promise<TemplateResult> {
    const startTime = Date.now();

    try {
      console.log("[TemplateGenerator] Analyzing transcription and generating templates");

      // Validate input
      if (!transcription || transcription.trim().length === 0) {
        throw new Error("Transcription text is required and cannot be empty.");
      }

      // Step 1: Analyze transcription to extract marketing segments
      console.log("[TemplateGenerator] Step 1: Extracting marketing segments from transcription");
      const analysisResult = await this.analyzeTranscription(transcription);

      if (!analysisResult.success || !analysisResult.segments) {
        throw new Error(`Failed to analyze transcription: ${analysisResult.error}`);
      }

      // Step 2: Generate templates from the extracted segments
      console.log("[TemplateGenerator] Step 2: Generating templates from extracted segments");
      const templateResult = await this.generateTemplatesFromSegments(analysisResult.segments);

      if (!templateResult.success) {
        throw new Error(`Failed to generate templates: ${templateResult.error}`);
      }

      const processingTime = Date.now() - startTime;
      console.log(`[TemplateGenerator] Successfully processed transcription in ${processingTime}ms`);

      return {
        ...templateResult,
        processingTime,
        metadata: {
          inputType: "transcription",
          templatesGenerated: templateResult.metadata?.templatesGenerated || 4,
          placeholdersIdentified: templateResult.metadata?.placeholdersIdentified || [],
          processingMode: "two_step",
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error("[TemplateGenerator] Failed to process transcription:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
      };
    }
  }

  /**
   * Batch process multiple inputs
   */
  async batchGenerateTemplates(inputs: TemplateInput[]): Promise<BatchTemplateResult> {
    const startTime = Date.now();

    try {
      console.log(`[TemplateGenerator] Starting batch processing of ${inputs.length} inputs`);

      if (!inputs || inputs.length === 0) {
        throw new Error("At least one input is required for batch processing.");
      }

      const results: TemplateResult[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      // Process inputs sequentially with rate limiting
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        if (!input) {
          const errorMessage = "Input is undefined";
          console.error(`[TemplateGenerator] Input ${i + 1} is undefined`);
          errors.push({ index: i, error: errorMessage });
          results.push({ success: false, error: errorMessage, processingTime: 0 });
          continue;
        }

        try {
          console.log(`[TemplateGenerator] Processing input ${i + 1}/${inputs.length}`);

          let result: TemplateResult;

          if (input.segments) {
            result = await this.generateTemplatesFromSegments(input.segments);
          } else if (input.transcription) {
            result = await this.generateTemplatesFromTranscription(input.transcription);
          } else {
            throw new Error("Input must contain either segments or transcription");
          }

          results.push(result);

          // Add rate limiting delay between requests (except for the last one)
          if (i < inputs.length - 1) {
            await GeminiClient.delay(this.geminiClient.getRateLimitDelay());
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`[TemplateGenerator] Failed to process input ${i + 1}:`, errorMessage);

          errors.push({
            index: i,
            error: errorMessage,
          });

          // Add failed result to maintain order
          results.push({
            success: false,
            error: errorMessage,
            processingTime: 0,
          });
        }
      }

      const totalProcessingTime = Date.now() - startTime;
      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;
      const averageProcessingTime = results.length > 0 ? Math.round(totalProcessingTime / results.length) : 0;

      console.log(`[TemplateGenerator] Batch processing completed: ${successful} successful, ${failed} failed`);

      const result: BatchTemplateResult = {
        success: successful > 0,
        results,
        summary: {
          totalProcessed: results.length,
          successful,
          failed,
          totalProcessingTime,
          averageProcessingTime,
        },
      };

      if (errors.length > 0) {
        result.errors = errors;
      }

      return result;
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      console.error("[TemplateGenerator] Batch processing failed:", error);

      return {
        success: false,
        results: [],
        summary: {
          totalProcessed: 0,
          successful: 0,
          failed: inputs.length,
          totalProcessingTime,
          averageProcessingTime: 0,
        },
        errors: [
          {
            index: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  }

  /**
   * Convert a specific marketing segment into a generic template
   */
  private async createTemplateFromComponent(
    componentText: string,
    componentType: "hook" | "bridge" | "nugget" | "wta",
  ): Promise<{ success: boolean; template?: string; placeholders?: string[]; error?: string }> {
    const startTime = Date.now();

    try {
      console.log(`[TemplateGenerator] Creating template for ${componentType}: ${componentText.substring(0, 100)}...`);

      const prompt = TEMPLATE_GENERATION_PROMPTS.createTemplateFromComponent(componentText, componentType);
      const response = await this.geminiClient.makeTextRequest(prompt);

      // Parse the JSON response
      const parsedResponse = GeminiClient.parseJsonResponse(response.text);

      if (!parsedResponse.template) {
        throw new Error("No template found in API response");
      }

      const processingTime = Date.now() - startTime;
      console.log(`[TemplateGenerator] Template created for ${componentType} in ${processingTime}ms`);

      return {
        success: true,
        template: parsedResponse.template,
        placeholders: parsedResponse.placeholders || [],
      };
    } catch (error) {
      console.error(`[TemplateGenerator] Failed to create template for ${componentType}:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Analyze raw transcription to extract marketing segments
   */
  private async analyzeTranscription(
    transcription: string,
  ): Promise<{ success: boolean; segments?: MarketingSegments; error?: string }> {
    try {
      console.log("[TemplateGenerator] Analyzing transcription for marketing segments");

      const prompt = TEMPLATE_GENERATION_PROMPTS.analyzeTranscription(transcription);
      const response = await this.geminiClient.makeTextRequest(prompt);

      // Parse the JSON response
      const parsedResponse = GeminiClient.parseJsonResponse(response.text);

      if (!parsedResponse.marketingSegments) {
        throw new Error("No marketing segments found in API response");
      }

      const segments = parsedResponse.marketingSegments;

      // Validate segments
      if (!this.validateMarketingSegments(segments)) {
        throw new Error("Invalid marketing segments structure in API response");
      }

      console.log("[TemplateGenerator] Successfully extracted marketing segments");

      return {
        success: true,
        segments,
      };
    } catch (error) {
      console.error("[TemplateGenerator] Failed to analyze transcription:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Validate marketing segments structure
   */
  private validateMarketingSegments(segments: any): segments is MarketingSegments {
    return (
      segments &&
      typeof segments.Hook === "string" &&
      segments.Hook.trim().length > 0 &&
      typeof segments.Bridge === "string" &&
      segments.Bridge.trim().length > 0 &&
      typeof segments["Golden Nugget"] === "string" &&
      segments["Golden Nugget"].trim().length > 0 &&
      typeof segments.WTA === "string" &&
      segments.WTA.trim().length > 0
    );
  }
}
