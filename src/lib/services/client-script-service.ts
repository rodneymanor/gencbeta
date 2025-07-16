/**
 * Client-side script generation service
 * Handles API calls from React components to the new modular backend
 */

// Legacy interfaces for backward compatibility
export interface SpeedWriteResponse {
  success: boolean;
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

export interface ScriptOption {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: "speed-write" | "educational" | "viral";
  elements?:
    | {
        hook: string;
        bridge: string;
        goldenNugget: string;
        wta: string;
      }
    | string;
  metadata?: {
    targetWords: number;
    actualWords: number;
    tokensUsed?: number;
    responseTime?: number;
  };
}

export interface ScriptGenerationRequest {
  idea: string;
  length: "15" | "20" | "30" | "45" | "60" | "90";
  userId?: string;
  type?: "speed" | "educational" | "voice";
  ideaContext?: {
    selectedNotes: Array<{
      id: string;
      title: string;
      content: string;
      tags: string[];
    }>;
    contextMode: "inspiration" | "reference" | "template" | "comprehensive";
  };
}

/**
 * Client-side service for script generation
 */
export class ClientScriptService {
  private static readonly API_BASE = "/api/script";

  /**
   * Generate speed write scripts (A/B testing by default)
   */
  static async generateSpeedWrite(request: ScriptGenerationRequest): Promise<SpeedWriteResponse> {
    const startTime = Date.now();

    try {
      // Get Firebase Auth token
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${this.API_BASE}/speed-write`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idea: request.idea,
          length: request.length,
          type: request.type,
          ideaContext: request.ideaContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const processingTime = Date.now() - startTime;

      // Transform new API response to legacy format
      console.log("🔍 [ClientScriptService] API response data:", data);

      const result: SpeedWriteResponse = {
        success: data.success,
        optionA: data.optionA || null,
        optionB: data.optionB || null,
        error: data.error,
        processingTime: data.processingTime || processingTime,
      };

      console.log("🔍 [ClientScriptService] Transformed result:", result);

      return result;
    } catch (error) {
      return {
        success: false,
        optionA: null,
        optionB: null,
        error: error instanceof Error ? error.message : "Failed to generate scripts",
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate a single script (no A/B testing)
   */
  static async generateSingle(request: ScriptGenerationRequest): Promise<{
    success: boolean;
    script?: ScriptOption;
    error?: string;
  }> {
    try {
      const response = await this.generateSpeedWrite(request);

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      // Return the first available option
      const script = response.optionA || response.optionB;

      return {
        success: !!script,
        script,
        error: script ? undefined : "No script generated",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate script",
      };
    }
  }

  /**
   * Estimate script duration in seconds
   */
  static estimateDuration(content: string): string {
    const words = content
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    // Average speaking rate: 160 words per minute for social media content
    const wordsPerMinute = 160;
    const totalSeconds = Math.round((words / wordsPerMinute) * 60);

    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
  }

  /**
   * Validate script generation request
   */
  static validateRequest(request: ScriptGenerationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.idea || request.idea.trim().length === 0) {
      errors.push("Idea is required");
    }

    if (request.idea && request.idea.length > 1000) {
      errors.push("Idea must be less than 1000 characters");
    }

    if (!request.length || !["15", "20", "30", "45", "60", "90"].includes(request.length)) {
      errors.push("Length must be 15, 20, 30, 45, 60, or 90 seconds");
    }

    if (request.type && !["speed", "educational", "voice"].includes(request.type)) {
      errors.push("Type must be speed, educational, or voice");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Private helper methods
  private static transformToLegacyOption(modernResult: any, optionLabel: string): ScriptOption {
    const approach = modernResult.metadata?.promptId?.includes("educational") ? "educational" : "speed-write";

    return {
      id: `option${optionLabel}_${Date.now()}`,
      title: `Option ${optionLabel}`,
      content: modernResult.content,
      estimatedDuration: this.estimateDuration(modernResult.content),
      approach,
      elements: modernResult.elements,
      metadata: modernResult.metadata
        ? {
            targetWords: modernResult.metadata.targetWords,
            actualWords: modernResult.metadata.actualWords,
            tokensUsed: modernResult.metadata.tokensUsed,
            responseTime: modernResult.metadata.responseTime,
          }
        : undefined,
    };
  }

  private static generateId(): string {
    return `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export convenience functions for easy migration
export async function callSpeedWriteAPI(
  idea: string,
  length: "15" | "20" | "30" | "45" | "60" | "90",
  userId?: string,
): Promise<SpeedWriteResponse> {
  return ClientScriptService.generateSpeedWrite({
    idea,
    length,
    userId,
  });
}

export async function generateSingleScript(
  idea: string,
  length: "15" | "20" | "30" | "45" | "60" | "90",
  type?: "speed" | "educational" | "voice",
): Promise<{ success: boolean; script?: ScriptOption; error?: string }> {
  return ClientScriptService.generateSingle({
    idea,
    length,
    type,
  });
}

// Default export for easy importing
export default ClientScriptService;
