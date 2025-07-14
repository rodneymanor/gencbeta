import { useCallback } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useUsage } from "@/contexts/usage-context";

interface UseScriptSaveProps {
  script: string;
  scriptId: string | null;
  refetch: () => void;
}

export function useScriptSave({ script, scriptId, refetch }: UseScriptSaveProps) {
  const router = useRouter();
  const { triggerUsageUpdate } = useUsage();

  const handleSave = useCallback(async () => {
    if (!script.trim()) {
      toast.error("Cannot Save Empty Script", {
        description: "Please add some content to your script before saving.",
      });
      return;
    }

    try {
      // Get Firebase Auth token
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await auth.currentUser.getIdToken();

      const response = await fetch("/api/scripts", {
        method: scriptId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: scriptId,
          title: "Untitled Script",
          content: script.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to save script");

      const result = await response.json();
      triggerUsageUpdate();
      refetch();

      toast.success("Script Saved", {
        description: "Your script has been saved successfully.",
      });

      if (!scriptId && result.id) {
        router.push(`/dashboard/scripts/editor?id=${result.id}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Save Failed", {
        description: "There was an error saving your script. Please try again.",
      });
    }
  }, [script, scriptId, triggerUsageUpdate, refetch, router]);

  return { handleSave };
}
