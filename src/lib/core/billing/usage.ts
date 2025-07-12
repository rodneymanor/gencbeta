/**
 * Usage Tracking Service
 * Centralized usage tracking and analytics
 */

import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UsageRecord {
  userId: string;
  service: "gemini" | "openai" | "claude";
  operation: "speed-write" | "script-generation" | "chat-refinement" | "voice-training" | "video-analysis";
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
    model?: string;
    cost?: number;
  };
}

export interface DailyUsageStats {
  date: string;
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  averageResponseTime: number;
  costEstimate: number;
  operations: Record<string, number>;
}

export interface UserUsageStats {
  userId: string;
  period: "daily" | "weekly" | "monthly";
  totalRequests: number;
  totalTokens: number;
  successRate: number;
  averageResponseTime: number;
  costEstimate: number;
  operations: Record<string, number>;
  services: Record<string, number>;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxTokensPerDay: number;
}

// Service-specific cost configurations
const SERVICE_COSTS = {
  gemini: {
    costPer1KTokens: 0.002,
    maxTokensPerRequest: 100000,
  },
  openai: {
    costPer1KTokens: 0.003,
    maxTokensPerRequest: 128000,
  },
  claude: {
    costPer1KTokens: 0.008,
    maxTokensPerRequest: 200000,
  },
} as const;

/**
 * Track usage for any AI service
 * @param data - Usage data to track
 */
export async function trackUsage(data: {
  userId: string;
  service: UsageRecord["service"];
  operation: UsageRecord["operation"];
  promptType: UsageRecord["promptType"];
  tokensUsed: number;
  responseTime: number;
  success: boolean;
  error?: string;
  metadata?: UsageRecord["metadata"];
}): Promise<void> {
  try {
    const cost = calculateCost(data.service, data.tokensUsed);
    
    const usageRecord: Omit<UsageRecord, "timestamp"> = {
      userId: data.userId,
      service: data.service,
      operation: data.operation,
      promptType: data.promptType,
      tokensUsed: data.tokensUsed,
      responseTime: data.responseTime,
      success: data.success,
      timestamp: serverTimestamp(),
      metadata: {
        ...data.metadata,
        cost,
      },
    };

    // Only include error field if it's not undefined
    if (data.error !== undefined) {
      usageRecord.error = data.error;
    }

    await addDoc(collection(db, "usage_tracking"), usageRecord);

    console.log(`📊 [Usage] Tracked ${data.service} usage for user ${data.userId}: ${data.tokensUsed} tokens ($${cost.toFixed(4)})`);
  } catch (error) {
    console.error("❌ [Usage] Failed to track usage:", error);
    // Don't throw - usage tracking failures shouldn't break the main flow
  }
}

/**
 * Calculate cost for a service based on token usage
 * @param service - AI service used
 * @param tokensUsed - Number of tokens used
 * @returns Cost in USD
 */
export function calculateCost(service: UsageRecord["service"], tokensUsed: number): number {
  const config = SERVICE_COSTS[service];
  return (tokensUsed / 1000) * config.costPer1KTokens;
}

/**
 * Estimate token count from text
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Check rate limits for a user
 * @param userId - User ID
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  userId: string, 
  config: RateLimitConfig = {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxTokensPerDay: 1000000,
  }
): Promise<{ allowed: boolean; reason?: string; limits: Record<string, number> }> {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check requests per minute
    const minuteQuery = query(
      collection(db, "usage_tracking"),
      where("userId", "==", userId),
      where("timestamp", ">=", oneMinuteAgo),
      orderBy("timestamp", "desc")
    );
    const minuteSnapshot = await getDocs(minuteQuery);
    const requestsPerMinute = minuteSnapshot.size;

    // Check requests per hour
    const hourQuery = query(
      collection(db, "usage_tracking"),
      where("userId", "==", userId),
      where("timestamp", ">=", oneHourAgo),
      orderBy("timestamp", "desc")
    );
    const hourSnapshot = await getDocs(hourQuery);
    const requestsPerHour = hourSnapshot.size;

    // Check tokens per day
    const dayQuery = query(
      collection(db, "usage_tracking"),
      where("userId", "==", userId),
      where("timestamp", ">=", oneDayAgo),
      orderBy("timestamp", "desc")
    );
    const daySnapshot = await getDocs(dayQuery);
    const tokensPerDay = daySnapshot.docs.reduce((sum, doc) => {
      const data = doc.data() as UsageRecord;
      return sum + (data.tokensUsed || 0);
    }, 0);

    const limits = {
      requestsPerMinute,
      requestsPerHour,
      tokensPerDay,
    };

    if (requestsPerMinute >= config.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${requestsPerMinute} requests per minute`,
        limits,
      };
    }

    if (requestsPerHour >= config.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${requestsPerHour} requests per hour`,
        limits,
      };
    }

    if (tokensPerDay >= config.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `Token limit exceeded: ${tokensPerDay} tokens per day`,
        limits,
      };
    }

    return { allowed: true, limits };
  } catch (error) {
    console.error("❌ [RateLimit] Rate limit check failed:", error);
    return { 
      allowed: true, 
      reason: "Rate limit check failed, allowing request",
      limits: { requestsPerMinute: 0, requestsPerHour: 0, tokensPerDay: 0 }
    };
  }
}

/**
 * Get user's daily usage statistics
 * @param userId - User ID
 * @param date - Date to get stats for (defaults to today)
 * @returns Daily usage statistics
 */
export async function getUserDailyUsage(userId: string, date?: Date): Promise<DailyUsageStats | null> {
  try {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const querySnapshot = await getDocs(
      query(
        collection(db, "usage_tracking"),
        where("userId", "==", userId),
        where("timestamp", ">=", startOfDay),
        where("timestamp", "<", endOfDay),
        orderBy("timestamp", "desc")
      )
    );

    if (querySnapshot.empty) {
      return null;
    }

    const records = querySnapshot.docs.map(doc => doc.data() as UsageRecord);
    const totalRequests = records.length;
    const totalTokens = records.reduce((sum, record) => sum + record.tokensUsed, 0);
    const successfulRequests = records.filter(record => record.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 
      ? records.reduce((sum, record) => sum + record.responseTime, 0) / totalRequests 
      : 0;
    const costEstimate = records.reduce((sum, record) => {
      const cost = record.metadata?.cost || calculateCost(record.service, record.tokensUsed);
      return sum + cost;
    }, 0);

    // Group by operation
    const operations: Record<string, number> = {};
    records.forEach(record => {
      operations[record.operation] = (operations[record.operation] || 0) + 1;
    });

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalRequests,
      totalTokens,
      successRate,
      averageResponseTime,
      costEstimate,
      operations,
    };
  } catch (error) {
    console.error("❌ [Usage] Failed to get daily usage:", error);
    return null;
  }
}

/**
 * Get user's usage statistics for a period
 * @param userId - User ID
 * @param period - Time period
 * @returns User usage statistics
 */
export async function getUserUsageStats(userId: string, period: "daily" | "weekly" | "monthly"): Promise<UserUsageStats | null> {
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "daily":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const querySnapshot = await getDocs(
      query(
        collection(db, "usage_tracking"),
        where("userId", "==", userId),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "desc")
      )
    );

    if (querySnapshot.empty) {
      return null;
    }

    const records = querySnapshot.docs.map(doc => doc.data() as UsageRecord);
    const totalRequests = records.length;
    const totalTokens = records.reduce((sum, record) => sum + record.tokensUsed, 0);
    const successfulRequests = records.filter(record => record.success).length;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const averageResponseTime = totalRequests > 0 
      ? records.reduce((sum, record) => sum + record.responseTime, 0) / totalRequests 
      : 0;
    const costEstimate = records.reduce((sum, record) => {
      const cost = record.metadata?.cost || calculateCost(record.service, record.tokensUsed);
      return sum + cost;
    }, 0);

    // Group by operation and service
    const operations: Record<string, number> = {};
    const services: Record<string, number> = {};
    
    records.forEach(record => {
      operations[record.operation] = (operations[record.operation] || 0) + 1;
      services[record.service] = (services[record.service] || 0) + 1;
    });

    return {
      userId,
      period,
      totalRequests,
      totalTokens,
      successRate,
      averageResponseTime,
      costEstimate,
      operations,
      services,
    };
  } catch (error) {
    console.error("❌ [Usage] Failed to get user usage stats:", error);
    return null;
  }
}

/**
 * Get system-wide usage analytics
 * @param days - Number of days to analyze
 * @returns System usage statistics
 */
export async function getSystemUsage(days: number = 30): Promise<DailyUsageStats[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const querySnapshot = await getDocs(
      query(
        collection(db, "usage_tracking"),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "desc")
      )
    );

    if (querySnapshot.empty) {
      return [];
    }

    const records = querySnapshot.docs.map(doc => doc.data() as UsageRecord);
    
    // Group by date
    const dailyStats: Record<string, UsageRecord[]> = {};
    records.forEach(record => {
      const date = new Date(record.timestamp.toDate()).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = [];
      }
      dailyStats[date].push(record);
    });

    // Calculate stats for each day
    return Object.entries(dailyStats).map(([date, dayRecords]) => {
      const totalRequests = dayRecords.length;
      const totalTokens = dayRecords.reduce((sum, record) => sum + record.tokensUsed, 0);
      const successfulRequests = dayRecords.filter(record => record.success).length;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const averageResponseTime = totalRequests > 0 
        ? dayRecords.reduce((sum, record) => sum + record.responseTime, 0) / totalRequests 
        : 0;
      const costEstimate = dayRecords.reduce((sum, record) => {
        const cost = record.metadata?.cost || calculateCost(record.service, record.tokensUsed);
        return sum + cost;
      }, 0);

      const operations: Record<string, number> = {};
      dayRecords.forEach(record => {
        operations[record.operation] = (operations[record.operation] || 0) + 1;
      });

      return {
        date,
        totalRequests,
        totalTokens,
        successRate,
        averageResponseTime,
        costEstimate,
        operations,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("❌ [Usage] Failed to get system usage:", error);
    return [];
  }
}

/**
 * Helper function for tracking in API routes
 * @param userId - User ID
 * @param operation - Operation type
 * @param promptType - Prompt type
 * @param result - Operation result
 * @param metadata - Additional metadata
 */
export async function trackApiUsage(
  userId: string,
  operation: UsageRecord["operation"],
  promptType: UsageRecord["promptType"],
  result: {
    tokensUsed?: number;
    responseTime: number;
    success: boolean;
    error?: string;
    service?: UsageRecord["service"];
  },
  metadata?: UsageRecord["metadata"],
): Promise<void> {
  await trackUsage({
    userId,
    service: result.service || "gemini",
    operation,
    promptType,
    tokensUsed: result.tokensUsed ?? 0,
    responseTime: result.responseTime,
    success: result.success,
    error: result.error,
    metadata,
  });
} 