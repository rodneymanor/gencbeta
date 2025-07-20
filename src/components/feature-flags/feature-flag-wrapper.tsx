"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { FeatureFlagService } from "@/lib/feature-flags";
import { FeatureFlags } from "@/types/feature-flags";

interface FeatureFlagWrapperProps {
  flagName: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

export function FeatureFlagWrapper({ flagName, children, fallback, loading }: FeatureFlagWrapperProps) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFeatureFlag() {
      if (!user) {
        setIsEnabled(false);
        setIsLoading(false);
        return;
      }

      try {
        const enabled = await FeatureFlagService.isEnabled(user.uid, flagName);
        setIsEnabled(enabled);
      } catch (error) {
        console.error(`Error checking feature flag '${flagName}':`, error);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkFeatureFlag();
  }, [user, flagName]);

  if (isLoading) {
    return loading || <div>Loading...</div>;
  }

  if (!isEnabled) {
    return (
      fallback || (
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Feature Not Available</h1>
            <p className="text-muted-foreground">This feature is currently not available.</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
