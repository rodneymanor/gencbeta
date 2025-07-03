"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UsageStats } from "@/types/usage-tracking";

interface UsageContextType {
  usageStats: UsageStats | null;
  loading: boolean;
  error: string | null;
  refreshUsageStats: () => Promise<void>;
  triggerUsageUpdate: () => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

interface UsageProviderProps {
  children: ReactNode;
}

export function UsageProvider({ children }: UsageProviderProps) {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refreshUsageStats = useCallback(async () => {
    if (!user) {
      setUsageStats(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/usage/stats", {
        headers: {
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usage stats");
      }

      const data = await response.json();
      console.log("📊 [UsageContext] Updated usage stats:", data);
      
      // Validate that we have the required fields
      if (data && typeof data.creditsUsed === 'number' && typeof data.creditsLimit === 'number') {
        setUsageStats(data);
        setError(null);
      } else {
        console.error("❌ [UsageContext] Invalid usage stats data:", data);
        setError("Invalid usage data received");
      }
    } catch (err) {
      console.error("❌ [UsageContext] Failed to fetch usage stats:", err);
      setError("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounced trigger to avoid multiple rapid calls
  const triggerUsageUpdate = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      console.log("🔄 [UsageContext] Triggering usage stats refresh after credit consumption");
      refreshUsageStats();
    }, 1000); // 1 second delay to allow backend to process
  }, [refreshUsageStats]);

  const value: UsageContextType = {
    usageStats,
    loading,
    error,
    refreshUsageStats,
    triggerUsageUpdate,
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
}

export function useUsage() {
  const context = useContext(UsageContext);
  if (context === undefined) {
    throw new Error("useUsage must be used within a UsageProvider");
  }
  return context;
} 