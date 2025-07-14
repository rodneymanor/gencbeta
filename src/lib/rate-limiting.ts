// Production-ready rate limiting system

import type { RateLimitInfo, RateLimitResult } from "@/types/video-processing";

import { getAdminDb, isAdminInitialized } from "./firebase-admin";

type LimitType = "video-processing" | "video-processing-burst" | "api-general" | "api-heavy";

export class RateLimitService {
  private static readonly RATE_LIMITS_COLLECTION = "rate_limits";

  // Rate limit configurations
  private static readonly LIMITS: Record<LimitType, { windowDuration: number; limit: number }> = {
    // Video processing limits
    "video-processing": {
      windowDuration: 3600, // 1 hour in seconds
      limit: 50, // 50 videos per hour per user
    },
    "video-processing-burst": {
      windowDuration: 300, // 5 minutes in seconds
      limit: 10, // 10 videos per 5 minutes (burst protection)
    },
    // API endpoint limits
    "api-general": {
      windowDuration: 60, // 1 minute in seconds
      limit: 100, // 100 requests per minute per user
    },
    "api-heavy": {
      windowDuration: 60, // 1 minute in seconds
      limit: 20, // 20 heavy operations per minute per user
    },
  };

  /**
   * Check if a user can make a request
   */
  static async checkRateLimit(
    userId: string,
    endpoint: string,
    limitType: LimitType = "api-general",
  ): Promise<RateLimitResult> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      // If rate limiting is unavailable, allow the request
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000).toISOString(),
      };
    }

    const config = this.LIMITS[limitType];
    const now = Date.now();
    const windowStart = new Date(now - config.windowDuration * 1000);
    const rateLimitKey = `${userId}_${endpoint}_${limitType}`;

    try {
      // Get current rate limit info
      const rateLimitDoc = await adminDb.collection(this.RATE_LIMITS_COLLECTION).doc(rateLimitKey).get();

      let rateLimitInfo: RateLimitInfo;

      if (!rateLimitDoc.exists) {
        // First request in this window
        rateLimitInfo = {
          userId,
          endpoint,
          requestCount: 1,
          windowStart: windowStart.toISOString(),
          windowDuration: config.windowDuration,
          limit: config.limit,
        };
      } else {
        const existing = rateLimitDoc.data() as RateLimitInfo;
        const existingWindowStart = new Date(existing.windowStart);

        if (now - existingWindowStart.getTime() > config.windowDuration * 1000) {
          // Window has expired, reset counter
          rateLimitInfo = {
            ...existing,
            requestCount: 1,
            windowStart: windowStart.toISOString(),
          };
        } else {
          // Within the current window
          rateLimitInfo = {
            ...existing,
            requestCount: existing.requestCount + 1,
          };
        }
      }

      // Check if limit is exceeded
      const allowed = rateLimitInfo.requestCount <= config.limit;
      const remaining = Math.max(0, config.limit - rateLimitInfo.requestCount);
      const resetTime = new Date(
        new Date(rateLimitInfo.windowStart).getTime() + config.windowDuration * 1000,
      ).toISOString();

      // Update the rate limit info if request is allowed
      if (allowed) {
        await adminDb.collection(this.RATE_LIMITS_COLLECTION).doc(rateLimitKey).set(rateLimitInfo);
      }

      const result: RateLimitResult = {
        allowed,
        remaining,
        resetTime,
        ...(!allowed && {
          retryAfter: Math.ceil((new Date(resetTime).getTime() - now) / 1000),
        }),
      };

      return result;
    } catch (error) {
      console.error("Rate limiting error:", error);
      // If rate limiting fails, allow the request but log the error
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(now + 60000).toISOString(),
      };
    }
  }

  /**
   * Check multiple rate limits at once
   */
  static async checkMultipleRateLimits(
    userId: string,
    endpoint: string,
    limitTypes: LimitType[],
  ): Promise<{ allowed: boolean; results: Record<string, RateLimitResult> }> {
    const results: Record<string, RateLimitResult> = {};
    let overallAllowed = true;

    for (const limitType of limitTypes) {
      const result = await this.checkRateLimit(userId, endpoint, limitType);
      results[limitType] = result;

      if (!result.allowed) {
        overallAllowed = false;
      }
    }

    return {
      allowed: overallAllowed,
      results,
    };
  }

  /**
   * Get current rate limit status for a user
   */
  static async getRateLimitStatus(
    userId: string,
    endpoint: string,
    limitType: LimitType = "api-general",
  ): Promise<RateLimitResult> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return {
        allowed: true,
        remaining: 999,
        resetTime: new Date(Date.now() + 60000).toISOString(),
      };
    }

    const config = this.LIMITS[limitType];
    const now = Date.now();
    const rateLimitKey = `${userId}_${endpoint}_${limitType}`;

    try {
      const rateLimitDoc = await adminDb.collection(this.RATE_LIMITS_COLLECTION).doc(rateLimitKey).get();

      if (!rateLimitDoc.exists) {
        return {
          allowed: true,
          remaining: config.limit,
          resetTime: new Date(now + config.windowDuration * 1000).toISOString(),
        };
      }

      const rateLimitInfo = rateLimitDoc.data() as RateLimitInfo;
      const windowStart = new Date(rateLimitInfo.windowStart);
      const windowEnd = new Date(windowStart.getTime() + config.windowDuration * 1000);

      if (now > windowEnd.getTime()) {
        // Window has expired
        return {
          allowed: true,
          remaining: config.limit,
          resetTime: new Date(now + config.windowDuration * 1000).toISOString(),
        };
      }

      const remaining = Math.max(0, config.limit - rateLimitInfo.requestCount);
      const allowed = remaining > 0;

      return {
        allowed,
        remaining,
        resetTime: windowEnd.toISOString(),
        ...(!allowed && {
          retryAfter: Math.ceil((windowEnd.getTime() - now) / 1000),
        }),
      };
    } catch (error) {
      console.error("Error getting rate limit status:", error);
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(now + 60000).toISOString(),
      };
    }
  }

  /**
   * Reset rate limits for a user (admin function)
   */
  static async resetUserRateLimits(userId: string): Promise<void> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      throw new Error("Firebase Admin SDK not configured");
    }

    try {
      // Get all rate limit documents for this user
      const querySnapshot = await adminDb.collection(this.RATE_LIMITS_COLLECTION).where("userId", "==", userId).get();

      // Delete all rate limit documents for this user
      const batch = adminDb.batch();
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Rate limits reset for user: ${userId}`);
    } catch (error) {
      console.error("Error resetting rate limits:", error);
      throw new Error("Failed to reset rate limits");
    }
  }

  /**
   * Get rate limit statistics for monitoring
   */
  static async getRateLimitStats(): Promise<{
    totalActiveUsers: number;
    heaviestUsers: Array<{ userId: string; requestCount: number; endpoint: string }>;
    rateLimitedRequests: number;
  }> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return {
        totalActiveUsers: 0,
        heaviestUsers: [],
        rateLimitedRequests: 0,
      };
    }

    try {
      const querySnapshot = await adminDb
        .collection(this.RATE_LIMITS_COLLECTION)
        .orderBy("requestCount", "desc")
        .limit(10)
        .get();

      const heaviestUsers = querySnapshot.docs.map((doc) => {
        const data = doc.data() as RateLimitInfo;
        return {
          userId: data.userId,
          requestCount: data.requestCount,
          endpoint: data.endpoint,
        };
      });

      // Get total active users (simplified)
      const allDocsSnapshot = await adminDb.collection(this.RATE_LIMITS_COLLECTION).get();

      const uniqueUsers = new Set(allDocsSnapshot.docs.map((doc) => (doc.data() as RateLimitInfo).userId));

      const rateLimitedRequests = allDocsSnapshot.docs.filter((doc) => {
        const data = doc.data() as RateLimitInfo;
        const config = this.LIMITS["api-general"]; // Use general limit for calculation
        return data.requestCount >= config.limit;
      }).length;

      return {
        totalActiveUsers: uniqueUsers.size,
        heaviestUsers,
        rateLimitedRequests,
      };
    } catch (error) {
      console.error("Error getting rate limit stats:", error);
      return {
        totalActiveUsers: 0,
        heaviestUsers: [],
        rateLimitedRequests: 0,
      };
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  static async cleanupExpiredEntries(): Promise<number> {
    const adminDb = getAdminDb();
    if (!isAdminInitialized || !adminDb) {
      return 0;
    }

    try {
      const now = Date.now();
      const querySnapshot = await adminDb.collection(this.RATE_LIMITS_COLLECTION).get();

      const batch = adminDb.batch();
      let deletedCount = 0;

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data() as RateLimitInfo;
        const windowStart = new Date(data.windowStart);
        const windowEnd = new Date(windowStart.getTime() + data.windowDuration * 1000);

        if (now > windowEnd.getTime()) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Cleaned up ${deletedCount} expired rate limit entries`);
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up rate limit entries:", error);
      return 0;
    }
  }
}
