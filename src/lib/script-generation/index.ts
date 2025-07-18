/**
 * Script Generation V2 - Main exports
 *
 * This is the new modular architecture for script generation.
 * Use UnifiedScriptService for all new implementations.
 */

export * from "./types";
export { DurationConfig } from "./duration-config";
export { ScriptContextProvider } from "./context-provider";
export { ScriptGenerationAdapter } from "./adapter";
export { UnifiedScriptService } from "./unified-service";
