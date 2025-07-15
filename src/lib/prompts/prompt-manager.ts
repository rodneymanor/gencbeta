/**
 * Centralized prompt management system
 */

import { BasePromptClass, createPrompt } from "./base-prompt";
import { Prompt, PromptLibrary, PromptResult, PromptExecutionOptions } from "./types";

export class PromptManager {
  private static instance: PromptManager;
  private prompts: Map<string, BasePromptClass> = new Map();
  private categories: Map<string, Set<string>> = new Map();

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  /**
   * Register a single prompt
   */
  register(prompt: Prompt, category: string = "general"): void {
    const promptInstance = createPrompt(prompt);
    this.prompts.set(prompt.id, promptInstance);

    // Track categories
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(prompt.id);

    console.log(`📝 [PromptManager] Registered prompt '${prompt.id}' in category '${category}'`);
  }

  /**
   * Register multiple prompts from a library
   */
  registerLibrary(library: PromptLibrary): void {
    Object.entries(library).forEach(([category, categoryPrompts]) => {
      Object.values(categoryPrompts).forEach((prompt) => {
        this.register(prompt, category);
      });
    });
  }

  /**
   * Get a prompt by ID
   */
  get(promptId: string): BasePromptClass | null {
    return this.prompts.get(promptId) || null;
  }

  /**
   * Execute a prompt by ID
   */
  async execute<T = string>(promptId: string, options: PromptExecutionOptions): Promise<PromptResult<T>> {
    const prompt = this.get(promptId);

    if (!prompt) {
      return {
        success: false,
        error: `Prompt '${promptId}' not found`,
        variables: options.variables,
      };
    }

    return prompt.execute<T>(options);
  }

  /**
   * Get all prompts in a category
   */
  getCategory(category: string): BasePromptClass[] {
    const promptIds = this.categories.get(category);
    if (!promptIds) {
      return [];
    }

    return Array.from(promptIds)
      .map((id) => this.prompts.get(id))
      .filter(Boolean) as BasePromptClass[];
  }

  /**
   * List all available prompts
   */
  list(): Array<{ id: string; category: string; name: string; description: string }> {
    const result: Array<{ id: string; category: string; name: string; description: string }> = [];

    this.categories.forEach((promptIds, category) => {
      promptIds.forEach((promptId) => {
        const prompt = this.prompts.get(promptId);
        if (prompt) {
          const info = prompt.getInfo();
          result.push({
            id: info.id,
            category,
            name: info.name,
            description: info.description,
          });
        }
      });
    });

    return result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  }

  /**
   * Search prompts by name or description
   */
  search(query: string): BasePromptClass[] {
    const searchTerm = query.toLowerCase();
    const results: BasePromptClass[] = [];

    this.prompts.forEach((prompt) => {
      const info = prompt.getInfo();
      if (
        info.name.toLowerCase().includes(searchTerm) ||
        info.description.toLowerCase().includes(searchTerm) ||
        info.id.toLowerCase().includes(searchTerm)
      ) {
        results.push(prompt);
      }
    });

    return results;
  }

  /**
   * Remove a prompt
   */
  remove(promptId: string): boolean {
    const removed = this.prompts.delete(promptId);

    if (removed) {
      // Remove from categories
      this.categories.forEach((promptIds) => {
        promptIds.delete(promptId);
      });
      console.log(`🗑️ [PromptManager] Removed prompt '${promptId}'`);
    }

    return removed;
  }

  /**
   * Clear all prompts
   */
  clear(): void {
    this.prompts.clear();
    this.categories.clear();
    console.log("🧹 [PromptManager] Cleared all prompts");
  }

  /**
   * Get statistics about registered prompts
   */
  getStats(): {
    totalPrompts: number;
    categories: number;
    promptsByCategory: Record<string, number>;
  } {
    const promptsByCategory: Record<string, number> = {};

    this.categories.forEach((promptIds, category) => {
      promptsByCategory[category] = promptIds.size;
    });

    return {
      totalPrompts: this.prompts.size,
      categories: this.categories.size,
      promptsByCategory,
    };
  }

  /**
   * Validate a prompt definition
   */
  static validatePrompt(prompt: Prompt): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!prompt.id || prompt.id.trim() === "") {
      errors.push("Prompt ID is required");
    }

    if (!prompt.name || prompt.name.trim() === "") {
      errors.push("Prompt name is required");
    }

    if (!prompt.template || prompt.template.trim() === "") {
      errors.push("Prompt template is required");
    }

    if (!prompt.config) {
      errors.push("Prompt config is required");
    }

    // Check if template variables match validation requirements
    if (prompt.config?.validation?.required) {
      const templateVars = prompt.template.match(/\{\{?\s*(\w+)\s*\}?\}/g) || [];
      const extractedVars = templateVars.map((v) => v.replace(/\{\{?\s*|\s*\}?\}/g, ""));

      prompt.config.validation.required.forEach((requiredVar) => {
        if (!extractedVars.includes(requiredVar)) {
          errors.push(`Required variable '${requiredVar}' not found in template`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Export prompts for backup or sharing
   */
  export(): PromptLibrary {
    const library: PromptLibrary = {};

    this.categories.forEach((promptIds, category) => {
      library[category] = {};
      promptIds.forEach((promptId) => {
        const prompt = this.prompts.get(promptId);
        if (prompt) {
          library[category][promptId] = prompt.definition;
        }
      });
    });

    return library;
  }
}

// Export singleton instance
export const promptManager = PromptManager.getInstance();

// Convenience functions
export async function executePrompt<T = string>(
  promptId: string,
  options: PromptExecutionOptions,
): Promise<PromptResult<T>> {
  return promptManager.execute<T>(promptId, options);
}

export function getPrompt(promptId: string): BasePromptClass | null {
  return promptManager.get(promptId);
}

export function registerPrompt(prompt: Prompt, category?: string): void {
  promptManager.register(prompt, category);
}

export function listPrompts(): Array<{ id: string; category: string; name: string; description: string }> {
  return promptManager.list();
}
