/**
 * Base prompt class with template processing and validation
 */

import { geminiService, GeminiRequestConfig } from "../services/gemini-service";

import { Prompt, PromptVariables, PromptResult, PromptExecutionOptions, PromptValidation } from "./types";

export class BasePromptClass {
  constructor(public definition: Prompt) {}

  /**
   * Process template variables in the prompt
   */
  processTemplate(template: string, variables: PromptVariables): string {
    let processed = template;

    // Replace {{variable}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      const stringValue = Array.isArray(value) ? value.join(", ") : String(value || "");
      processed = processed.replace(placeholder, stringValue);
    });

    // Replace {variable} placeholders (alternative syntax)
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
      const stringValue = Array.isArray(value) ? value.join(", ") : String(value || "");
      processed = processed.replace(placeholder, stringValue);
    });

    return processed;
  }

  /**
   * Validate input variables against prompt requirements
   */
  validateVariables(
    variables: PromptVariables,
    validation?: PromptValidation,
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!validation) {
      return { valid: true, errors: [] };
    }

    // Check required variables
    if (validation.required) {
      validation.required.forEach((key) => {
        if (!(key in variables) || variables[key] === undefined || variables[key] === "") {
          errors.push(`Required variable '${key}' is missing or empty`);
        }
      });
    }

    // Check minimum length requirements
    if (validation.minLength) {
      Object.entries(validation.minLength).forEach(([key, minLen]) => {
        const value = variables[key];
        if (value && String(value).length < minLen) {
          errors.push(`Variable '${key}' must be at least ${minLen} characters long`);
        }
      });
    }

    // Check maximum length requirements
    if (validation.maxLength) {
      Object.entries(validation.maxLength).forEach(([key, maxLen]) => {
        const value = variables[key];
        if (value && String(value).length > maxLen) {
          errors.push(`Variable '${key}' must be no more than ${maxLen} characters long`);
        }
      });
    }

    // Check pattern requirements
    if (validation.pattern) {
      Object.entries(validation.pattern).forEach(([key, pattern]) => {
        const value = variables[key];
        if (value && !pattern.test(String(value))) {
          errors.push(`Variable '${key}' does not match the required pattern`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate the final prompt with system instruction
   */
  generatePrompt(variables: PromptVariables): { prompt: string; systemInstruction?: string } {
    const processedPrompt = this.processTemplate(this.definition.template, variables);

    return {
      prompt: processedPrompt,
      systemInstruction: this.definition.config.systemInstruction,
    };
  }

  /**
   * Execute the prompt with Gemini
   */
  async execute<T = string>(options: PromptExecutionOptions): Promise<PromptResult<T>> {
    const startTime = Date.now();

    try {
      // Validate input if requested
      if (options.validateInput !== false) {
        const validation = this.validateVariables(options.variables, this.definition.config.validation);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors.join(", ")}`,
            variables: options.variables,
            responseTime: Date.now() - startTime,
          };
        }
      }

      // Generate the prompt
      const { prompt, systemInstruction } = this.generatePrompt(options.variables);

      // Merge configuration
      const config: GeminiRequestConfig = {
        ...this.definition.config,
        ...options.overrideConfig,
        systemInstruction: systemInstruction || options.overrideConfig?.systemInstruction,
      };

      // Execute with Gemini
      const response = await geminiService.generateContent<T>({
        prompt,
        ...config,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
          variables: options.variables,
          prompt,
          responseTime: response.responseTime,
        };
      }

      // Parse output if JSON schema is provided and parseOutput is enabled
      let content = response.content;
      if (
        options.parseOutput !== false &&
        this.definition.config.jsonSchema &&
        this.definition.config.responseType === "json"
      ) {
        try {
          // Check if we got raw prompt template instead of JSON (common Gemini issue)
          if (
            typeof response.content === "string" &&
            response.content.length > 1000 &&
            response.content.includes("HOOK GUIDELINES") &&
            response.content.includes("BRIDGE GUIDELINES") &&
            response.content.includes("GOLDEN NUGGET GUIDELINES")
          ) {
            console.error(
              `❌ [Prompt] AI returned raw prompt template instead of JSON for prompt ${this.definition.id}`,
            );
            return {
              success: false,
              error: "AI model returned invalid response format. Please try again.",
              variables: options.variables,
              prompt,
              responseTime: response.responseTime,
            };
          }

          // Additional JSON validation could be added here
          content = typeof response.content === "string" ? JSON.parse(response.content) : response.content;
        } catch (parseError) {
          console.warn(`⚠️ [Prompt] JSON parsing failed for prompt ${this.definition.id}:`, parseError);
          console.warn(`⚠️ [Prompt] Raw content type:`, typeof response.content);
          console.warn(`⚠️ [Prompt] Raw content length:`, response.content?.length);
          console.warn(
            `⚠️ [Prompt] Raw content sample:`,
            typeof response.content === "string" ? response.content.substring(0, 200) : response.content,
          );
          // Continue with raw content
        }
      }

      return {
        success: true,
        content,
        variables: options.variables,
        prompt,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        variables: options.variables,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get prompt info for debugging
   */
  getInfo(): {
    id: string;
    name: string;
    description: string;
    requiredVariables: string[];
    optionalVariables: string[];
  } {
    return {
      id: this.definition.id,
      name: this.definition.name,
      description: this.definition.description,
      requiredVariables: this.definition.config.validation?.required || [],
      optionalVariables: this.definition.config.validation?.optional || [],
    };
  }

  /**
   * Preview the prompt with sample variables
   */
  preview(variables: PromptVariables): string {
    return this.processTemplate(this.definition.template, variables);
  }
}

/**
 * Factory function to create prompt instances
 */
export function createPrompt(definition: Prompt): BasePromptClass {
  return new BasePromptClass(definition);
}

/**
 * Helper to create prompts with composition support
 */
export function composePrompts(mainTemplate: string, subPrompts: Record<string, string>): string {
  let composed = mainTemplate;

  Object.entries(subPrompts).forEach(([key, subPrompt]) => {
    const placeholder = `{{${key}}}`;
    composed = composed.replace(new RegExp(placeholder, "g"), subPrompt);
  });

  return composed;
}
