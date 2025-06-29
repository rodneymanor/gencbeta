import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
}

// Gemini service with production error handling
export class GeminiService {
  private static readonly DEFAULT_MODEL = "gemini-1.5-flash";
  private static readonly TIMEOUT_MS = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 2;

  static async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();

    try {
      console.log("🤖 [Gemini] Starting content generation...");
      
      const model = genAI.getGenerativeModel({ 
        model: this.DEFAULT_MODEL,
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7,
        },
      });

      const result = await this.withTimeout(
        model.generateContent(request.prompt),
        this.TIMEOUT_MS
      );

      const response = await result.response;
      const content = response.text();
      const responseTime = Date.now() - startTime;

      // Estimate tokens used (rough calculation)
      const tokensUsed = Math.ceil((request.prompt.length + content.length) / 4);

      console.log(`✅ [Gemini] Generation successful in ${responseTime}ms`);

      return {
        success: true,
        content,
        tokensUsed,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [Gemini] Generation failed after ${responseTime}ms:`, error);

      return {
        success: false,
        error: this.getErrorMessage(error),
        responseTime,
      };
    }
  }

  static async generateWithRetry(request: GeminiRequest): Promise<GeminiResponse> {
    let lastError: GeminiResponse | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      console.log(`🔄 [Gemini] Attempt ${attempt}/${this.MAX_RETRIES}`);
      
      const result = await this.generateContent(request);
      
      if (result.success) {
        return result;
      }

      lastError = result;
      
      if (attempt < this.MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ [Gemini] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return lastError!;
  }

  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      if (error.message.includes('quota')) {
        return 'API quota exceeded. Please try again later.';
      }
      if (error.message.includes('invalid')) {
        return 'Invalid request. Please check your input.';
      }
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

// Helper for script generation
export async function generateScript(prompt: string, options?: Partial<GeminiRequest>): Promise<GeminiResponse> {
  return GeminiService.generateWithRetry({
    prompt,
    maxTokens: 800,
    temperature: 0.8,
    ...options,
  });
} 