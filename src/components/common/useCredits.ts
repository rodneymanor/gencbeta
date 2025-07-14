/**
 * useCredits Hook
 * Centralized credits management hook for consistent credit operations
 */

"use client";

import { useState, useCallback, useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { useBillingService } from "@/core/billing";

export interface CreditsState {
  available: number;
  used: number;
  limit: number;
  percentageUsed: number;
  isLoading: boolean;
  error: string | null;
}

export interface CreditsControls {
  deductCredits: (amount: number, operation: string) => Promise<boolean>;
  refundCredits: (amount: number, operation: string) => Promise<boolean>;
  refreshCredits: () => Promise<void>;
  checkCredits: (required: number) => boolean;
}

export interface CreditsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onInsufficientCredits?: (required: number, available: number) => void;
  onCreditsUpdated?: (state: CreditsState) => void;
}

export function useCredits(options: CreditsOptions = {}): [CreditsState, CreditsControls] {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    onInsufficientCredits,
    onCreditsUpdated,
  } = options;

  const [state, setState] = useState<CreditsState>({
    available: 0,
    used: 0,
    limit: 0,
    percentageUsed: 0,
    isLoading: true,
    error: null,
  });

  const { user } = useAuth();
  const { getCredits, deductCredits: deductCreditsService, refundCredits: refundCreditsService } = useBillingService();

  const calculatePercentage = useCallback((used: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  }, []);

  const updateState = useCallback(
    (creditsData: { available: number; used: number; limit: number }) => {
      const { available, used, limit } = creditsData;
      const percentageUsed = calculatePercentage(used, limit);

      const newState = {
        available,
        used,
        limit,
        percentageUsed,
        isLoading: false,
        error: null,
      };

      setState(newState);
      onCreditsUpdated?.(newState);
    },
    [calculatePercentage, onCreditsUpdated],
  );

  const refreshCredits = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, isLoading: false, error: "User not authenticated" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const credits = await getCredits(user.uid);
      updateState(credits);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch credits";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [user, getCredits, updateState]);

  const deductCredits = useCallback(
    async (amount: number, operation: string): Promise<boolean> => {
      if (!user) {
        setState((prev) => ({ ...prev, error: "User not authenticated" }));
        return false;
      }

      if (state.available < amount) {
        onInsufficientCredits?.(amount, state.available);
        return false;
      }

      try {
        const success = await deductCreditsService(user.uid, amount, operation);
        if (success) {
          // Update local state immediately for better UX
          const newUsed = state.used + amount;
          const newAvailable = state.available - amount;
          updateState({
            available: newAvailable,
            used: newUsed,
            limit: state.limit,
          });
        }
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to deduct credits";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [user, state.available, state.used, state.limit, deductCreditsService, updateState, onInsufficientCredits],
  );

  const refundCredits = useCallback(
    async (amount: number, operation: string): Promise<boolean> => {
      if (!user) {
        setState((prev) => ({ ...prev, error: "User not authenticated" }));
        return false;
      }

      try {
        const success = await refundCreditsService(user.uid, amount, operation);
        if (success) {
          // Update local state immediately for better UX
          const newUsed = Math.max(0, state.used - amount);
          const newAvailable = Math.min(state.limit, state.available + amount);
          updateState({
            available: newAvailable,
            used: newUsed,
            limit: state.limit,
          });
        }
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to refund credits";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [user, state.available, state.used, state.limit, refundCreditsService, updateState],
  );

  const checkCredits = useCallback(
    (required: number): boolean => {
      return state.available >= required;
    },
    [state.available],
  );

  // Initial load
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(refreshCredits, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshCredits, user]);

  const controls: CreditsControls = {
    deductCredits,
    refundCredits,
    refreshCredits,
    checkCredits,
  };

  return [state, controls];
}

// Specialized hook for credit checking
export function useCreditCheck(requiredCredits: number) {
  const [creditsState, creditsControls] = useCredits();

  const hasEnoughCredits = creditsState.available >= requiredCredits;
  const creditsNeeded = Math.max(0, requiredCredits - creditsState.available);

  return {
    hasEnoughCredits,
    creditsNeeded,
    creditsState,
    creditsControls,
  };
}

// Hook for credit usage tracking
export interface CreditUsage {
  operation: string;
  amount: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export function useCreditUsageTracking() {
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([]);
  const [creditsState, creditsControls] = useCredits();

  const trackUsage = useCallback((operation: string, amount: number, success: boolean, error?: string) => {
    const usage: CreditUsage = {
      operation,
      amount,
      timestamp: new Date(),
      success,
      error,
    };

    setUsageHistory((prev) => [usage, ...prev.slice(0, 49)]); // Keep last 50 entries
  }, []);

  const deductCreditsWithTracking = useCallback(
    async (amount: number, operation: string): Promise<boolean> => {
      try {
        const success = await creditsControls.deductCredits(amount, operation);
        trackUsage(operation, amount, success);
        return success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        trackUsage(operation, amount, false, errorMessage);
        throw error;
      }
    },
    [creditsControls, trackUsage],
  );

  const getUsageStats = useCallback(() => {
    const totalUsed = usageHistory.filter((u) => u.success).reduce((sum, u) => sum + u.amount, 0);

    const totalFailed = usageHistory.filter((u) => !u.success).reduce((sum, u) => sum + u.amount, 0);

    const operationBreakdown = usageHistory
      .filter((u) => u.success)
      .reduce(
        (acc, u) => {
          acc[u.operation] = (acc[u.operation] || 0) + u.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

    return {
      totalUsed,
      totalFailed,
      operationBreakdown,
      recentUsage: usageHistory.slice(0, 10),
    };
  }, [usageHistory]);

  return {
    creditsState,
    creditsControls: {
      ...creditsControls,
      deductCredits: deductCreditsWithTracking,
    },
    usageHistory,
    getUsageStats,
  };
}
