export interface UsageRecord {
  id?: string;
  userId: string;
  service: "gemini" | "openai" | "video_processing" | "voice_training" | "api_call";
  operation: "script_generation" | "voice_training" | "video_analysis" | "api_request" | "collection_add";
  promptType?: "speed_write" | "educational" | "brand_profile" | "voice_analysis";
  tokensUsed?: number;
  creditsUsed: number;
  responseTime: number;
  success: boolean;
  timestamp: string;
  error?: string;
  metadata?: {
    scriptLength?: "20" | "60" | "90";
    voiceId?: string;
    collectionId?: string;
    videoUrl?: string;
    platform?: "TikTok" | "Instagram" | "YouTube";
    [key: string]: any;
  };
}

export interface UserCredits {
  id?: string;
  userId: string;
  accountLevel: "free" | "pro";
  
  // Current period credits
  creditsUsed: number;
  creditsLimit: number;
  
  // Period tracking
  currentPeriodStart: string;
  currentPeriodEnd: string;
  
  // Daily tracking for free users
  dailyCreditsUsed?: number;
  dailyCreditsLimit?: number;
  lastDailyReset?: string;
  
  // Monthly tracking for pro users
  monthlyCreditsUsed?: number;
  monthlyCreditsLimit?: number;
  lastMonthlyReset?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  
  // Usage history
  totalCreditsUsed: number;
  totalScriptsGenerated: number;
  totalVoicesCreated: number;
  totalVideosProcessed: number;
}

export interface CreditTransaction {
  id?: string;
  userId: string;
  creditsUsed: number;
  operation: UsageRecord["operation"];
  operationId?: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  creditsUsed: number;
  creditsRemaining: number;
  creditsLimit: number;
  percentageUsed: number;
  periodType: "daily" | "monthly";
  periodStart: string;
  periodEnd: string;
  timeUntilReset: string;
  canPerformAction: boolean;
}

export interface SocialMediaStats {
  platform: "instagram" | "tiktok";
  username: string;
  followerCount: number;
  weeklyChange: number;
  weeklyChangePercent: number;
  lastUpdated: string;
}

export interface UserSocialStats {
  id?: string;
  userId: string;
  platforms: SocialMediaStats[];
  lastUpdated: string;
}

// Credit cost constants
export const CREDIT_COSTS = {
  SCRIPT_GENERATION: 1,
  VOICE_TRAINING: 80,
  VIDEO_ANALYSIS: 1,
  API_CALL: 1,
  COLLECTION_ADD: 1,
} as const;

// Account limits
export const ACCOUNT_LIMITS = {
  FREE: {
    DAILY_CREDITS: 3,
    MONTHLY_CREDITS: 0,
  },
  PRO: {
    DAILY_CREDITS: 0,
    MONTHLY_CREDITS: 5000,
  },
} as const;

export type CreditOperation = keyof typeof CREDIT_COSTS; 