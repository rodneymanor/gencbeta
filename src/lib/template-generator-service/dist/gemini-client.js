"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
class GeminiClient {
  static API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  static DEFAULT_MODEL = "gemini-1.5-flash";
  static REQUEST_TIMEOUT = 30000; // 30 seconds
  static RATE_LIMIT_DELAY = 500; // 500ms between requests
  apiKey;
  constructor(apiKey) {
    this.apiKey = apiKey || process.env["GEMINI_API_KEY"] || "";
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
  async makeTextRequest(prompt) {
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
      const response = await this.makeRequest(url, requestBody);
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
  async makeRequest(url, body) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GeminiClient.REQUEST_TIMEOUT);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch {
          // If we can't parse the error, use the raw text
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Invalid response format from Gemini API");
      }
      const text = data.candidates[0].content.parts?.map((part) => part.text).join("") || "";
      if (!text.trim()) {
        throw new Error("Empty response from Gemini API");
      }
      return {
        text: text.trim(),
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  /**
   * Parse JSON response from Gemini API with error handling
   */
  static parseJsonResponse(text) {
    try {
      // Clean up the response text - remove markdown code blocks and extra text
      let cleanedResponse = text.trim();
      // Remove markdown code blocks
      cleanedResponse = cleanedResponse.replace(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i, "$1");
      // Find JSON object
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      } else {
        throw new Error("No JSON object found in response");
      }
    } catch (parseError) {
      console.error("[GeminiClient] Failed to parse JSON response:", text);
      throw new Error(
        `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }
  }
  /**
   * Simple delay utility for rate limiting
   */
  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  /**
   * Validate API key format
   */
  static validateApiKey(apiKey) {
    return !!(apiKey && apiKey.length > 20 && apiKey.startsWith("AIza"));
  }
  /**
   * Get rate limit delay for this client
   */
  getRateLimitDelay() {
    return GeminiClient.RATE_LIMIT_DELAY;
  }
}
exports.GeminiClient = GeminiClient;
//# sourceMappingURL=gemini-client.js.map
