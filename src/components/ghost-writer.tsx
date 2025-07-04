"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";

import { GhostWriterCard } from "@/components/ghost-writer-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { formatTimeUntilRefresh, createScriptQueryParams } from "@/lib/ghost-writer-helpers";
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
    if (!user) return;

    try {
      setError(null);
      const token = await user.getIdToken();
      const response = await fetch("/api/ghost-writer/enhanced", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsBrandProfile) {
          setNeedsBrandProfile(true);
          setError("Please complete your brand profile to get personalized content ideas.");
        } else {
          throw new Error(errorData.error ?? "Failed to fetch ideas");
        }
        return;
      }

      const result = await response.json();
      setData(result);
      setNeedsBrandProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleIdeaAction = async (ideaId: string, action: "save" | "dismiss") => {
    if (!user || !data) return;

    try {
      const response = await fetch("/api/ghost-writer/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ ideaId, action }),
      });

      if (!response.ok) throw new Error("Failed to manage idea");

      // Initialize userData if it doesn't exist
      const currentUserData = data.userData || { savedIdeas: [], dismissedIdeas: [] };

      setData({
        ...data,
        userData: {
          ...currentUserData,
          savedIdeas: action === "save" ? [...currentUserData.savedIdeas, ideaId] : currentUserData.savedIdeas,
          dismissedIdeas:
            action === "dismiss" ? [...currentUserData.dismissedIdeas, ideaId] : currentUserData.dismissedIdeas,
        },
        ideas: action === "dismiss" ? data.ideas.filter((idea) => idea.id !== ideaId) : data.ideas,
      });
    } catch (err) {
      console.error(`Failed to ${action} idea:`, err);
    }
  };

  const handleUseIdea = (idea: ContentIdea) => {
    const queryParams = createScriptQueryParams(
      idea as ContentIdea & { concept?: string; script?: string; peqCategory?: string },
    );
    router.push(`/dashboard/scripts/new?${queryParams.toString()}`);
  };

  const handleWriteMore = async () => {
    if (!user) return;

    setGeneratingMore(true);
    try {
      const response = await fetch("/api/ghost-writer/enhanced?generateMore=true", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });

      if (!response.ok) throw new Error("Failed to generate more ideas");

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate more ideas");
    } finally {
      setGeneratingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ghost-writer/enhanced?refresh=true", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });

      if (!response.ok) throw new Error("Failed to refresh ideas");

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh ideas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  if (loading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text text-4xl font-bold text-transparent">
              Ghost Writer
            </CardTitle>
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
            <CardTitle className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text text-4xl font-bold text-transparent">
              Ghost Writer
            </CardTitle>
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
            <CardTitle className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text text-4xl font-bold text-transparent">
              Ghost Writer
            </CardTitle>
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
          <div className="absolute top-0 left-0">
            <div className="border-primary/20 bg-primary/20 hover:bg-primary/30 hover:border-primary/40 text-primary relative items-center rounded-full border px-3 py-1.5 font-sans text-sm outline-transparent transition duration-300 ease-out outline-none select-none focus:outline-none">
              New posts coming in:{" "}
              <span className="text-primary font-mono">{formatTimeUntilRefresh(data.cycle.expiresAt)}</span>
            </div>
          </div>
          <div className="pt-12 text-center">
            <CardTitle className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text text-4xl font-bold text-transparent">
              Ghost Writer
            </CardTitle>
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
          <div className="flex items-center justify-center gap-4">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={loading} className="px-8">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh All
                </>
              )}
            </Button>
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
        </div>
      </CardContent>
    </Card>
  );
}
