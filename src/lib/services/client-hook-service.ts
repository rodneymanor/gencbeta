import { auth } from "@/lib/firebase";
import { createHookGenerationPrompt, type HookGenerationResponse } from "@/lib/prompts/hook-generation";

export class ClientHookService {
  private static readonly API_BASE = "/api/hooks";

  static async generateHooks(input: string): Promise<HookGenerationResponse> {
    try {
      // Validate input
      if (!input || input.trim().length === 0) {
        throw new Error("Please provide an idea or topic for hook generation");
      }

      // Get Firebase Auth token
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${this.API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input: input.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate hooks");
      }

      const data = await response.json();

      // Validate response structure
      if (!data.hooks || !Array.isArray(data.hooks)) {
        throw new Error("Invalid response format from hook generation service");
      }

      return data as HookGenerationResponse;
    } catch (error) {
      console.error("Hook generation error:", error);
      throw error;
    }
  }
}
