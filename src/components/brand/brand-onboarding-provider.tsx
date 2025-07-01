"use client";

import { useEffect } from "react";

import { useRouter, usePathname } from "next/navigation";

import { useAuth } from "@/contexts/auth-context";
import { BrandProfileService } from "@/lib/brand-profile";

interface BrandOnboardingProviderProps {
  children: React.ReactNode;
}

export function BrandOnboardingProvider({ children }: BrandOnboardingProviderProps) {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check for onboarding after auth is complete and user is signed in
    if (!initializing && user) {
      const shouldShow = BrandProfileService.shouldShowOnboarding();

      // Don't redirect if already on the my-brand page
      if (shouldShow && pathname !== "/dashboard/my-brand") {
        // Small delay to ensure UI is fully loaded
        const timer = setTimeout(() => {
          router.push("/dashboard/my-brand");
        }, 1000);

        return () => clearTimeout(timer);
      }
    }
  }, [user, initializing, router, pathname]);

  return <>{children}</>;
}
