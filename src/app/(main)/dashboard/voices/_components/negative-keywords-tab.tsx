"use client";

import { useState } from "react";
import { Plus, X, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNegativeKeywords } from "@/hooks/use-negative-keywords";
import { DEFAULT_NEGATIVE_KEYWORDS, getEffectiveNegativeKeywords } from "@/data/negative-keywords";

export function NegativeKeywordsTab() {
  const {
    negativeKeywords,
    isLoading,
    error,
    addCustomKeyword,
    removeCustomKeyword,
    toggleDefaultKeyword,
    resetToDefault,
    isAddingKeyword,
    isRemovingKeyword,

    isResetting,
  } = useNegativeKeywords();

  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    try {
      await addCustomKeyword(newKeyword.trim());
      setNewKeyword("");
      toast.success("Custom keyword added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add keyword");
    }
  };

  const handleRemoveCustomKeyword = async (keyword: string) => {
    try {
      await removeCustomKeyword(keyword);
      toast.success("Custom keyword removed");
    } catch {
      toast.error("Failed to remove keyword");
    }
  };

  const handleToggleDefault = async (keyword: string) => {
    try {
      await toggleDefaultKeyword(keyword);
      const isCurrentlyRemoved = negativeKeywords?.settings.userRemovedKeywords.includes(keyword);
      toast.success(isCurrentlyRemoved ? "Keyword restored" : "Keyword disabled");
    } catch {
      toast.error("Failed to toggle keyword");
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset to default keywords? This will remove all custom keywords and restore all default keywords.")) {
      return;
    }

    try {
      await resetToDefault();
      toast.success("Keywords reset to default");
    } catch {
      toast.error("Failed to reset keywords");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load negative keywords. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!negativeKeywords) {
    return null;
  }

  const effectiveKeywords = getEffectiveNegativeKeywords(negativeKeywords.settings);
  const removedDefaultKeywords = negativeKeywords.settings.userRemovedKeywords;
  const customKeywords = negativeKeywords.settings.userAddedKeywords;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Negative Keywords</h2>
        <p className="text-muted-foreground">
          Manage words and phrases that should be avoided in AI-generated scripts to make them sound more natural and human.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keywords</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectiveKeywords.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently filtering these words
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Keywords</CardTitle>
            <Plus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customKeywords.length}</div>
            <p className="text-xs text-muted-foreground">
              Added by you
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disabled Defaults</CardTitle>
            <X className="h-4 w-4 text-[#2d93ad]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{removedDefaultKeywords.length}</div>
            <p className="text-xs text-muted-foreground">
              Default keywords you&apos;ve disabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Custom Keyword */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Keyword</CardTitle>
          <CardDescription>
            Add words or phrases that you want to avoid in your scripts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="new-keyword" className="sr-only">
                New keyword
              </Label>
              <Input
                id="new-keyword"
                placeholder="Enter a word or phrase to avoid..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddKeyword();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleAddKeyword} 
              disabled={!newKeyword.trim() || isAddingKeyword}
            >
              {isAddingKeyword ? "Adding..." : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Custom Keywords */}
      {customKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Custom Keywords</CardTitle>
            <CardDescription>
              Keywords you&apos;ve added to avoid in your scripts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {customKeywords.map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {keyword}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => handleRemoveCustomKeyword(keyword)}
                    disabled={isRemovingKeyword}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Default Keywords */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Default Keywords</CardTitle>
            <CardDescription>
              Pre-selected words and phrases commonly overused by AI. Click to disable/enable individual keywords.
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            disabled={isResetting}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {isResetting ? "Resetting..." : "Reset All"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_NEGATIVE_KEYWORDS.map((keyword) => {
              const isRemoved = removedDefaultKeywords.includes(keyword);
              return (
                <Badge
                  key={keyword}
                  variant={isRemoved ? "outline" : "default"}
                  className={`cursor-pointer transition-colors ${
                    isRemoved 
                      ? "opacity-50 hover:opacity-75" 
                      : "hover:bg-primary/80"
                  }`}
                  onClick={() => handleToggleDefault(keyword)}
                >
                  {keyword}
                  {isRemoved && <X className="ml-1 h-3 w-3" />}
                </Badge>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Click on any keyword to disable/enable it. Disabled keywords will not be filtered from your scripts.
          </p>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> These keywords are included in AI prompts to prevent their use in generated scripts. 
          The system uses exact word matching, so &quot;leverage&quot; will only filter the exact word &quot;leverage&quot; and not &quot;leveraging&quot; or &quot;leveraged&quot;.
        </AlertDescription>
      </Alert>
    </div>
  );
} 