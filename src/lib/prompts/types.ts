/**
 * Core types for the prompt management system
 */

// Base prompt interface
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

// Template variables interface
export interface PromptVariables {
  [key: string]: string | number | boolean | string[] | undefined;
}

// Prompt validation rules
export interface PromptValidation {
  required?: string[];
  optional?: string[];
  minLength?: { [key: string]: number };
  maxLength?: { [key: string]: number };
  pattern?: { [key: string]: RegExp };
}

// JSON schema for structured prompts
export interface JSONSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

// Prompt configuration
export interface PromptConfig {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  responseType?: "text" | "json";
  jsonSchema?: JSONSchema;
  validation?: PromptValidation;
  examples?: Array<{
    input: PromptVariables;
    output: string;
  }>;
}

// Complete prompt definition
export interface Prompt extends BasePrompt {
  template: string;
  config: PromptConfig;
}

// Prompt execution result
export interface PromptResult<T = string> {
  success: boolean;
  content?: T;
  error?: string;
  variables?: PromptVariables;
  prompt?: string;
  responseTime?: number;
  tokensUsed?: number;
}

// Prompt library interface
export interface PromptLibrary {
  [category: string]: {
    [promptId: string]: Prompt;
  };
}

// Sub-prompt composition
export interface ComposablePrompt {
  main: string;
  subPrompts?: {
    [key: string]: string;
  };
}

// Prompt execution options
export interface PromptExecutionOptions {
  variables: PromptVariables;
  overrideConfig?: Partial<PromptConfig>;
  validateInput?: boolean;
  parseOutput?: boolean;
}
