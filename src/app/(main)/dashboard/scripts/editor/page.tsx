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

export default function ScriptEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerUsageUpdate } = useUsage();

  const scriptId = searchParams.get("id");
  const [script, setScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Load script if editing existing one
  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const existingScript = scripts.find((s: any) => s.id === scriptId);
      if (existingScript) {
        setScript(existingScript.content);
      }
    }
  }, [scriptId, scripts]);

  // Handle script content change
  const handleScriptChange = (newContent: string) => {
    setScript(newContent);
  };

  // Handle script generation from chat
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

  return (
    // Container that works with the dashboard's full-width system
    <div className="bg-background flex min-h-screen flex-col p-4 md:p-6">
      {/* Main Content - Responsive Card Layout */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        {/* Chat Assistant Card */}
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
              placeholder="Start writing your script here... The AI will analyze it in real-time and highlight hooks, bridges, golden nuggets, and calls-to-action."
              className="h-full"
              autoFocus={!scriptId}
            />
          </CardContent>
        </Card>
      </div>

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
