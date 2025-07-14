/**
 * Credits Service
 * Centralized credit management and billing operations
 */

import { AccountLevel } from "@/lib/auth-cache";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  UserCredits,
  CreditTransaction,
  UsageStats,
  UsageRecord,
  CREDIT_COSTS,
  ACCOUNT_LIMITS,
  CreditOperation,
} from "@/types/usage-tracking";

export interface CreditCheckResult {
  canPerform: boolean;
  reason?: string;
  creditsNeeded: number;
  creditsRemaining: number;
  accountLevel: AccountLevel;
}

export interface CreditDeductionResult {
  success: boolean;
  newBalance: number;
  transaction?: CreditTransaction;
  error?: string;
}

export interface CreditRefundResult {
  success: boolean;
  newBalance: number;
  refundedAmount: number;
  transaction?: CreditTransaction;
}

/**
 * Initialize user credits for a new account
 * @param userId - User ID
 * @param accountLevel - Account level (free/pro)
 * @returns Initialized user credits
 */
export async function initializeUserCredits(userId: string, accountLevel: AccountLevel): Promise<UserCredits> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const now = new Date().toISOString();
    const isProAccount = accountLevel === "pro";

    const periodStart = isProAccount ? getMonthStart() : getDayStart();
    const periodEnd = isProAccount ? getMonthEnd() : getDayEnd();

    const userCredits: Omit<UserCredits, "id"> = {
      userId,
      accountLevel: isProAccount ? "pro" : "free",
      creditsUsed: 0,
      creditsLimit: isProAccount ? ACCOUNT_LIMITS.PRO.MONTHLY_CREDITS : ACCOUNT_LIMITS.FREE.DAILY_CREDITS,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      createdAt: now,
      updatedAt: now,
      totalCreditsUsed: 0,
      totalScriptsGenerated: 0,
      totalVoicesCreated: 0,
      totalVideosProcessed: 0,
    };

    if (!isProAccount) {
      userCredits.dailyCreditsUsed = 0;
      userCredits.dailyCreditsLimit = ACCOUNT_LIMITS.FREE.DAILY_CREDITS;
      userCredits.lastDailyReset = now;
    } else {
      userCredits.monthlyCreditsUsed = 0;
      userCredits.monthlyCreditsLimit = ACCOUNT_LIMITS.PRO.MONTHLY_CREDITS;
      userCredits.lastMonthlyReset = now;
    }

    const docRef = await adminDb.collection("user_credits").add(userCredits);

    console.log(`📊 [Credits] Initialized credits for user ${userId} (${accountLevel})`);

    return {
      id: docRef.id,
      ...userCredits,
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to initialize user credits:", error);
    throw error;
  }
}

/**
 * Get user credits, creating if they don't exist
 * @param userId - User ID
 * @param accountLevel - Account level
 * @returns User credits
 */
export async function getUserCredits(userId: string, accountLevel: AccountLevel): Promise<UserCredits> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const snapshot = await adminDb.collection("user_credits").where("userId", "==", userId).limit(1).get();

    let userCredits: UserCredits;

    if (snapshot.empty) {
      userCredits = await initializeUserCredits(userId, accountLevel);
    } else {
      userCredits = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserCredits;

      const needsReset = await checkAndResetPeriod(userCredits, accountLevel);
      if (needsReset) {
        userCredits = await getUserCredits(userId, accountLevel);
      }
    }

    return userCredits;
  } catch (error) {
    console.error("❌ [Credits] Failed to get user credits:", error);
    throw error;
  }
}

/**
 * Check if user can perform an operation
 * @param userId - User ID
 * @param operation - Credit operation
 * @param accountLevel - Account level
 * @returns Credit check result
 */
export async function canPerformAction(
  userId: string,
  operation: CreditOperation,
  accountLevel: AccountLevel,
): Promise<CreditCheckResult> {
  try {
    const userCredits = await getUserCredits(userId, accountLevel);
    const creditsNeeded = CREDIT_COSTS[operation];
    const creditsRemaining = userCredits.creditsLimit - userCredits.creditsUsed;

    if (creditsRemaining >= creditsNeeded) {
      return {
        canPerform: true,
        creditsNeeded,
        creditsRemaining,
        accountLevel,
      };
    }

    const periodType = accountLevel === "pro" ? "monthly" : "daily";
    return {
      canPerform: false,
      reason: `Insufficient credits. Need ${creditsNeeded}, have ${creditsRemaining}. Resets ${periodType}.`,
      creditsNeeded,
      creditsRemaining,
      accountLevel,
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to check action permission:", error);
    return {
      canPerform: false,
      reason: "Error checking credits",
      creditsNeeded: 0,
      creditsRemaining: 0,
      accountLevel,
    };
  }
}

/**
 * Deduct credits for an operation
 * @param userId - User ID
 * @param operation - Credit operation
 * @param accountLevel - Account level
 * @param metadata - Optional transaction metadata
 * @returns Deduction result
 */
export async function deductCredits(
  userId: string,
  operation: CreditOperation,
  accountLevel: AccountLevel,
  metadata?: Record<string, unknown>,
): Promise<CreditDeductionResult> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const userCredits = await getUserCredits(userId, accountLevel);
    const creditsToDeduct = CREDIT_COSTS[operation];

    const creditsRemaining = userCredits.creditsLimit - userCredits.creditsUsed;
    if (creditsRemaining < creditsToDeduct) {
      return {
        success: false,
        newBalance: creditsRemaining,
        error: "Insufficient credits",
      };
    }

    const transaction: Omit<CreditTransaction, "id"> = {
      userId,
      creditsUsed: creditsToDeduct,
      operation,
      balanceBefore: creditsRemaining,
      balanceAfter: creditsRemaining - creditsToDeduct,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const newCreditsUsed = userCredits.creditsUsed + creditsToDeduct;
    const updateData: Partial<UserCredits> = {
      creditsUsed: newCreditsUsed,
      updatedAt: new Date().toISOString(),
      totalCreditsUsed: userCredits.totalCreditsUsed + creditsToDeduct,
    };

    // Update operation-specific counters
    switch (operation) {
      case "script_generation":
        updateData.totalScriptsGenerated = (userCredits.totalScriptsGenerated ?? 0) + 1;
        break;
      case "voice_training":
        updateData.totalVoicesCreated = (userCredits.totalVoicesCreated ?? 0) + 1;
        break;
      case "video_analysis":
      case "collection_add":
        updateData.totalVideosProcessed = (userCredits.totalVideosProcessed ?? 0) + 1;
        break;
    }

    // Update period-specific usage
    if (accountLevel === "free") {
      updateData.dailyCreditsUsed = (userCredits.dailyCreditsUsed ?? 0) + creditsToDeduct;
    } else {
      updateData.monthlyCreditsUsed = (userCredits.monthlyCreditsUsed ?? 0) + creditsToDeduct;
    }

    const batch = adminDb.batch();

    const userCreditsRef = adminDb.collection("user_credits").doc(userCredits.id!);
    batch.update(userCreditsRef, updateData);

    const transactionRef = adminDb.collection("credit_transactions").doc();
    batch.set(transactionRef, transaction);

    await batch.commit();

    console.log(`💳 [Credits] Deducted ${creditsToDeduct} credits for ${operation} (user: ${userId})`);

    return {
      success: true,
      newBalance: creditsRemaining - creditsToDeduct,
      transaction: {
        id: transactionRef.id,
        ...transaction,
      },
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to deduct credits:", error);
    return {
      success: false,
      newBalance: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Refund credits to user
 * @param userId - User ID
 * @param amount - Amount to refund
 * @param reason - Reason for refund
 * @param metadata - Optional metadata
 * @returns Refund result
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<CreditRefundResult> {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const userCredits = await getUserCredits(userId, "free"); // Get current credits
    const currentBalance = userCredits.creditsLimit - userCredits.creditsUsed;

    const transaction: Omit<CreditTransaction, "id"> = {
      userId,
      creditsUsed: -amount, // Negative for refund
      operation: "refund" as CreditOperation,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance + amount,
      timestamp: new Date().toISOString(),
      metadata: {
        reason,
        ...metadata,
      },
    };

    const updateData: Partial<UserCredits> = {
      creditsUsed: Math.max(0, userCredits.creditsUsed - amount),
      updatedAt: new Date().toISOString(),
      totalCreditsUsed: Math.max(0, userCredits.totalCreditsUsed - amount),
    };

    const batch = adminDb.batch();

    const userCreditsRef = adminDb.collection("user_credits").doc(userCredits.id!);
    batch.update(userCreditsRef, updateData);

    const transactionRef = adminDb.collection("credit_transactions").doc();
    batch.set(transactionRef, transaction);

    await batch.commit();

    console.log(`💰 [Credits] Refunded ${amount} credits to user ${userId} (reason: ${reason})`);

    return {
      success: true,
      newBalance: currentBalance + amount,
      refundedAmount: amount,
      transaction: {
        id: transactionRef.id,
        ...transaction,
      },
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to refund credits:", error);
    return {
      success: false,
      newBalance: 0,
      refundedAmount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get usage statistics for a user
 * @param userId - User ID
 * @param accountLevel - Account level
 * @returns Usage statistics
 */
export async function getUsageStats(userId: string, accountLevel: AccountLevel): Promise<UsageStats> {
  try {
    const userCredits = await getUserCredits(userId, accountLevel);

    return {
      userId,
      accountLevel,
      currentPeriod: {
        start: userCredits.currentPeriodStart,
        end: userCredits.currentPeriodEnd,
        creditsUsed: userCredits.creditsUsed,
        creditsLimit: userCredits.creditsLimit,
        creditsRemaining: userCredits.creditsLimit - userCredits.creditsUsed,
      },
      totals: {
        creditsUsed: userCredits.totalCreditsUsed,
        scriptsGenerated: userCredits.totalScriptsGenerated,
        voicesCreated: userCredits.totalVoicesCreated,
        videosProcessed: userCredits.totalVideosProcessed,
      },
      periodType: accountLevel === "pro" ? "monthly" : "daily",
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to get usage stats:", error);
    throw error;
  }
}

/**
 * Track usage and deduct credits in one operation
 * @param userId - User ID
 * @param operation - Credit operation
 * @param accountLevel - Account level
 * @param usageData - Usage data
 * @returns Operation result
 */
export async function trackUsageAndDeductCredits(
  userId: string,
  operation: CreditOperation,
  accountLevel: AccountLevel,
  usageData: Omit<UsageRecord, "userId" | "creditsUsed" | "operation">,
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const deductionResult = await deductCredits(userId, operation, accountLevel, {
      tokensUsed: usageData.tokensUsed,
      responseTime: usageData.responseTime,
      promptType: usageData.promptType,
    });

    if (deductionResult.success) {
      // Track usage separately
      await trackUsage(userId, operation, usageData);
    }

    return {
      success: deductionResult.success,
      newBalance: deductionResult.newBalance,
    };
  } catch (error) {
    console.error("❌ [Credits] Failed to track usage and deduct credits:", error);
    return {
      success: false,
      newBalance: 0,
    };
  }
}

/**
 * Check and reset credit period if needed
 * @param userCredits - User credits
 * @param accountLevel - Account level
 * @returns True if reset was needed
 */
async function checkAndResetPeriod(userCredits: UserCredits, accountLevel: AccountLevel): Promise<boolean> {
  const now = new Date();
  const periodEnd = new Date(userCredits.currentPeriodEnd);

  if (now > periodEnd) {
    console.log(`🔄 [Credits] Resetting period for user ${userCredits.userId}`);

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Database not available");
    }

    const isProAccount = accountLevel === "pro";
    const newPeriodStart = isProAccount ? getMonthStart() : getDayStart();
    const newPeriodEnd = isProAccount ? getMonthEnd() : getDayEnd();

    const updateData: Partial<UserCredits> = {
      creditsUsed: 0,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      updatedAt: new Date().toISOString(),
    };

    if (isProAccount) {
      updateData.monthlyCreditsUsed = 0;
      updateData.lastMonthlyReset = new Date().toISOString();
    } else {
      updateData.dailyCreditsUsed = 0;
      updateData.lastDailyReset = new Date().toISOString();
    }

    await adminDb.collection("user_credits").doc(userCredits.id!).update(updateData);

    return true;
  }

  return false;
}

// Helper functions for date calculations
function getDayStart(): string {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return startOfDay.toISOString();
}

function getDayEnd(): string {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay.toISOString();
}

function getMonthStart(): string {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString();
}

function getMonthEnd(): string {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return endOfMonth.toISOString();
}

// Import the trackUsage function from usage service
async function trackUsage(userId: string, operation: CreditOperation, usageData: any): Promise<void> {
  // This will be implemented in the usage service
  console.log(`📊 [Credits] Usage tracking placeholder for ${operation}`);
}
