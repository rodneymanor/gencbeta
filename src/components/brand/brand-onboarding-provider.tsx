"use client";

import { useState, useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandProfile } from "@/types/brand-profile";

import { BrandOnboardingDialog } from "./brand-onboarding-dialog";

interface BrandOnboardingProviderProps {
  children: React.ReactNode;
}

export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Only check for onboarding after auth is complete and user is signed in
    if (!initializing && user) {
      const shouldShow = BrandProfileService.shouldShowOnboarding();
      if (shouldShow) {
        // Small delay to ensure UI is fully loaded
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [user, initializing]);

  const handleOnboardingComplete = (profile: BrandProfile) => {
    setShowOnboarding(false);
    console.log("✅ [BRAND] Onboarding completed, profile created:", profile.id);
  };

  return (
    <>
      {children}
      <BrandOnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </>
  );
}
