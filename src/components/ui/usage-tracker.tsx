"use client";

import { useEffect } from "react";
import { CreditCard, Clock, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useUsage } from "@/contexts/usage-context";

interface UsageTrackerProps {
  className?: string;
}

export function UsageTracker({ className }: UsageTrackerProps) {
  const { user } = useAuth();
  const { state } = useSidebar();
  const { usageStats, loading, error, refreshUsageStats } = useUsage();

  // Initial load when user changes
  useEffect(() => {
    if (user) {
      refreshUsageStats();
    }
  }, [user, refreshUsageStats]);

  // Hide when sidebar is collapsed (after all hooks are called)
  if (state === "collapsed") {
    return null;
  }

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
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Credits</span>
            </div>
            {isOutOfCredits ? (
              <Badge variant="destructive" className="text-xs">
                <Zap className="mr-1 h-3 w-3" />
                Depleted
              </Badge>
            ) : isLowCredits ? (
              <Badge variant="secondary" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                Low
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={usageStats.percentageUsed} 
              className={`h-2 ${isLowCredits ? 'text-orange-500' : isOutOfCredits ? 'text-red-500' : 'text-green-500'}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usageStats.creditsUsed} used</span>
              <span>{usageStats.creditsRemaining} left</span>
            </div>
          </div>

          {/* Period Info */}
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="capitalize">{usageStats.periodType} limit</span>
              <span>{usageStats.creditsLimit} total</span>
            </div>
            {usageStats.timeUntilReset && (
              <div className="mt-1 text-center">
                <span>Resets in {usageStats.timeUntilReset}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 