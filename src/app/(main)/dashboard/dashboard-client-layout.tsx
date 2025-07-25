"use client";

import withAuth from "@/components/auth/with-auth";
import { BrandOnboardingProvider } from "@/components/brand/brand-onboarding-provider";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <BrandOnboardingProvider>{children}</BrandOnboardingProvider>;
}

export default withAuth(DashboardLayout);
