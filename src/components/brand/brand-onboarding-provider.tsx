"use client";

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { BrandProfileService } from "@/lib/brand-profile";

interface BrandOnboardingProviderProps {
  children: React.ReactNode;
}

export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();

  // Fetch brand profiles to check if user has one
  const { data: profilesData } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.getBrandProfiles(),
    enabled: !initializing && !!user, // Only fetch when user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasGeneratedProfile = Boolean(profilesData?.activeProfile?.profile);

  useEffect(() => {
    // Only check for onboarding after auth is complete and user is signed in
    if (!initializing && user) {
      // If user has a generated profile, mark onboarding as complete
      if (hasGeneratedProfile) {
        BrandProfileService.markOnboardingComplete();
        return;
      }

      const shouldShow = BrandProfileService.shouldShowOnboarding();

      if (shouldShow) {
        // Show a subtle toast notification instead of forcing redirect
        const timer = setTimeout(() => {
          toast("✨ Complete your brand profile", {
            description: "Define your brand identity to unlock personalized content strategies",
            action: {
              label: "Get Started",
              onClick: () => {
                window.location.href = "/dashboard/my-brand";
              },
            },
            duration: 8000, // Show for 8 seconds
          });
        }, 2000); // Wait 2 seconds before showing

        return () => clearTimeout(timer);
      }
    }
  }, [user, initializing, hasGeneratedProfile]);

  return <>{children}</>;
}
