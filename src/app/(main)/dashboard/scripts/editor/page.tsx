"use client";

import { useState, useEffect, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { ArrowLeft, Eye, FileText, Loader2, MessageCircle, Save, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUsage } from "@/contexts/usage-context";
import { useScripts } from "@/hooks/use-scripts";

import { ChatInterface } from "./_components/chat-interface";
import { HemingwayEditor } from "./_components/hemingway-editor";
import { SplitLayout } from "./_components/split-layout";

export default function ScriptEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { triggerUsageUpdate } = useUsage();

  const scriptId = searchParams.get("id");
  const [script, setScript] = useState("");
  const [title, setTitle] = useState("Untitled Script");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { scripts, isLoading: scriptsLoading, refetch } = useScripts();

  // Load script if editing existing one
  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const existingScript = scripts.find((s) => s.id === scriptId);
      if (existingScript) {
        setScript(existingScript.content);
        setTitle(existingScript.title);
      }
    }
  }, [scriptId, scripts]);

  // Track unsaved changes
  useEffect(() => {
    if (scriptId && scripts.length > 0) {
      const existingScript = scripts.find((s) => s.id === scriptId);
      if (existingScript) {
        setHasUnsavedChanges(script !== existingScript.content || title !== existingScript.title);
      }
    } else {
      setHasUnsavedChanges(script.trim() !== "" || title !== "Untitled Script");
    }
  }, [script, title, scriptId, scripts]);

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
          title: title.trim(),
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
        description: `Your script "${title}" has been saved successfully.`,
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
  }, [script, scriptId, title, triggerUsageUpdate, refetch, router]);

  // Handle back navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push("/dashboard/scripts");
      }
    } else {
      router.push("/dashboard/scripts");
    }
  };

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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center justify-between border-b p-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-5 w-5" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus:bg-muted/50 rounded border-none bg-transparent px-2 py-1 text-lg font-semibold outline-none"
              placeholder="Enter script title..."
            />
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="mr-1 h-3 w-3" />
            AI-Powered
          </Badge>

          <Button onClick={handleSave} disabled={isSaving || !script.trim()} className="flex items-center gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftPanel={
            <ChatInterface onScriptGenerated={handleScriptGenerated} currentScript={script} className="h-full" />
          }
          rightPanel={
            <HemingwayEditor
              value={script}
              onChange={handleScriptChange}
              placeholder="Start writing your script here... The AI will analyze it in real-time and highlight hooks, bridges, golden nuggets, and calls-to-action."
              className="h-full"
              autoFocus={!scriptId}
            />
          }
          defaultSizes={[40, 60]}
          minSizes={[300, 400]}
          className="h-full"
        />
      </div>

      {/* Footer */}
      <div className="bg-muted/20 text-muted-foreground flex items-center justify-between border-t p-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>AI Chat Assistant</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Real-time Analysis</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Hemingway Editor</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <kbd className="bg-muted rounded px-2 py-1 text-xs">⌘S</kbd>
          <span>to save</span>
        </div>
      </div>
    </div>
  );
}
