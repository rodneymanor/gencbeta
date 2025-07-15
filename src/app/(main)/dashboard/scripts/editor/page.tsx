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

  console.log("📊 [EDITOR] Component mounted with params:", { mode, scriptId, hasSpeedWriteResults });

  // State
  const [script, setScript] = useState("");
  const [scriptElements, setScriptElements] = useState<ScriptElements | undefined>();
  const [showScriptOptions, setShowScriptOptions] = useState(hasSpeedWriteResults);
  const [speedWriteData, setSpeedWriteData] = useState<SpeedWriteResponse | null>(null);
  const [blocks, setBlocks] = useState<PartialBlock[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Auto-save timer ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

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
  const setTopBarConfig = useTopBarConfig();

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

  // Load script if editing existing one
  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const existingScript = scripts.find((s: { id: string; content: string }) => s.id === scriptId);
      if (existingScript) {
        setScript(existingScript.content);
      }
    }
  }, [scriptId, scripts]);

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

  // Auto-save function
  const performAutoSave = async () => {
    if (!script.trim()) return;

    try {
      setAutoSaveStatus("saving");
      await handleSave();
      setAutoSaveStatus("saved");

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 2000);
    } catch (error) {
      setAutoSaveStatus("error");
      console.error("Auto-save failed:", error);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus("idle");
      }, 3000);
    }
  };

  const handleScriptChange = (newContent: string) => {
    setScript(newContent);
    if (scriptElements) {
      setScriptElements(undefined);
    }

    // Clear existing auto-save timer
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timer (3 seconds after stopping typing)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 3000);
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
