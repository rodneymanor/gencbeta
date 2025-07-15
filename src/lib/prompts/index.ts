/**
 * Main prompt library entry point
 * Registers all prompts and exports convenience functions
 */

import { promptManager, PromptManager } from "./prompt-manager";
import SCRIPT_GENERATION_LIBRARY from "./script-generation";

// Register all prompt libraries
export function initializePromptLibrary(): void {
  console.log("📚 [PromptLibrary] Initializing prompt library...");

  // Register script generation prompts
  promptManager.registerLibrary(SCRIPT_GENERATION_LIBRARY);

  const stats = promptManager.getStats();
  console.log(`✅ [PromptLibrary] Loaded ${stats.totalPrompts} prompts across ${stats.categories} categories`);
  console.log("📊 [PromptLibrary] Categories:", stats.promptsByCategory);
}

// Export everything from the prompt management system
export * from "./types";
export * from "./base-prompt";
export * from "./prompt-manager";

// Export script generation utilities
export * from "./script-generation";

// Export the singleton instances
export { promptManager };

// Convenience function to ensure library is initialized
let initialized = false;
export function ensurePromptLibraryInitialized(): void {
  if (!initialized) {
    initializePromptLibrary();
    initialized = true;
  }
}

// Auto-initialize in non-test environments
if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  initializePromptLibrary();
  initialized = true;
}
