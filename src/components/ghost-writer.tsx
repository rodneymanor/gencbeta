"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useRouter } from "next/navigation";

import { Loader2, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";

import { GhostWriterCard } from "@/components/ghost-writer-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GhostWriterRefreshTimelineModal } from "@/components/ui/ghost-writer-refresh-timeline-modal";
import { GhostWriterTimelineModal } from "@/components/ui/ghost-writer-timeline-modal";
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
  const [showTimeline, setShowTimeline] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<ContentIdea | null>(null);
  const [showRefreshTimeline, setShowRefreshTimeline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ref to track if a request is in progress to prevent concurrent calls
  const fetchingRef = useRef(false);

  const fetchIdeas = useCallback(async () => {
    if (!user) return;

    // Prevent concurrent requests
    if (fetchingRef.current) {
      console.log("🔄 [GhostWriter] Request already in progress, skipping");
      return;
    }

    try {
      fetchingRef.current = true;
      setError(null);
      const token = await user.getIdToken();
      const apiKey = process.env.NEXT_PUBLIC_GHOST_API_KEY;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (apiKey) headers["x-api-key"] = apiKey;
      const response = await fetch("/api/ghost-writer/enhanced", { headers });

      if (!response.ok) {
        // Log server error details
        const errorPayload = await safeJson(response);
        console.error("❌ [GhostWriter] Enhanced endpoint error:", errorPayload);

        // fallback to legacy ideas endpoint without auth
        try {
          const legacyRes = await fetch("/api/ghost-writer/ideas");
          if (legacyRes.ok) {
            const legacyData = await safeJson(legacyRes);
            console.log("🔄 [GhostWriter] Using legacy ideas after enhanced failure");
            setData(legacyData);
            setNeedsBrandProfile(false);
            return;
          }
        } catch (fallbackErr) {
          console.error("❌ [GhostWriter] Legacy fallback fetch error:", fallbackErr);
        }

        if (errorPayload?.needsBrandProfile) {
          setNeedsBrandProfile(true);
          setError("Please complete your brand profile to get personalized content ideas.");
        } else {
          setError(errorPayload?.error ?? "Failed to fetch ideas");
        }
        return;
      }

      const result = await safeJson(response);
      setData(result);
      setNeedsBrandProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  const safeJson = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

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

  const handleUseIdea = async (idea: ContentIdea) => {
    if (!user) return;

    // Show timeline modal
    setCurrentIdea(idea);
    setShowTimeline(true);
  };

  const handleTimelineComplete = async (result: any) => {
    if (!currentIdea) return;

    try {
      // Check if auto-selection occurred
      if (result.autoSelect && result.selectedOption) {
        console.log("🔄 [GhostWriter] Auto-selection detected, navigating directly to Hemingway editor");

        // Store the auto-selected script data
        sessionStorage.setItem(
          "speedWriteResults",
          JSON.stringify({
            ...result,
            autoSelectComplete: true,
          }),
        );

        // Navigate to the editor with auto-selection flag
        const queryParams = new URLSearchParams({
          mode: "speed-write",
          hasSpeedWriteResults: "true",
          autoSelect: "true",
          ideaId: currentIdea.id,
        });

        console.log("🔄 [GhostWriter] Navigating to editor with auto-selected script");
        router.push(`/dashboard/scripts/editor?${queryParams.toString()}`);
      } else {
        // Store the result in sessionStorage instead of URL params to avoid length issues
        sessionStorage.setItem("speedWriteResults", JSON.stringify(result));

        // Navigate to the editor with the generated script options
        const queryParams = new URLSearchParams({
          mode: "speed-write",
          hasSpeedWriteResults: "true",
          ideaId: currentIdea.id,
        });

        console.log("🔄 [GhostWriter] Navigating to editor with script options for selection");
        router.push(`/dashboard/scripts/editor?${queryParams.toString()}`);
      }

      // Keep modal open during navigation to prevent flashing
      // Close modal after navigation starts
      setTimeout(() => {
        setShowTimeline(false);
        setCurrentIdea(null);
      }, 500);
    } catch (error) {
      console.error("🔄 [GhostWriter] Navigation error:", error);
      // Fallback to the original behavior if navigation fails
      const queryParams = createScriptQueryParams(currentIdea);
      router.push(`/dashboard/scripts/new?${queryParams.toString()}`);

      // Close modal after delay even on error
      setTimeout(() => {
        setShowTimeline(false);
        setCurrentIdea(null);
      }, 500);
    }
  };

  const handleTimelineError = (error: string) => {
    console.error("🔄 [GhostWriter] Timeline error:", error);

    // Fallback to the original behavior if generation fails
    if (currentIdea) {
      const queryParams = createScriptQueryParams(currentIdea);
      router.push(`/dashboard/scripts/new?${queryParams.toString()}`);
    }

    // Reset timeline state
    setShowTimeline(false);
    setCurrentIdea(null);
  };

  const handleWriteMore = async () => {
    if (!user) return;

    // Prevent concurrent requests
    if (generatingMore) {
      console.log("🔄 [GhostWriter] Write more already in progress, skipping");
      return;
    }

    setGeneratingMore(true);
    try {
      const response = await fetch("/api/ghost-writer/enhanced?generateMore=true", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });

      if (!response.ok) throw new Error("Failed to generate more ideas");

      const result = await safeJson(response);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate more ideas");
    } finally {
      setGeneratingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;

    // Prevent concurrent requests
    if (isRefreshing || fetchingRef.current) {
      console.log("🔄 [GhostWriter] Refresh already in progress, skipping");
      return;
    }

    // Show the timeline modal
    setShowRefreshTimeline(true);
    setIsRefreshing(true);
    fetchingRef.current = true;
  };

  const handleRefreshComplete = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/ghost-writer/enhanced?refresh=true", {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });

      if (!response.ok) throw new Error("Failed to refresh ideas");

      const result = await safeJson(response);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh ideas");
    } finally {
      setShowRefreshTimeline(false);
      setIsRefreshing(false);
      fetchingRef.current = false;
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
    <div>
      {/* Timeline Modal */}
      <GhostWriterTimelineModal
        isOpen={showTimeline}
        idea={currentIdea}
        onComplete={handleTimelineComplete}
        onError={handleTimelineError}
        onCancel={() => {
          setShowTimeline(false);
          setCurrentIdea(null);
        }}
      />

      {/* Refresh Timeline Modal */}
      <GhostWriterRefreshTimelineModal
        isOpen={showRefreshTimeline}
        onComplete={handleRefreshComplete}
        onCancel={() => {
          setShowRefreshTimeline(false);
          setIsRefreshing(false);
          fetchingRef.current = false;
        }}
      />

      <div className="relative mb-8">
        {/* Refresh Ideas Button - Upper Right */}
        <div className="absolute top-0 right-0">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="secondary"
            size="sm"
            className="border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {isRefreshing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
            Refresh Ideas
          </Button>
        </div>

        {/* Header Content - Centered */}
        <div className="text-center">
          <h2 className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text text-4xl font-bold text-transparent">
            Ghost Writer
          </h2>
          <p className="text-muted-foreground mt-2 text-base">AI-powered content ideas based on your brand profile</p>
          <div className="border-muted/20 bg-muted/10 text-muted-foreground mt-4 inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-xs transition duration-300 ease-out">
            New posts coming in: <span className="font-mono"> {formatTimeUntilRefresh(data.cycle.expiresAt)}</span>
          </div>
        </div>
      </div>
      <div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.ideas.slice(0, 6).map((idea) => (
            <GhostWriterCard
              key={idea.id}
              idea={idea}
              onSave={handleIdeaAction}
              onUse={handleUseIdea}
              isSaved={data.userData?.savedIdeas.includes(idea.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
