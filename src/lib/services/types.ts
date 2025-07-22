/**
 * Comprehensive TypeScript interfaces for the modular Gemini AI integration
 * Provides type safety across the entire service architecture
 */

// =============================================================================
// CORE GEMINI SERVICE TYPES
// =============================================================================

export const GEMINI_MODELS = {
  FLASH: "gemini-1.5-flash",
  PRO: "gemini-1.5-pro",
  FLASH_8B: "gemini-1.5-flash-8b",
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

export interface GeminiRequestConfig {
  model?: GeminiModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  responseType?: "text" | "json";
  systemInstruction?: string;
  timeout?: number;
  retries?: number;
}

export interface GeminiRequest extends GeminiRequestConfig {
  prompt: string;
}

export interface GeminiResponse<T = string> {
  success: boolean;
  content?: T;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
  model?: string;
  retryCount?: number;
}

export interface AudioData {
  mimeType: string;
  data: Buffer;
}

// =============================================================================
// PROMPT MANAGEMENT TYPES
// =============================================================================

export interface BasePrompt {
  id: string;
  name: string;
  description: string;
  version: string;
  tags?: string[];
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromptVariables {
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface PromptValidation {
  required?: string[];
  optional?: string[];
  minLength?: { [key: string]: number };
  maxLength?: { [key: string]: number };
  pattern?: { [key: string]: RegExp };
}

export interface JSONSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface PromptConfig {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  model?: GeminiModel;
  responseType?: "text" | "json";
  jsonSchema?: JSONSchema;
  validation?: PromptValidation;
  examples?: Array<{
    input: PromptVariables;
    output: string;
  }>;
}

export interface Prompt extends BasePrompt {
  template: string;
  config: PromptConfig;
}

export interface PromptResult<T = string> {
  success: boolean;
  content?: T;
  error?: string;
  variables?: PromptVariables;
  prompt?: string;
  responseTime?: number;
  tokensUsed?: number;
}

export interface PromptExecutionOptions {
  variables: PromptVariables;
  overrideConfig?: Partial<PromptConfig>;
  validateInput?: boolean;
  parseOutput?: boolean;
}

export interface PromptLibrary {
  [category: string]: {
    [promptId: string]: Prompt;
  };
}

// =============================================================================
// SCRIPT GENERATION TYPES
// =============================================================================

export interface ScriptGenerationInput {
  idea: string;
  length: "20" | "60" | "90";
  userId: string;
  type?: "speed" | "educational" | "viral";
  tone?: "casual" | "professional" | "energetic" | "educational";
  platform?: "tiktok" | "instagram" | "youtube" | "general";
}

export interface SpeedWriteVariables extends PromptVariables {
  idea: string;
  length: "20" | "60" | "90";
  targetWords: number;
  negativeKeywordInstruction?: string;
  tone?: "casual" | "professional" | "energetic" | "educational";
  platform?: "tiktok" | "instagram" | "youtube" | "general";
}

export interface SpeedWriteResult {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

export interface ScriptGenerationMetadata {
  promptId: string;
  model: string;
  tokensUsed?: number;
  responseTime?: number;
  targetWords: number;
  actualWords: number;
  variant?: string;
  negativeKeywordsApplied?: number;
}

export interface ScriptGenerationResult {
  success: boolean;
  content: string;
  elements?: SpeedWriteResult;
  metadata?: ScriptGenerationMetadata;
  error?: string;
}

export interface ScriptOptionsResult {
  optionA: ScriptGenerationResult | null;
  optionB: ScriptGenerationResult | null;
}

// =============================================================================
// CLIENT SERVICE TYPES (React Components)
// =============================================================================

export interface ScriptOption {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: "speed-write" | "educational" | "viral";
  elements?: SpeedWriteResult;
  metadata?: {
    targetWords: number;
    actualWords: number;
    tokensUsed?: number;
    responseTime?: number;
  };
}

export interface SpeedWriteResponse {
  success: boolean;
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

export interface ScriptGenerationRequest {
  idea: string;
  length: "20" | "60" | "90";
  userId?: string;
  type?: "speed" | "educational" | "voice";
}

// =============================================================================
// BATCH PROCESSING TYPES
// =============================================================================

export interface BatchProcessingOptions {
  concurrency?: number;
  failFast?: boolean;
  progressCallback?: (completed: number, total: number) => void;
  errorCallback?: (error: Error, index: number) => void;
}

export interface BatchResult<T> {
  results: T[];
  successCount: number;
  failureCount: number;
  errors: Array<{ index: number; error: string }>;
  totalTime: number;
  averageTime: number;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  retryable?: boolean;
}

export interface ValidationError extends ServiceError {
  field: string;
  value: any;
  constraint: string;
}

export interface ApiError extends ServiceError {
  statusCode: number;
  path: string;
  method: string;
}

// =============================================================================
// PERFORMANCE MONITORING TYPES
// =============================================================================

export interface PerformanceMetrics {
  requestId: string;
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  tokensUsed?: number;
  model?: string;
  success: boolean;
  error?: string;
}

export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  requestCount: number;
  errorRate: number;
  averageResponseTime: number;
  lastError?: ServiceError;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface ServiceConfiguration {
  gemini: {
    apiKey: string;
    defaultModel: GeminiModel;
    timeout: number;
    retries: number;
    rateLimit?: {
      requestsPerMinute: number;
      burstLimit: number;
    };
  };
  prompts: {
    autoInitialize: boolean;
    cacheEnabled: boolean;
    validationEnabled: boolean;
  };
  monitoring: {
    enabled: boolean;
    metricsRetention: number;
    errorTracking: boolean;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type PromptVariant = "standard" | "educational" | "viral" | "custom";
export type ScriptLength = "20" | "60" | "90";
export type ScriptType = "speed" | "educational" | "voice" | "viral";
export type ContentTone = "casual" | "professional" | "energetic" | "educational";
export type SocialPlatform = "tiktok" | "instagram" | "youtube" | "general";

// =============================================================================
// RESPONSE WRAPPER TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// =============================================================================
// LEGACY COMPATIBILITY TYPES
// =============================================================================

// For backward compatibility with existing components
export interface LegacyScriptService {
  generate(
    type: "speed" | "educational" | "voice",
    input: { idea: string; length: "20" | "60" | "90"; userId: string },
  ): Promise<ScriptGenerationResult>;

  generateOptions(input: { idea: string; length: "20" | "60" | "90"; userId: string }): Promise<ScriptOptionsResult>;
}

// =============================================================================
// EXPORT GROUPS FOR CONVENIENCE
// =============================================================================

// Core service types
export type { GeminiModel, GeminiRequestConfig, GeminiRequest, GeminiResponse, AudioData } from "./gemini-service";

// Prompt system types
export type {
  BasePrompt,
  PromptVariables,
  PromptValidation,
  JSONSchema,
  PromptConfig,
  Prompt,
  PromptResult,
  PromptExecutionOptions,
  PromptLibrary,
} from "../prompts/types";

// Script generation types
export { type SpeedWriteVariables, type SpeedWriteResult } from "../prompts/script-generation/speed-write";

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isGeminiModel(model: string): model is GeminiModel {
  return Object.values(GEMINI_MODELS).includes(model as GeminiModel);
}

export function isScriptLength(length: string): length is ScriptLength {
  return ["20", "60", "90"].includes(length);
}

export function isScriptType(type: string): type is ScriptType {
  return ["speed", "educational", "voice", "viral"].includes(type);
}

export function isValidResponse<T>(response: any): response is GeminiResponse<T> {
  return typeof response === "object" && response !== null && typeof response.success === "boolean";
}

export function isPromptResult<T>(result: any): result is PromptResult<T> {
  return typeof result === "object" && result !== null && typeof result.success === "boolean";
}
