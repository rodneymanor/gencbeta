"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";

import { GhostWriterCard } from "@/components/ghost-writer-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { ContentIdea, GhostWriterCycle } from "@/types/ghost-writer";

interface GhostWriterData {
  ideas: ContentIdea[];
  cycle: GhostWriterCycle;
  userData: {
    savedIdeas: string[];
    dismissedIdeas: string[];
  };
}

export function GhostWriter() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<GhostWriterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsBrandProfile, setNeedsBrandProfile] = useState(false);
  const [generatingMore, setGeneratingMore] = useState(false);

  const fetchIdeas = useCallback(async () => {
    console.log("🎯 [GhostWriter Component] fetchIdeas called, user:", !!user);
    if (!user) {
      console.log("❌ [GhostWriter Component] No user found, returning early");
      return;
    }

    try {
      console.log("🔄 [GhostWriter Component] Starting to fetch ideas...");
      setError(null);

      const token = await user.getIdToken();
      console.log("🔑 [GhostWriter Component] Got user token:", token ? "✅" : "❌");

      const response = await fetch("/api/ghost-writer/enhanced", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📡 [GhostWriter Component] API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("❌ [GhostWriter Component] API error response:", errorData);
        if (errorData.needsBrandProfile) {
          setNeedsBrandProfile(true);
          setError("Please complete your brand profile to get personalized content ideas.");
        } else {
          throw new Error(errorData.error ?? "Failed to fetch ideas");
        }
        return;
      }

      const result = await response.json();
      console.log("✅ [GhostWriter Component] API success response:", result);
      setData(result);
      setNeedsBrandProfile(false);
    } catch (err) {
      console.error("❌ [GhostWriter Component] Failed to fetch Ghost Writer ideas:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleIdeaAction = async (ideaId: string, action: "save" | "dismiss") => {
    if (!user) return;

    try {
      const response = await fetch("/api/ghost-writer/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ ideaId, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to manage idea");
      }

      // Update local state
      if (data) {
        setData({
          ...data,
          userData: {
            ...data.userData,
            savedIdeas: action === "save" ? [...data.userData.savedIdeas, ideaId] : data.userData.savedIdeas,
            dismissedIdeas:
              action === "dismiss" ? [...data.userData.dismissedIdeas, ideaId] : data.userData.dismissedIdeas,
          },
          ideas: action === "dismiss" ? data.ideas.filter((idea) => idea.id !== ideaId) : data.ideas,
        });
      }
    } catch (err) {
      console.error(`Failed to ${action} idea:`, err);
    }
  };

  const handleUseIdea = (idea: ContentIdea) => {
    // Navigate to script creation with the script pre-filled
    const enhancedIdea = idea as any; // Enhanced ideas have different structure
    const queryParams = new URLSearchParams({
      idea: enhancedIdea.concept ?? idea.title ?? "Content Idea",
      script: enhancedIdea.script ?? idea.hook,
      length: idea.estimatedDuration,
      category: enhancedIdea.peqCategory ?? idea.pillar ?? "general",
    });

    router.push(`/dashboard/scripts/new?${queryParams.toString()}`);
  };

  const handleWriteMore = async () => {
    if (!user) return;

    setGeneratingMore(true);
    try {
      const response = await fetch("/api/ghost-writer/enhanced?generateMore=true", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate more ideas");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to generate more ideas:", err);
      setError(err instanceof Error ? err.message : "Failed to generate more ideas");
    } finally {
      setGeneratingMore(false);
    }
  };

  const formatTimeUntilRefresh = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return "00:00:00";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    console.log("🔄 [GhostWriter Component] useEffect triggered, user:", !!user);
    fetchIdeas();
  }, [fetchIdeas]);

  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold">Ghost Writer</CardTitle>
            <CardDescription className="mt-2 text-base">
              AI-powered content ideas based on your brand profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold">Ghost Writer</CardTitle>
            <CardDescription className="mt-2 text-base">
              AI-powered content ideas based on your brand profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {needsBrandProfile && (
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/my-brand")} className="ml-2">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Complete Profile
                </Button>
              )}
            </AlertDescription>
          </Alert>

          {!needsBrandProfile && (
            <div className="mt-4 text-center">
              <Button onClick={fetchIdeas} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!data?.ideas?.length) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold">Ghost Writer</CardTitle>
            <CardDescription className="mt-2 text-base">
              AI-powered content ideas based on your brand profile
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No content ideas available</p>
            <Button onClick={fetchIdeas} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Ideas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <div className="relative">
          {/* Countdown in upper left corner */}
          <div className="absolute top-0 left-0">
            <div className="text-muted-foreground bg-muted/50 rounded-md border px-3 py-1.5 text-sm">
              New posts coming in:{" "}
              <span className="font-mono text-blue-600">{formatTimeUntilRefresh(data.cycle.expiresAt)}</span>
            </div>
          </div>

          {/* Centered headlines */}
          <div className="pt-12 text-center">
            <CardTitle className="text-3xl font-bold">Ghost Writer</CardTitle>
            <CardDescription className="mt-2 text-base">
              AI-powered content ideas based on your brand profile
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.ideas.map((idea) => (
            <GhostWriterCard
              key={idea.id}
              idea={idea}
              isSaved={data.userData?.savedIdeas?.includes(idea.id) ?? false}
              onSave={(ideaId) => handleIdeaAction(ideaId, "save")}
              onDismiss={(ideaId) => handleIdeaAction(ideaId, "dismiss")}
              onUse={handleUseIdea}
            />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button onClick={handleWriteMore} variant="outline" size="lg" disabled={generatingMore} className="px-8">
            {generatingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Write More"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
