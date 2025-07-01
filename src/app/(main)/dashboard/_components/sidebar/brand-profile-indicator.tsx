"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";

import { BrandProfileService } from "@/lib/brand-profile";

export function BrandProfileIndicator() {
  const { data: profilesData } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.getBrandProfiles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasProfile = Boolean(profilesData?.activeProfile?.profile);

  if (hasProfile) {
    return null; // Don't show indicator if profile is complete
  }

  return (
    <div className="bg-primary/90 ml-auto flex h-5 w-5 items-center justify-center rounded-full">
      <Sparkles className="h-3 w-3 text-white" />
    </div>
  );
}
