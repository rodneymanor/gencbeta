import { GeminiResponse } from "./types";
export declare class GeminiClient {
  private static readonly API_BASE_URL;
  private static readonly DEFAULT_MODEL;
  private static readonly REQUEST_TIMEOUT;
  private static readonly RATE_LIMIT_DELAY;
  private apiKey;
  constructor(apiKey?: string);
  /**
   * Make a text-based request to Gemini API
   */
  makeTextRequest(prompt: string): Promise<GeminiResponse>;
  /**
   * Make HTTP request to Gemini API with timeout and error handling
   */
  private makeRequest;
  /**
   * Parse JSON response from Gemini API with error handling
   */
  static parseJsonResponse(text: string): any;
  /**
   * Simple delay utility for rate limiting
   */
  static delay(ms: number): Promise<void>;
  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean;
  /**
   * Get rate limit delay for this client
   */
  getRateLimitDelay(): number;
}
//# sourceMappingURL=gemini-client.d.ts.map
