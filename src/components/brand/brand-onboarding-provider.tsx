"use client";

import { useEffect } from "react";

import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { BrandProfileService } from "@/lib/brand-profile";

interface BrandOnboardingProviderProps {
  children: React.ReactNode;
}

export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();

  useEffect(() => {
    // Only check for onboarding after auth is complete and user is signed in
    if (!initializing && user) {
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
  }, [user, initializing]);

  return <>{children}</>;
}
