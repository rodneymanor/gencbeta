"use client";

import { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Target, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandProfile, BrandProfileData } from "@/types/brand-profile";

interface ContentPillarsTabProps {
  profile: BrandProfile | null | undefined;
}

export function ContentPillarsTab({ profile }: ContentPillarsTabProps) {
  const [pillars, setPillars] = useState(profile?.profile?.content_pillars ?? []);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Load existing pillars
  useEffect(() => {
    if (profile?.profile?.content_pillars) {
      setPillars(profile.profile.content_pillars);
      setHasUnsavedChanges(false);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { profile: Partial<BrandProfileData> }) =>
      BrandProfileService.updateBrandProfile(profile!.id, data),
    onSuccess: () => {
      toast.success("Content pillars saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast.error("Failed to save content pillars");
    },
  });

  const handlePillarChange = (index: number, field: "pillar_name" | "description", value: string) => {
    const updatedPillars = [...pillars];
    updatedPillars[index] = {
      ...updatedPillars[index],
      [field]: value,
    };
    setPillars(updatedPillars);
    setHasUnsavedChanges(true);
  };

  const handleThemeChange = (pillarIndex: number, themeIndex: number, value: string) => {
    const updatedPillars = [...pillars];
    const updatedThemes = [...updatedPillars[pillarIndex].suggested_themes];
    updatedThemes[themeIndex] = value;
    updatedPillars[pillarIndex] = {
      ...updatedPillars[pillarIndex],
      suggested_themes: updatedThemes,
    };
    setPillars(updatedPillars);
    setHasUnsavedChanges(true);
  };

  const handleAddTheme = (pillarIndex: number) => {
    const updatedPillars = [...pillars];
    updatedPillars[pillarIndex] = {
      ...updatedPillars[pillarIndex],
      suggested_themes: [...updatedPillars[pillarIndex].suggested_themes, ""],
    };
    setPillars(updatedPillars);
    setHasUnsavedChanges(true);
  };

  const handleRemoveTheme = (pillarIndex: number, themeIndex: number) => {
    const updatedPillars = [...pillars];
    const updatedThemes = updatedPillars[pillarIndex].suggested_themes.filter((_, i) => i !== themeIndex);
    updatedPillars[pillarIndex] = {
      ...updatedPillars[pillarIndex],
      suggested_themes: updatedThemes,
    };
    setPillars(updatedPillars);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (profile?.profile) {
      updateProfileMutation.mutate({
        profile: {
          ...profile.profile,
          content_pillars: pillars,
        },
      });
    }
  };

  const handleExport = () => {
    const exportData = {
      profile: profile?.questionnaire?.profession ?? "Unknown",
      generated: new Date().toLocaleDateString(),
      content_pillars: pillars,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "content-pillars.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Content pillars exported successfully!");
  };

  const isSaving = updateProfileMutation.isPending;

  if (!profile?.profile) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center text-center">
          <div className="space-y-3">
            <Target className="text-muted-foreground mx-auto h-12 w-12" />
            <div>
              <h3 className="text-lg font-semibold">No Content Pillars Yet</h3>
              <p className="text-muted-foreground text-sm">
                Complete the Questions tab and generate your brand profile to see content pillars
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Content Pillars ({pillars.length})
              </CardTitle>
              <CardDescription>
                Your core content themes that define your brand messaging and content strategy
              </CardDescription>
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

      {/* Content Pillars */}
      <div className="grid gap-6">
        {pillars.map((pillar, pillarIndex) => (
          <Card key={pillarIndex}>
            <CardHeader>
              <CardTitle className="text-lg">Pillar {pillarIndex + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pillar Name */}
              <div className="space-y-2">
                <Label htmlFor={`pillar-name-${pillarIndex}`}>Pillar Name</Label>
                <Input
                  id={`pillar-name-${pillarIndex}`}
                  value={pillar.pillar_name}
                  onChange={(e) => handlePillarChange(pillarIndex, "pillar_name", e.target.value)}
                  placeholder="Enter pillar name..."
                />
              </div>

              {/* Pillar Description */}
              <div className="space-y-2">
                <Label htmlFor={`pillar-description-${pillarIndex}`}>Description</Label>
                <Textarea
                  id={`pillar-description-${pillarIndex}`}
                  value={pillar.description}
                  onChange={(e) => handlePillarChange(pillarIndex, "description", e.target.value)}
                  placeholder="Describe what this pillar represents..."
                  className="min-h-[80px]"
                />
              </div>

              <Separator />

              {/* Suggested Themes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Suggested Content Themes</Label>
                  <Button onClick={() => handleAddTheme(pillarIndex)} variant="outline" size="sm" className="h-8">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Theme
                  </Button>
                </div>
                <div className="space-y-2">
                  {pillar.suggested_themes.map((theme, themeIndex) => (
                    <div key={themeIndex} className="flex items-center gap-2">
                      <Input
                        value={theme}
                        onChange={(e) => handleThemeChange(pillarIndex, themeIndex, e.target.value)}
                        placeholder={`Theme ${themeIndex + 1}...`}
                        className="flex-1"
                      />
                      {pillar.suggested_themes.length > 1 && (
                        <Button
                          onClick={() => handleRemoveTheme(pillarIndex, themeIndex)}
                          variant="outline"
                          size="sm"
                          className="h-10 w-10 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Actions */}
      {hasUnsavedChanges && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground text-sm">You have unsaved changes to your content pillars</div>
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
