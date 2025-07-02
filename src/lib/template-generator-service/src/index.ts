// Main exports for the template generation service
export { TemplateGenerator } from "./template-generator";
export { GeminiClient } from "./gemini-client";

// Type exports
export type {
  MarketingSegments,
  ScriptTemplate,
  TemplateResult,
  TemplateInput,
  BatchTemplateResult,
  GeminiResponse,
} from "./types";

// Default export for easy importing
import { TemplateGenerator } from "./template-generator";
export default TemplateGenerator;
