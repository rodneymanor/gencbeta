"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileText, Loader2, MessageCircle, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUsage } from "@/contexts/usage-context";

import { ChatInterface } from "./_components/chat-interface";
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

  const scriptId = searchParams.get("id");
  const mode = searchParams.get("mode"); // "speed-write" or null
  const hasSpeedWriteResults = searchParams.get("hasSpeedWriteResults") === "true";

  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [speedWriteData, setSpeedWriteData] = useState<SpeedWriteResponse | null>(null);
  const [showScriptOptions, setShowScriptOptions] = useState(false);
  const [scriptElements, setScriptElements] = useState<ScriptElements | undefined>(undefined);

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

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
    <div className="flex h-full flex-col gap-6 p-6 lg:flex-row">
      {/* Chat Assistant Card - Only show for notes/recording workflow */}
      {isNotesWorkflow && (
        <Card className="flex flex-1 flex-col border-2 shadow-lg lg:max-w-[40%]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              AI Script Assistant
              <Badge variant="secondary" className="ml-auto text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Beta
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ChatInterface onScriptGenerated={handleScriptGenerated} currentScript={script} className="h-full" />
          </CardContent>
        </Card>
      )}

      {/* Script Editor Card */}
      <Card className="flex flex-1 flex-col border-2 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-orange-500" />
            Hemingway Editor
            <Badge variant="outline" className="ml-auto text-xs">
              <Eye className="mr-1 h-3 w-3" />
              Real-time Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
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
        </CardContent>
      </Card>

      {/* Floating Editor Controls */}
      <div className="fixed right-6 bottom-6 z-20">
        <Card className="bg-background/95 border-2 shadow-2xl backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                <span>Editor Controls</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <kbd className="bg-muted rounded px-2 py-1 text-xs">⌘S</kbd>
                <span className="text-muted-foreground text-sm">to save</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
