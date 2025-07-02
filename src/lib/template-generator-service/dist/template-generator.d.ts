import { MarketingSegments, TemplateResult, TemplateInput, BatchTemplateResult } from "./types";
export declare class TemplateGenerator {
  private geminiClient;
  constructor(apiKey?: string);
  /**
   * Generate templates from marketing segments (direct input)
   */
  generateTemplatesFromSegments(segments: MarketingSegments): Promise<TemplateResult>;
  /**
   * Generate templates from raw transcription (auto-analyze first)
   */
  generateTemplatesFromTranscription(transcription: string): Promise<TemplateResult>;
  /**
   * Batch process multiple inputs
   */
  batchGenerateTemplates(inputs: TemplateInput[]): Promise<BatchTemplateResult>;
  /**
   * Convert a specific marketing segment into a generic template
   */
  private createTemplateFromComponent;
  /**
   * Analyze raw transcription to extract marketing segments
   */
  private analyzeTranscription;
  /**
   * Validate marketing segments structure
   */
  private validateMarketingSegments;
}
//# sourceMappingURL=template-generator.d.ts.map
