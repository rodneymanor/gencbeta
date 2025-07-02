export interface MarketingSegments {
  Hook: string;
  Bridge: string;
  "Golden Nugget": string;
  WTA: string;
}

export interface ScriptTemplate {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface TemplateResult {
  success: boolean;
  templates?: ScriptTemplate;
  originalContent?: MarketingSegments;
  error?: string;
  processingTime: number;
  metadata?: {
    inputType: "marketing_segments" | "transcription";
    templatesGenerated: number;
    placeholdersIdentified: string[];
    processingMode: string;
  };
}

export interface TemplateInput {
  segments?: MarketingSegments;
  transcription?: string;
  topic?: string; // Optional topic for context
}

export interface BatchTemplateResult {
  success: boolean;
  results: TemplateResult[];
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
  };
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
