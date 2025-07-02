"use client";

import { useState, useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { FileText, MessageSquare, Target, Hash, AlertCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandProfileService } from "@/lib/brand-profile";

import { ContentPillarsTab } from "./content-pillars-tab";
import { KeywordsTab } from "./keywords-tab";
import { OverviewTab } from "./overview-tab";
import { QuestionsTab } from "./questions-tab";

type TabValue = "overview" | "questions" | "pillars" | "keywords";

export function BrandProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>("questions");
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  // Fetch brand profiles
  const { data: profilesData, isLoading } = useQuery({
    queryKey: ["brand-profiles"],
    queryFn: () => BrandProfileService.getBrandProfiles(),
  });

  const activeProfile = profilesData?.activeProfile;
  const hasGeneratedProfile = Boolean(activeProfile?.profile);

  // Check if user should be prompted to complete brand profile
  const shouldShowPrompt = !hasGeneratedProfile && BrandProfileService.shouldShowOnboarding();

  // Tab configuration
  const tabs = [
    {
      value: "overview" as TabValue,
      label: "Overview",
      icon: FileText,
      disabled: !hasGeneratedProfile,
    },
    {
      value: "questions" as TabValue,
      label: "Questions",
      icon: MessageSquare,
      disabled: false, // Always accessible
    },
    {
      value: "pillars" as TabValue,
      label: "Content Pillars",
      icon: Target,
      disabled: !hasGeneratedProfile,
    },
    {
      value: "keywords" as TabValue,
      label: "Keywords",
      icon: Hash,
      disabled: !hasGeneratedProfile,
    },
  ];

  // Auto-switch to overview tab after generation (only once)
  useEffect(() => {
    if (hasGeneratedProfile && activeTab === "questions" && !hasAutoSwitched) {
      setActiveTab("overview");
      setHasAutoSwitched(true);
    }
    // Reset auto-switch flag when profile is removed
    if (!hasGeneratedProfile) {
      setHasAutoSwitched(false);
    }
  }, [hasGeneratedProfile, activeTab, hasAutoSwitched]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 h-2 w-2 animate-pulse rounded-full" />
            <div className="bg-primary/20 h-2 w-2 animate-pulse rounded-full" style={{ animationDelay: "0.1s" }} />
            <div className="bg-primary/20 h-2 w-2 animate-pulse rounded-full" style={{ animationDelay: "0.2s" }} />
            <span className="text-muted-foreground ml-2">Loading brand profile...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Prompt Banner */}
      {shouldShowPrompt && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Welcome to My Brand!</strong> Complete the questions below and generate your personalized brand
            profile to unlock content pillars and keyword strategies.
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-6">
        <TabsList className="bg-muted/30 grid h-12 w-full grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="overview" className="space-y-0">
          <OverviewTab profile={activeProfile} />
        </TabsContent>

        <TabsContent value="questions" className="space-y-0">
          <QuestionsTab profile={activeProfile} onProfileGenerated={() => setActiveTab("overview")} />
        </TabsContent>

        <TabsContent value="pillars" className="space-y-0">
          <ContentPillarsTab profile={activeProfile} />
        </TabsContent>

        <TabsContent value="keywords" className="space-y-0">
          <KeywordsTab profile={activeProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
