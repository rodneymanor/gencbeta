"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Sparkles, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth-context";
import { GhostWriterCard } from "@/components/ghost-writer-card";
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

  const fetchIdeas = async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await fetch("/api/ghost-writer/ideas", {
        headers: {
          "Authorization": `Bearer ${await user.getIdToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.needsBrandProfile) {
          setNeedsBrandProfile(true);
          setError("Please complete your brand profile to get personalized content ideas.");
        } else {
          throw new Error(errorData.error || "Failed to fetch ideas");
        }
        return;
      }

      const result = await response.json();
      setData(result);
      setNeedsBrandProfile(false);
    } catch (err) {
      console.error("Failed to fetch Ghost Writer ideas:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaAction = async (ideaId: string, action: "save" | "dismiss") => {
    if (!user) return;

    try {
      const response = await fetch("/api/ghost-writer/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`,
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
            savedIdeas: action === "save" 
              ? [...data.userData.savedIdeas, ideaId]
              : data.userData.savedIdeas,
            dismissedIdeas: action === "dismiss"
              ? [...data.userData.dismissedIdeas, ideaId]
              : data.userData.dismissedIdeas,
          },
          ideas: action === "dismiss" 
            ? data.ideas.filter(idea => idea.id !== ideaId)
            : data.ideas,
        });
      }
    } catch (err) {
      console.error(`Failed to ${action} idea:`, err);
    }
  };

  const handleUseIdea = (idea: ContentIdea) => {
    // Navigate to script creation with the idea pre-filled
    const queryParams = new URLSearchParams({
      idea: idea.title,
      hook: idea.hook,
      outline: idea.scriptOutline,
      length: idea.estimatedDuration,
      pillar: idea.pillar,
    });
    
    router.push(`/dashboard/scripts/new?${queryParams.toString()}`);
  };

  const formatTimeUntilRefresh = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Refreshing soon...";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m until refresh`;
    } else {
      return `${minutes}m until refresh`;
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ghost Writer
          </CardTitle>
          <CardDescription>
            AI-powered content ideas based on your brand profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ghost Writer
          </CardTitle>
          <CardDescription>
            AI-powered content ideas based on your brand profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {needsBrandProfile && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push("/dashboard/my-brand")}
                  className="ml-2"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Complete Profile
                </Button>
              )}
            </AlertDescription>
          </Alert>
          
          {!needsBrandProfile && (
            <div className="mt-4 text-center">
              <Button onClick={fetchIdeas} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.ideas || data.ideas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Ghost Writer
          </CardTitle>
          <CardDescription>
            AI-powered content ideas based on your brand profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No content ideas available</p>
            <Button onClick={fetchIdeas} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Ideas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ghost Writer
              <span className="text-sm font-normal text-muted-foreground">
                Cycle #{data.cycle.cycleNumber}
              </span>
            </CardTitle>
            <CardDescription>
              AI-powered content ideas based on your brand profile
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTimeUntilRefresh(data.cycle.expiresAt)}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.ideas && data.ideas.map((idea) => (
            <GhostWriterCard
              key={idea.id}
              idea={idea}
              isSaved={data.userData?.savedIdeas?.includes(idea.id) || false}
              onSave={(ideaId) => handleIdeaAction(ideaId, "save")}
              onDismiss={(ideaId) => handleIdeaAction(ideaId, "dismiss")}
              onUse={handleUseIdea}
            />
          ))}
        </div>
        
        {data.ideas && data.ideas.length < 6 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Some ideas were dismissed. New ideas will be available in the next cycle.
            </p>
            <Button onClick={fetchIdeas} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check for Updates
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 