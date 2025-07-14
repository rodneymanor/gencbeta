import { useState, useEffect } from "react";

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

interface UseGhostWriterReturn {
  data: GhostWriterData | null;
  loading: boolean;
  error: string | null;
  needsBrandProfile: boolean;
  fetchIdeas: () => Promise<void>;
  saveIdea: (ideaId: string) => Promise<void>;
  dismissIdea: (ideaId: string) => Promise<void>;
}

export function useGhostWriter(): UseGhostWriterReturn {
  const { user } = useAuth();
  const [data, setData] = useState<GhostWriterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsBrandProfile, setNeedsBrandProfile] = useState(false);

  const fetchIdeas = async () => {
    if (!user) return;

    try {
      setError(null);
      setLoading(true);

      const response = await fetch("/api/ghost-writer/ideas", {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
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
      throw err;
    }
  };

  const saveIdea = async (ideaId: string) => {
    await handleIdeaAction(ideaId, "save");
  };

  const dismissIdea = async (ideaId: string) => {
    await handleIdeaAction(ideaId, "dismiss");
  };

  useEffect(() => {
    fetchIdeas();
  }, [user]);

  return {
    data,
    loading,
    error,
    needsBrandProfile,
    fetchIdeas,
    saveIdea,
    dismissIdea,
  };
}
