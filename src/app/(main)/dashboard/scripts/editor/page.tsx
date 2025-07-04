"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Loader2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { useUsage } from "@/contexts/usage-context";

import { ChatInterface } from "./_components/chat-interface";
import { FloatingToolbar } from "./_components/floating-toolbar";
import { HemingwayEditor } from "./_components/hemingway-editor";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerUsageUpdate } = useUsage();

  // Get URL parameters
  const mode = searchParams.get("mode") ?? "notes";
  const idea = searchParams.get("idea") ?? "";
  const videoUrl = searchParams.get("videoUrl") ?? "";
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
      const response = await fetch("/api/scripts");
      if (!response.ok) throw new Error("Failed to fetch scripts");
      return response.json();
    },
  });

  // Handle speed-write workflow on component mount
  useEffect(() => {
    if (mode === "speed-write" && hasSpeedWriteResults) {
      // Load speed-write results from sessionStorage
      const storedResults = sessionStorage.getItem("speedWriteResults");
      if (storedResults) {
        try {
          const data: SpeedWriteResponse = JSON.parse(storedResults);
          setSpeedWriteData(data);
          setShowScriptOptions(true);

          // Clear the stored results
          sessionStorage.removeItem("speedWriteResults");
        } catch (error) {
          console.error("Failed to parse speed-write results:", error);
          toast.error("Failed to load script options");
        }
      }
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

  // Handle script option selection (fast workflow)
  const handleScriptOptionSelect = (option: { id: string; title: string; content: string; elements?: ScriptElements }) => {
    setScript(option.content);
    setScriptElements(option.elements);
    setShowScriptOptions(false);
    toast.success("Script Selected", {
      description: `You selected ${option.title}. You can now edit and refine it.`,
    });
  };

  // Handle script content change
  const handleScriptChange = (newContent: string) => {
    setScript(newContent);
    // Clear elements when user starts editing, since the structure may have changed
    if (scriptElements) {
      setScriptElements(undefined);
    }
  };

  // Handle script generation from chat (notes/recording workflow)
  const handleScriptGenerated = (generatedScript: string) => {
    setScript(generatedScript);
    toast.success("Script Generated", {
      description: "The AI has generated a new script for you.",
    });
  };

  // Save script
  const handleSave = useCallback(async () => {
    if (!script.trim()) {
      toast.error("Cannot Save Empty Script", {
        description: "Please add some content to your script before saving.",
      });
      return;
    }

    try {
      const response = await fetch("/api/scripts", {
        method: scriptId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: scriptId,
          title: "Untitled Script",
          content: script.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save script");
      }

      const result = await response.json();

      // Update usage stats
      triggerUsageUpdate();

      // Refresh scripts list
      refetch();

      toast.success("Script Saved", {
        description: "Your script has been saved successfully.",
      });

      // If this was a new script, redirect to edit mode
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

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

  // Show script options for speed-write workflow
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

  // Determine if this is a notes/recording workflow (show chat) or speed-write workflow (hide chat)
  const isSpeedWriteWorkflow = mode === "speed-write";
  const isNotesWorkflow = !isSpeedWriteWorkflow;

  return (
    // Content that works within the scrollable panel with production-ready spacing
    <div className="flex h-full flex-col gap-0 lg:flex-row">
      {/* Chat Assistant Panel - Only show for notes/recording workflow */}
      {isNotesWorkflow && (
        <div className="flex flex-1 flex-col lg:max-w-[40%] border-r border-border/50">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <span className="text-lg font-medium">AI Script Assistant</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              Beta
            </Badge>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface onScriptGenerated={handleScriptGenerated} currentScript={script} className="h-full" />
          </div>
        </div>
      )}

      {/* Script Editor Panel - Borderless and Immersive */}
      <div className="flex flex-1 flex-col relative">
        {/* Clean Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            <span className="text-lg font-medium">Hemingway Editor</span>
            <Badge variant="outline" className="ml-2 text-xs">
              <Eye className="mr-1 h-3 w-3" />
              Real-time Analysis
            </Badge>
          </div>
        </div>

        {/* Borderless Editor */}
        <div className="flex-1 overflow-hidden">
          <HemingwayEditor
            value={script}
            onChange={handleScriptChange}
            placeholder={
              isSpeedWriteWorkflow
                ? "Your selected script will appear here. Start editing to refine it..."
                : "Start writing your script here... The AI will analyze it in real-time and highlight hooks, bridges, golden nuggets, and calls-to-action."
            }
            className="h-full"
            autoFocus={!scriptId}
            elements={scriptElements}
          />
        </div>

        {/* Floating Toolbar */}
        <FloatingToolbar script={script} onScriptChange={handleScriptChange} />
      </div>
    </div>
  );
}
