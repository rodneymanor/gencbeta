"use client";

import { useEffect, useState } from "react";
import { CreditCard, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { UsageStats } from "@/types/usage-tracking";

interface UsageTrackerProps {
  className?: string;
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { user, accountLevel } = useAuth();
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStats = async () => {
    if (!user) return;

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
      setUsageStats(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch usage stats:", err);
      setError("Failed to load usage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchUsageStats, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (!user || loading) {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usageStats) {
    return (
      <Card className={className}>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">Credits unavailable</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLowCredits = usageStats.percentageUsed >= 80;
  const isOutOfCredits = usageStats.creditsRemaining === 0;

  return (
    <Card className={className}>
      <CardContent className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Credits</span>
          </div>
          <Badge variant={accountLevel === "pro" ? "default" : "secondary"} className="text-xs">
            {accountLevel === "pro" ? "Pro" : "Free"}
          </Badge>
        </div>

        {/* Usage Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {usageStats.creditsUsed} / {usageStats.creditsLimit} used
            </span>
            <span className={`font-medium ${isOutOfCredits ? 'text-destructive' : isLowCredits ? 'text-warning' : 'text-muted-foreground'}`}>
              {usageStats.creditsRemaining} left
            </span>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={usageStats.percentageUsed} 
            className="h-2"
            indicatorClassName={
              isOutOfCredits 
                ? "bg-destructive" 
                : isLowCredits 
                  ? "bg-warning" 
                  : "bg-primary"
            }
          />

          {/* Reset Timer */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Resets in {usageStats.timeUntilReset}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {accountLevel === "free" && (
          <div className="pt-1">
            <button 
              className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors"
              onClick={() => {
                // TODO: Navigate to upgrade page
                console.log("Navigate to upgrade");
              }}
            >
              <Zap className="h-3 w-3" />
              Upgrade for more credits
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 