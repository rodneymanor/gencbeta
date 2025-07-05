"use client";

import { useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { useScriptSave } from "@/hooks/use-script-save";

import { EditorTopBarToolbar } from "./_components/layout/editor-topbar-toolbar";
import { EnhancedEditor } from "./_components/layout/enhanced-editor";
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

  // State
  const [script, setScript] = useState("");
  const [scriptElements, setScriptElements] = useState<ScriptElements | undefined>();
  const [showScriptOptions, setShowScriptOptions] = useState(hasSpeedWriteResults);
  const [speedWriteData, setSpeedWriteData] = useState<SpeedWriteResponse | null>(null);

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
      customContent: <EditorTopBarToolbar script={script} onSave={handleSave} />,
    });
  }, [script, handleSave, setTopBarConfig]);

  // Handle speed-write workflow on component mount
  useEffect(() => {
    const loadSpeedWriteResults = () => {
      const storedResults = sessionStorage.getItem("speedWriteResults");
      if (!storedResults) return;

      try {
        const data: SpeedWriteResponse = JSON.parse(storedResults);
        setSpeedWriteData(data);
        setShowScriptOptions(true);
        sessionStorage.removeItem("speedWriteResults");
      } catch (error) {
        console.error("Failed to parse speed-write results:", error);
        toast.error("Failed to load script options");
      }
    };

    if (mode === "speed-write" && hasSpeedWriteResults) {
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

  const handleScriptChange = (newContent: string) => {
    setScript(newContent);
    if (scriptElements) {
      setScriptElements(undefined);
    }
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

  if (showScriptOptions && speedWriteData && speedWriteData.optionA && speedWriteData.optionB) {
    return (
      <ScriptOptions
        optionA={speedWriteData.optionA}
        optionB={speedWriteData.optionB}
        onSelect={handleScriptOptionSelect}
        isGenerating={false}
      />
    );
  }

  return <EnhancedEditor initialScript={script} onScriptChange={handleScriptChange} onSave={handleScriptSave} />;
}
