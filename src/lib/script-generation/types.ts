/**
 * Unified types for the new script generation architecture
 */

export type ScriptDuration = "15" | "20" | "30" | "45" | "60" | "90";
export type ScriptType = "speed" | "educational" | "viral";
export type ScriptTone = "casual" | "professional" | "energetic" | "educational";

export interface UnifiedScriptInput {
  idea: string;
  duration: ScriptDuration;
  type: ScriptType;
  tone: ScriptTone;
  context?: {
    notes?: string;
    voiceId?: string;
    referenceMode?: "inspiration" | "reference" | "template" | "comprehensive";
  };
}

export interface ScriptContext {
  userId: string;
  profile: any; // Will be typed properly when we know the shape
  voice: any; // Will be typed properly when we know the shape
  negativeKeywords: string[];
}

export interface DurationMetrics {
  totalWords: number;
  hookWords: number;
  bridgeWords: number;
  nuggetWords: number;
  wtaWords: number;
  hookSeconds: number;
  bridgeSeconds: number;
  nuggetSeconds: number;
  wtaSeconds: number;
}

export interface GeneratedScript {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
  metadata: {
    duration: ScriptDuration;
    type: ScriptType;
    tone: ScriptTone;
    wordCount: number;
    estimatedDuration: number;
    generatedAt: Date;
  };
}
