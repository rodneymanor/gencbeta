import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";

export interface UsageRecord {
  userId: string;
  service: "gemini" | "openai" | "claude";
  operation: "speed-write" | "script-generation" | "chat-refinement";
  promptType: "speed-write-a" | "speed-write-b" | "educational" | "custom";
  tokensUsed: number;
  responseTime: number;
  success: boolean;
  error?: string;
  timestamp: any; // Firestore timestamp
  metadata?: {
    scriptLength?: string;
    inputLength?: number;
    outputLength?: number;
  };
}

export interface DailyUsageStats {
  date: string;
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  averageResponseTime: number;
  costEstimate: number;
}

export class UsageTracker {
  private static readonly GEMINI_COST_PER_1K_TOKENS = 0.002; // Current Gemini pricing estimate

  static async trackGeminiUsage(data: {
    userId: string;
    operation: UsageRecord["operation"];
    promptType: UsageRecord["promptType"];
    tokensUsed: number;
    responseTime: number;
    success: boolean;
    error?: string;
    metadata?: UsageRecord["metadata"];
  }): Promise<void> {
    try {
      const usageRecord: Omit<UsageRecord, "timestamp"> = {
        userId: data.userId,
        service: "gemini",
        operation: data.operation,
        promptType: data.promptType,
        tokensUsed: data.tokensUsed,
        responseTime: data.responseTime,
        success: data.success,
        timestamp: serverTimestamp(),
      };

      // Only include error field if it's not undefined
      if (data.error !== undefined) {
        usageRecord.error = data.error;
      }

      // Only include metadata field if it's not undefined
      if (data.metadata !== undefined) {
        usageRecord.metadata = data.metadata;
      }

      await addDoc(collection(db, "usage_tracking"), usageRecord);

      console.log(`📊 [Usage] Tracked Gemini usage for user ${data.userId}: ${data.tokensUsed} tokens`);
    } catch (error) {
      console.error("❌ [Usage] Failed to track usage:", error);
      // Don't throw - usage tracking failures shouldn't break the main flow
    }
  }

  static calculateCost(tokensUsed: number): number {
    return (tokensUsed / 1000) * this.GEMINI_COST_PER_1K_TOKENS;
  }

  static estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Rate limiting helper
  static async checkRateLimit(userId: string): Promise<boolean> {
    try {
      // TODO: Implement Redis-based rate limiting for production
      // For now, we'll rely on client-side throttling
      // In production, use Redis with sliding window or token bucket algorithm
      console.log(`🚦 [RateLimit] Checking rate limit for user ${userId}`);
      return true; // Allow for now
    } catch (error) {
      console.error("❌ [RateLimit] Rate limit check failed:", error);
      return true; // Fail open
    }
  }
}

// Helper function for tracking in API routes
export async function trackApiUsage(
  userId: string,
  operation: UsageRecord["operation"],
  promptType: UsageRecord["promptType"],
  result: {
    tokensUsed?: number;
    responseTime: number;
    success: boolean;
    error?: string;
  },
  metadata?: UsageRecord["metadata"],
): Promise<void> {
  await UsageTracker.trackGeminiUsage({
    userId,
    operation,
    promptType,
    tokensUsed: result.tokensUsed ?? 0,
    responseTime: result.responseTime,
    success: result.success,
    error: result.error,
    metadata,
  });
}

// Usage analytics helpers
export class UsageAnalytics {
  static async getUserDailyUsage(): Promise<DailyUsageStats | null> {
    // TODO: Implement aggregation query
    return null;
  }

  static async getSystemUsage(): Promise<DailyUsageStats[]> {
    // TODO: Implement system-wide usage analytics
    return [];
  }
}
