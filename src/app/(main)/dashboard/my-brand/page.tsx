"use client";

import { Sparkles } from "lucide-react";

import { BrandProfileTabs } from "./_components/brand-profile-tabs";

export default function MyBrandPage() {
  return (
    <div className="container mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Brand</h1>
          <p className="text-muted-foreground text-lg">
            Define your brand identity and generate personalized content strategies
          </p>
        </div>
      </div>

      {/* Main Content */}
      <BrandProfileTabs />
    </div>
  );
}
