import { adminDb } from "@/lib/firebase-admin";
import { 
  UserCredits, 
  CreditTransaction, 
  UsageStats, 
  UsageRecord,
  CREDIT_COSTS,
  ACCOUNT_LIMITS,
  CreditOperation 
} from "@/types/usage-tracking";
import { AccountLevel } from "@/lib/auth-cache";

export class CreditsService {
  private static readonly COLLECTIONS = {
    USER_CREDITS: "user_credits",
    CREDIT_TRANSACTIONS: "credit_transactions",
    USAGE_TRACKING: "usage_tracking",
  } as const;

  static async initializeUserCredits(userId: string, accountLevel: AccountLevel): Promise<UserCredits> {
    try {
      const now = new Date().toISOString();
      const isProAccount = accountLevel === "pro";
      
      const periodStart = isProAccount ? this.getMonthStart() : this.getDayStart();
      const periodEnd = isProAccount ? this.getMonthEnd() : this.getDayEnd();
      
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

      const docRef = await adminDb.collection(this.COLLECTIONS.USER_CREDITS).add(userCredits);
      
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

  static async getUserCredits(userId: string, accountLevel: AccountLevel): Promise<UserCredits> {
    try {
      const snapshot = await adminDb
        .collection(this.COLLECTIONS.USER_CREDITS)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      let userCredits: UserCredits;

      if (snapshot.empty) {
        userCredits = await this.initializeUserCredits(userId, accountLevel);
      } else {
        userCredits = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserCredits;
        
        const needsReset = await this.checkAndResetPeriod(userCredits, accountLevel);
        if (needsReset) {
          userCredits = await this.getUserCredits(userId, accountLevel);
        }
      }

      return userCredits;
    } catch (error) {
      console.error("❌ [Credits] Failed to get user credits:", error);
      throw error;
    }
  }

  static async canPerformAction(
    userId: string, 
    operation: CreditOperation, 
    accountLevel: AccountLevel
  ): Promise<{ canPerform: boolean; reason?: string; creditsNeeded: number }> {
    try {
      const userCredits = await this.getUserCredits(userId, accountLevel);
      const creditsNeeded = CREDIT_COSTS[operation];
      const creditsRemaining = userCredits.creditsLimit - userCredits.creditsUsed;

      if (creditsRemaining >= creditsNeeded) {
        return { canPerform: true, creditsNeeded };
      }

      const periodType = accountLevel === "pro" ? "monthly" : "daily";
      return { 
        canPerform: false, 
        reason: `Insufficient credits. Need ${creditsNeeded}, have ${creditsRemaining}. Resets ${periodType}.`,
        creditsNeeded 
      };
    } catch (error) {
      console.error("❌ [Credits] Failed to check action permission:", error);
      return { canPerform: false, reason: "Error checking credits", creditsNeeded: 0 };
    }
  }

  static async deductCredits(
    userId: string,
    operation: CreditOperation,
    accountLevel: AccountLevel,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; newBalance: number; transaction?: CreditTransaction }> {
    try {
      const userCredits = await this.getUserCredits(userId, accountLevel);
      const creditsToDeduct = CREDIT_COSTS[operation];
      
      const creditsRemaining = userCredits.creditsLimit - userCredits.creditsUsed;
      if (creditsRemaining < creditsToDeduct) {
        return { 
          success: false, 
          newBalance: creditsRemaining,
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

      if (accountLevel === "free") {
        updateData.dailyCreditsUsed = (userCredits.dailyCreditsUsed ?? 0) + creditsToDeduct;
      } else {
        updateData.monthlyCreditsUsed = (userCredits.monthlyCreditsUsed ?? 0) + creditsToDeduct;
      }

      const batch = adminDb.batch();
      
      const userCreditsRef = adminDb.collection(this.COLLECTIONS.USER_CREDITS).doc(userCredits.id!);
      batch.update(userCreditsRef, updateData);
      
      const transactionRef = adminDb.collection(this.COLLECTIONS.CREDIT_TRANSACTIONS).doc();
      batch.set(transactionRef, transaction);
      
      await batch.commit();

      console.log(`💳 [Credits] Deducted ${creditsToDeduct} credits for ${operation} (user: ${userId})`);

      return {
        success: true,
        newBalance: transaction.balanceAfter,
        transaction: { id: transactionRef.id, ...transaction },
      };
    } catch (error) {
      console.error("❌ [Credits] Failed to deduct credits:", error);
      return { success: false, newBalance: 0 };
    }
  }

  static async getUsageStats(userId: string, accountLevel: AccountLevel): Promise<UsageStats> {
    try {
      const userCredits = await this.getUserCredits(userId, accountLevel);
      const creditsRemaining = userCredits.creditsLimit - userCredits.creditsUsed;
      const percentageUsed = (userCredits.creditsUsed / userCredits.creditsLimit) * 100;
      
      const isProAccount = accountLevel === "pro";
      const periodType = isProAccount ? "monthly" : "daily";
      
      const periodEnd = new Date(userCredits.currentPeriodEnd);
      const now = new Date();
      const timeUntilReset = this.formatTimeUntilReset(periodEnd, now);

      return {
        creditsUsed: userCredits.creditsUsed,
        creditsRemaining,
        creditsLimit: userCredits.creditsLimit,
        percentageUsed: Math.round(percentageUsed),
        periodType,
        periodStart: userCredits.currentPeriodStart,
        periodEnd: userCredits.currentPeriodEnd,
        timeUntilReset,
        canPerformAction: creditsRemaining >= 1,
      };
    } catch (error) {
      console.error("❌ [Credits] Failed to get usage stats:", error);
      throw error;
    }
  }

  static async trackUsageAndDeductCredits(
    userId: string,
    operation: CreditOperation,
    accountLevel: AccountLevel,
    usageData: Omit<UsageRecord, "userId" | "creditsUsed" | "operation">
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      const deductResult = await this.deductCredits(userId, operation, accountLevel, usageData.metadata);
      
      if (!deductResult.success) {
        return deductResult;
      }

      const usageRecord: Omit<UsageRecord, "id"> = {
        ...usageData,
        userId,
        operation,
        creditsUsed: CREDIT_COSTS[operation],
      };

      await adminDb.collection(this.COLLECTIONS.USAGE_TRACKING).add(usageRecord);

      console.log(`📊 [Credits] Tracked usage and deducted credits for ${operation}`);
      
      return deductResult;
    } catch (error) {
      console.error("❌ [Credits] Failed to track usage and deduct credits:", error);
      return { success: false, newBalance: 0 };
    }
  }

  private static async checkAndResetPeriod(
    userCredits: UserCredits, 
    accountLevel: AccountLevel
  ): Promise<boolean> {
    const now = new Date();
    const isProAccount = accountLevel === "pro";
    
    let needsReset = false;
    const updateData: Partial<UserCredits> = {};

    if (isProAccount) {
      const lastReset = new Date(userCredits.lastMonthlyReset || userCredits.createdAt);
      const monthStart = this.getMonthStart();
      
      if (now >= new Date(monthStart) && lastReset < new Date(monthStart)) {
        needsReset = true;
        updateData.monthlyCreditsUsed = 0;
        updateData.creditsUsed = 0;
        updateData.lastMonthlyReset = now.toISOString();
        updateData.currentPeriodStart = monthStart;
        updateData.currentPeriodEnd = this.getMonthEnd();
      }
    } else {
      const lastReset = new Date(userCredits.lastDailyReset || userCredits.createdAt);
      const dayStart = this.getDayStart();
      
      if (now >= new Date(dayStart) && lastReset < new Date(dayStart)) {
        needsReset = true;
        updateData.dailyCreditsUsed = 0;
        updateData.creditsUsed = 0;
        updateData.lastDailyReset = now.toISOString();
        updateData.currentPeriodStart = dayStart;
        updateData.currentPeriodEnd = this.getDayEnd();
      }
    }

    if (needsReset) {
      updateData.updatedAt = now.toISOString();
      
      await adminDb
        .collection(this.COLLECTIONS.USER_CREDITS)
        .doc(userCredits.id!)
        .update(updateData);
        
      console.log(`🔄 [Credits] Reset ${isProAccount ? 'monthly' : 'daily'} credits for user ${userCredits.userId}`);
    }

    return needsReset;
  }

  private static getDayStart(): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  private static getDayEnd(): string {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now.toISOString();
  }

  private static getMonthStart(): string {
    const now = new Date();
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }

  private static getMonthEnd(): string {
    const now = new Date();
    now.setMonth(now.getMonth() + 1);
    now.setDate(0);
    now.setHours(23, 59, 59, 999);
    return now.toISOString();
  }

  private static formatTimeUntilReset(periodEnd: Date, now: Date): string {
    const diff = periodEnd.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
} 