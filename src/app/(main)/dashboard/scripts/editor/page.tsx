"use client";

import { useState, useEffect, useRef } from "react";

import { useSearchParams } from "next/navigation";

import { PartialBlock } from "@blocknote/core";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { useScriptSave } from "@/hooks/use-script-save";

import { HemingwayEditor } from "./_components/hemingway-editor";
import { EditorTopBarToolbar } from "./_components/layout/editor-topbar-toolbar";
import { ScriptOptions } from "./_components/script-options";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface SpeedWriteResponse {
  success: boolean;
  optionA: {
    id: string;
    title: string;
    content: string;
    elements?: ScriptElements;
  } | null;
  optionB: {
    id: string;
    title: string;
    content: string;
    elements?: ScriptElements;
  } | null;
  error?: string;
}

export default function ScriptEditorPage() {
  const searchParams = useSearchParams();

  // Get URL parameters
  const mode = searchParams.get("mode") ?? "notes";
  const scriptId = searchParams.get("scriptId");
  const hasSpeedWriteResults = searchParams.get("hasSpeedWriteResults") === "true";
  const scriptData = searchParams.get("scriptData");

  console.log("📊 [EDITOR] Component mounted with params:", {
    mode,
    scriptId,
    hasSpeedWriteResults,
    scriptData: scriptData ? "present" : "not present",
  });

  // State
  const [script, setScript] = useState("");
  const [scriptElements, setScriptElements] = useState<ScriptElements | undefined>();
  const [showScriptOptions, setShowScriptOptions] = useState(hasSpeedWriteResults);
  const [speedWriteData, setSpeedWriteData] = useState<SpeedWriteResponse | null>(null);
  const [blocks, setBlocks] = useState<PartialBlock[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Auto-save timer ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastAutoSaveContent = useRef<string>("");

  // Fetch scripts data
  const {
    data: scripts = [],
    isLoading: scriptsLoading,
    refetch,
  } = useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      // Get Firebase Auth token
      const { auth } = await import("@/lib/firebase");
      if (!auth?.currentUser) {
        throw new Error("User not authenticated");
      }

      const token = await auth.currentUser.getIdToken();

      const response = await fetch("/api/scripts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch scripts");
      return response.json();
    },
  });

  // Use script save hook
  const { handleSave } = useScriptSave({ script, scriptId, refetch });

  // Configure top bar with toolbar
  const { setTopBarConfig } = useTopBarConfig();

  useEffect(() => {
    setTopBarConfig({
      customContent: <EditorTopBarToolbar script={script} onSave={handleSave} autoSaveStatus={autoSaveStatus} />,
    });
  }, [script, handleSave, setTopBarConfig, autoSaveStatus]);

  // Handle speed-write workflow on component mount
  useEffect(() => {
    const loadSpeedWriteResults = () => {
      const storedResults = sessionStorage.getItem("speedWriteResults");
      console.log("📊 [EDITOR] Raw sessionStorage data:", storedResults);

      if (!storedResults) {
        console.log("📊 [EDITOR] No speedWriteResults found in sessionStorage");
        return;
      }

      try {
        const data: SpeedWriteResponse = JSON.parse(storedResults);
        console.log("📊 [EDITOR] Parsed speed-write data:", data);
        console.log("📊 [EDITOR] Option A:", data.optionA);
        console.log("📊 [EDITOR] Option B:", data.optionB);
        console.log("📊 [EDITOR] Success:", data.success);

        setSpeedWriteData(data);
        setShowScriptOptions(true);
        sessionStorage.removeItem("speedWriteResults");
      } catch (error) {
        console.error("Failed to parse speed-write results:", error);
        toast.error("Failed to load script options");
      }
    };

    if (mode === "speed-write" && hasSpeedWriteResults) {
      console.log("📊 [EDITOR] Loading speed-write results...");
      loadSpeedWriteResults();
    }
  }, [mode, hasSpeedWriteResults]);

  // Handle scriptData URL parameter from ghost-writer
  useEffect(() => {
    if (scriptData) {
      console.log("📊 [EDITOR] Processing scriptData from URL parameter");

      try {
        const data: SpeedWriteResponse = JSON.parse(decodeURIComponent(scriptData));
        console.log("📊 [EDITOR] Parsed script data:", data);
        console.log("📊 [EDITOR] Option A:", data.optionA);
        console.log("📊 [EDITOR] Option B:", data.optionB);
        console.log("📊 [EDITOR] Success:", data.success);

        setSpeedWriteData(data);
        setShowScriptOptions(true);

        // Clean up URL parameter by replacing current history entry
        const url = new URL(window.location.href);
        url.searchParams.delete("scriptData");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("Failed to parse script data from URL:", error);
        toast.error("Failed to load script options");
      }
    }
  }, [scriptData]);

  // Load script if editing existing one
  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const existingScript = scripts.find((s: { id: string; content: string }) => s.id === scriptId);
      if (existingScript) {
        setScript(existingScript.content);
      }
    }
  }, [scriptId, scripts]);

  // Backup content to localStorage
  useEffect(() => {
    if (script.trim()) {
      const backupKey = scriptId ? `script-backup-${scriptId}` : "script-backup-new";
      localStorage.setItem(backupKey, script);
      localStorage.setItem(`${backupKey}-timestamp`, Date.now().toString());
    }
  }, [script, scriptId]);

  // Recovery from localStorage on mount
  useEffect(() => {
    const backupKey = scriptId ? `script-backup-${scriptId}` : "script-backup-new";
    const backupContent = localStorage.getItem(backupKey);
    const backupTimestamp = localStorage.getItem(`${backupKey}-timestamp`);

    if (backupContent && backupTimestamp && !script.trim()) {
      const timeDiff = Date.now() - parseInt(backupTimestamp);
      // Only recover if backup is less than 24 hours old
      if (timeDiff < 24 * 60 * 60 * 1000) {
        setScript(backupContent);
        console.log("📝 [RECOVERY] Recovered script from localStorage backup");
        toast.info("Draft recovered", {
          description: "We recovered an unsaved draft of your script.",
        });
      }
    }
  }, [scriptId]); // Only run when scriptId changes

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleScriptOptionSelect = (option: {
    id: string;
    title: string;
    content: string;
    elements?: ScriptElements;
  }) => {
    setScript(option.content);
    setScriptElements(option.elements);
    setShowScriptOptions(false);
    toast.success("Script Selected", {
      description: `You selected ${option.title}. You can now edit and refine it.`,
    });
  };

  // Auto-save function with enhanced error handling and retry logic
  const performAutoSave = async () => {
    if (!script.trim()) {
      console.log("📝 [AUTO-SAVE] Skipping auto-save: empty script");
      return;
    }

    // Skip if content hasn't changed since last auto-save
    if (lastAutoSaveContent.current === script.trim()) {
      console.log("📝 [AUTO-SAVE] Skipping auto-save: no changes since last save");
      return;
    }

    try {
      console.log("📝 [AUTO-SAVE] Starting auto-save...");
      setAutoSaveStatus("saving");

      // Generate title from first line if no scriptId (new script)
      const title = scriptId ? "Untitled Script" : script.split("\n")[0].substring(0, 50) || "Untitled Script";

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
          title,
          content: script.trim(),
          approach: "manual", // Default approach for auto-saved scripts
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save script");
      }

      const result = await response.json();

      // Update scriptId if this was a new script
      if (!scriptId && result.script?.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("scriptId", result.script.id);
        window.history.replaceState({}, "", newUrl.toString());
      }

      setAutoSaveStatus("saved");
      console.log("✅ [AUTO-SAVE] Auto-save successful");

      // Store last successful auto-save content
      lastAutoSaveContent.current = script.trim();

      // Clean up localStorage backup after successful save
      const backupKey = scriptId ? `script-backup-${scriptId}` : "script-backup-new";
      localStorage.removeItem(backupKey);
      localStorage.removeItem(`${backupKey}-timestamp`);

      // Refresh scripts list
      refetch();

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      setAutoSaveStatus("error");
      console.error("❌ [AUTO-SAVE] Auto-save failed:", error);

      // Show error toast only for auto-save failures
      toast.error("Auto-save failed", {
        description: "Your changes weren't saved automatically. Try saving manually.",
      });

      // Reset to idle after 5 seconds to allow retry
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 5000);
    }
  };

  const handleScriptChange = (newContent: string) => {
    setScript(newContent);
    if (scriptElements) {
      setScriptElements(undefined);
    }

    // Don't auto-save empty content
    if (!newContent.trim()) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      return;
    }

    // Clear existing auto-save timer
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Don't start new auto-save if currently saving
    if (autoSaveStatus === "saving") {
      console.log("📝 [AUTO-SAVE] Skipping debounce: already saving");
      return;
    }

    // Reset status to idle if it was in error or saved state
    if (autoSaveStatus === "error" || autoSaveStatus === "saved") {
      setAutoSaveStatus("idle");
    }

    // Set new auto-save timer (3 seconds after stopping typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      // Double-check we're not saving before triggering
      if (autoSaveStatus !== "saving") {
        performAutoSave();
      }
    }, 3000);

    console.log("📝 [AUTO-SAVE] Auto-save timer set for 3 seconds");
  };

  const handleBlocksChange = (newBlocks: PartialBlock[]) => {
    setBlocks(newBlocks);
  };

  const handleScriptSave = async () => {
    await handleSave();
  };

  if (scriptsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading script editor...</span>
        </div>
      </div>
    );
  }

  if (showScriptOptions && speedWriteData && (speedWriteData.optionA || speedWriteData.optionB)) {
    console.log("📊 [EDITOR] Rendering ScriptOptions with:", {
      optionA: speedWriteData.optionA,
      optionB: speedWriteData.optionB,
      showScriptOptions,
    });

    return (
      <ScriptOptions
        optionA={speedWriteData.optionA}
        optionB={speedWriteData.optionB}
        onSelect={handleScriptOptionSelect}
        isGenerating={false}
      />
    );
  }

  return (
    <HemingwayEditor
      value={script}
      onChange={handleScriptChange}
      elements={scriptElements}
      onBlocksChange={handleBlocksChange}
      placeholder="Start writing your script..."
    />
  );
}
