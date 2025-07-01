"use client";

import { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Hash, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandProfile, BrandProfileData } from "@/types/brand-profile";

import { HashtagCategoryCard } from "./hashtag-category-card";
import { KeywordCategoryCard } from "./keyword-category-card";

interface KeywordsTabProps {
  profile: BrandProfile | null | undefined;
}

// Configuration constants
const KEYWORD_CATEGORIES = [
  {
    key: "core_keywords",
    title: "Core Keywords",
    description: "Primary keywords that define your business and expertise",
    variant: "default" as const,
  },
  {
    key: "audience_keywords",
    title: "Audience Keywords",
    description: "Terms your target audience uses when searching for solutions",
    variant: "secondary" as const,
  },
  {
    key: "problem_aware_keywords",
    title: "Problem-Aware Keywords",
    description: "Keywords for audiences who know they have a problem",
    variant: "outline" as const,
  },
  {
    key: "solution_aware_keywords",
    title: "Solution-Aware Keywords",
    description: "Keywords for audiences who know what solutions exist",
    variant: "destructive" as const,
  },
];

const HASHTAG_CATEGORIES = [
  {
    key: "broad_hashtags",
    title: "Broad Hashtags",
    category: "broad" as const,
    description: "Wide-reaching hashtags for general exposure",
  },
  {
    key: "niche_hashtags",
    title: "Niche Hashtags",
    category: "niche" as const,
    description: "Specific hashtags for your target market",
  },
  {
    key: "community_hashtags",
    title: "Community Hashtags",
    category: "community" as const,
    description: "Hashtags for community building and engagement",
  },
];

// Empty state component
function EmptyKeywordsState() {
  return (
    <Card>
      <CardContent className="flex h-64 items-center justify-center text-center">
        <div className="space-y-3">
          <Hash className="text-muted-foreground mx-auto h-12 w-12" />
          <div>
            <h3 className="text-lg font-semibold">No Keywords Yet</h3>
            <p className="text-muted-foreground text-sm">
              Complete the Questions tab and generate your brand profile to see keywords
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KeywordsTab({ profile }: KeywordsTabProps) {
  const [keywords, setKeywords] = useState({
    core_keywords: [] as string[],
    audience_keywords: [] as string[],
    problem_aware_keywords: [] as string[],
    solution_aware_keywords: [] as string[],
    suggested_hashtags: {
      broad: [] as string[],
      niche: [] as string[],
      community: [] as string[],
    },
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newKeywordInputs, setNewKeywordInputs] = useState({
    core_keywords: "",
    audience_keywords: "",
    problem_aware_keywords: "",
    solution_aware_keywords: "",
    broad_hashtags: "",
    niche_hashtags: "",
    community_hashtags: "",
  });

  const queryClient = useQueryClient();

  // Load existing keywords
  useEffect(() => {
    if (profile?.profile) {
      setKeywords({
        core_keywords: profile.profile.core_keywords ?? [],
        audience_keywords: profile.profile.audience_keywords ?? [],
        problem_aware_keywords: profile.profile.problem_aware_keywords ?? [],
        solution_aware_keywords: profile.profile.solution_aware_keywords ?? [],
        suggested_hashtags: profile.profile.suggested_hashtags ?? {
          broad: [],
          niche: [],
          community: [],
        },
      });
      setHasUnsavedChanges(false);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { profile: Partial<BrandProfileData> }) =>
      BrandProfileService.updateBrandProfile(profile!.id, data),
    onSuccess: () => {
      toast.success("Keywords saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast.error("Failed to save keywords");
    },
  });

  const handleAddKeyword = (category: keyof typeof newKeywordInputs) => {
    const value = newKeywordInputs[category].trim();
    if (!value) return;

    if (category.includes("hashtags")) {
      const hashtagCategory = category.replace("_hashtags", "") as "broad" | "niche" | "community";
      setKeywords((prev) => ({
        ...prev,
        suggested_hashtags: {
          ...prev.suggested_hashtags,
          [hashtagCategory]: [...prev.suggested_hashtags[hashtagCategory], value.replace("#", "")],
        },
      }));
    } else {
      const keywordCategory = category as keyof Omit<typeof keywords, "suggested_hashtags">;
      setKeywords((prev) => ({
        ...prev,
        [keywordCategory]: [...prev[keywordCategory], value],
      }));
    }

    setNewKeywordInputs((prev) => ({ ...prev, [category]: "" }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveKeyword = (category: string, index: number) => {
    if (category.includes("hashtags")) {
      const hashtagCategory = category.replace("_hashtags", "") as "broad" | "niche" | "community";
      setKeywords((prev) => ({
        ...prev,
        suggested_hashtags: {
          ...prev.suggested_hashtags,
          [hashtagCategory]: prev.suggested_hashtags[hashtagCategory].filter((_, i) => i !== index),
        },
      }));
    } else {
      const keywordCategory = category as keyof Omit<typeof keywords, "suggested_hashtags">;
      setKeywords((prev) => ({
        ...prev,
        [keywordCategory]: prev[keywordCategory].filter((_, i) => i !== index),
      }));
    }
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (profile?.profile) {
      updateProfileMutation.mutate({
        profile: {
          ...profile.profile,
          ...keywords,
        },
      });
    }
  };

  const handleExport = () => {
    const exportData = {
      profile: profile?.questionnaire?.profession ?? "Unknown",
      generated: new Date().toLocaleDateString(),
      keywords: keywords,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Keywords exported successfully!");
  };

  const isSaving = updateProfileMutation.isPending;

  if (!profile?.profile) {
    return <EmptyKeywordsState />;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Keywords & Hashtags
              </CardTitle>
              <CardDescription>Strategic keywords and hashtags for content optimization and discovery</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              {hasUnsavedChanges && (
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Keyword Categories */}
      <div className="grid gap-6">
        {KEYWORD_CATEGORIES.map((category) => (
          <KeywordCategoryCard
            key={category.key}
            title={category.title}
            description={category.description}
            keywords={keywords[category.key as keyof Omit<typeof keywords, "suggested_hashtags">]}
            newKeywordValue={newKeywordInputs[category.key as keyof typeof newKeywordInputs]}
            variant={category.variant}
            onAddKeyword={() => handleAddKeyword(category.key as keyof typeof newKeywordInputs)}
            onRemoveKeyword={(index) => handleRemoveKeyword(category.key, index)}
            onNewKeywordChange={(value) => setNewKeywordInputs((prev) => ({ ...prev, [category.key]: value }))}
          />
        ))}

        <Separator />

        {/* Hashtag Categories */}
        {HASHTAG_CATEGORIES.map((category) => (
          <HashtagCategoryCard
            key={category.key}
            title={category.title}
            description={category.description}
            hashtags={keywords.suggested_hashtags[category.category]}
            newHashtagValue={newKeywordInputs[category.key as keyof typeof newKeywordInputs]}
            onAddHashtag={() => handleAddKeyword(category.key as keyof typeof newKeywordInputs)}
            onRemoveHashtag={(index) => handleRemoveKeyword(`${category.category}_hashtags`, index)}
            onNewHashtagChange={(value) => setNewKeywordInputs((prev) => ({ ...prev, [category.key]: value }))}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      {hasUnsavedChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">
                You have unsaved changes to your keywords and hashtags
              </div>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
