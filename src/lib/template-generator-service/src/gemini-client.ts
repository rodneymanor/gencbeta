import { GeminiResponse } from "./types";

export class GeminiClient {
  private static readonly API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  private static readonly DEFAULT_MODEL = "gemini-1.5-flash-preview-0514";
  private static readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private static readonly RATE_LIMIT_DELAY = 500; // 500ms between requests

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env["GEMINI_API_KEY"] ?? "";

    if (!this.apiKey) {
      throw new Error(
        "Gemini API key is required. Set GEMINI_API_KEY environment variable or pass it to the constructor.",
      );
    }

    if (!GeminiClient.validateApiKey(this.apiKey)) {
      throw new Error(
        'Invalid Gemini API key format. Key should start with "AIza" and be at least 20 characters long.',
      );
    }
  }

  /**
   * Make a text-based request to Gemini API
   */
  async makeTextRequest(prompt: string): Promise<GeminiResponse> {
    const startTime = Date.now();

    try {
      console.log(`[GeminiClient] Making text request to Gemini API`);

      const url = `${GeminiClient.API_BASE_URL}/${GeminiClient.DEFAULT_MODEL}:generateContent?key=${this.apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      const response = await this.makeRequest("POST", `${GeminiClient.DEFAULT_MODEL}:generateContent`, requestBody);
      const processingTime = Date.now() - startTime;

      console.log(`[GeminiClient] Successfully received response in ${processingTime}ms`);

      return {
        text: response.text,
        usage: response.usage,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[GeminiClient] Request failed after ${processingTime}ms:`, error);

      throw new Error(`Gemini API request failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Make HTTP request to Gemini API with timeout and error handling
   */
  private async makeRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    body: Record<string, unknown> | null = null,
    isStream = false,
  ): Promise<T> {
    for (let retries = 3; retries > 0; retries--) {
      try {
        return await this.performRequest<T>(method, endpoint, body, isStream);
      } catch (error) {
        if (!this.isRetryable(error) || retries === 1) {
          throw error;
        }
        await this.exponentialBackoff(retries);
      }
    }
    throw new Error("Request failed after multiple retries");
  }

  private async performRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    body: Record<string, unknown> | null,
    isStream: boolean,
  ): Promise<T> {
    const url = `${GeminiClient.API_BASE_URL}/${endpoint}`;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GeminiClient.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
        signal: controller.signal,
      });

      if (isStream && response.body) {
        return response.body as T;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Gemini API Error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`Gemini API request failed: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes("timeout") || message.includes("503");
    }
    return false;
  }

  private async exponentialBackoff(retries: number): Promise<void> {
    const delay = Math.pow(2, 4 - retries) * 1000 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Parse JSON response from Gemini API with error handling
   */
  static parseJsonResponse(text: string): any {
    try {
      console.log("[GeminiClient] Parsing JSON response, length:", text.length);

      // Clean up the response text - remove markdown code blocks and extra text
      let cleanedResponse = text.trim();

      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i, "$1");

      // Remove any leading/trailing text that isn't part of the JSON
      const jsonStart = cleanedResponse.indexOf("{");
      const jsonEnd = cleanedResponse.lastIndexOf("}");

      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }

      console.log("[GeminiClient] Cleaned response:", cleanedResponse.substring(0, 200) + "...");

      // Try to parse the JSON
      const parsed = JSON.parse(cleanedResponse);

      console.log("[GeminiClient] Successfully parsed JSON with keys:", Object.keys(parsed));

      return parsed;
    } catch (parseError) {
      console.error("[GeminiClient] Failed to parse JSON response:", text);
      console.error("[GeminiClient] Parse error:", parseError);

      // Try to extract any JSON-like structure as a fallback
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const fallbackParsed = JSON.parse(jsonMatch[0]);
          console.log("[GeminiClient] Fallback parsing successful");
          return fallbackParsed;
        } catch (fallbackError) {
          console.error("[GeminiClient] Fallback parsing also failed:", fallbackError);
        }
      }

      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}. Response: ${text.substring(0, 500)}...`,
      );
    }
  }

  /**
   * Simple delay utility for rate limiting
   */
  static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    return !!(apiKey && apiKey.length > 20 && apiKey.startsWith("AIza"));
  }

  /**
   * Get rate limit delay for this client
   */
  getRateLimitDelay(): number {
    return GeminiClient.RATE_LIMIT_DELAY;
  }
}
