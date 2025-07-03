"use client";

import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Clock } from "lucide-react";

import { GhostWriter } from "@/components/ghost-writer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useUsage } from "@/contexts/usage-context";

import { IdeaInboxDialog } from "./_components/idea-inbox-dialog";
import { InputModeToggle, InputMode } from "./_components/input-mode-toggle";
import { ScriptMode, scriptModes } from "./_components/types";

interface ScriptOption {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: "speed-write" | "educational";
}

interface SpeedWriteResponse {
  success: boolean;
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  error?: string;
  processingTime?: number;
}

export default function NewScriptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const { triggerUsageUpdate } = useUsage();

  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [scriptIdea, setScriptIdea] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Other state
  const [selectedMode, setSelectedMode] = useState<ScriptMode["id"]>("speed-write");
  const [scriptLength, setScriptLength] = useState("20");
  const [isGenerating, setIsGenerating] = useState(false);
  const [speedWriteResponse, setSpeedWriteResponse] = useState<SpeedWriteResponse | null>(null);

  // Handle URL parameters from Ghost Writer
  useEffect(() => {
    const ideaParam = searchParams.get("idea");
    const scriptParam = searchParams.get("script");
    const hookParam = searchParams.get("hook");
    const outlineParam = searchParams.get("outline");
    const lengthParam = searchParams.get("length");

    if (ideaParam || scriptParam) {
      // Pre-fill the form with Ghost Writer data
      let fullIdea = "";

      // Priority: use script content if available, otherwise use idea
      if (scriptParam) {
        fullIdea = scriptParam;
      } else if (ideaParam) {
        fullIdea = ideaParam;

        // Add additional sections if available
        if (hookParam) {
          fullIdea += `\n\nHook: ${hookParam}`;
        }
        if (outlineParam) {
          fullIdea += `\n\nOutline: ${outlineParam}`;
        }
      }

      setScriptIdea(fullIdea);

      if (lengthParam) {
        setScriptLength(lengthParam);
      }

      // Clear URL parameters after setting state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const callSpeedWriteAPI = async (idea: string): Promise<SpeedWriteResponse> => {
    // Get Firebase Auth token
    const { auth } = await import("@/lib/firebase");
    if (!auth?.currentUser) {
      throw new Error("User not authenticated");
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch("/api/script/speed-write", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        idea,
        length: scriptLength,
        userId: userProfile?.uid ?? "anonymous",
      }),
    });

    const data: SpeedWriteResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to generate scripts");
    }

    return data;
  };

  const navigateToEditor = (idea: string, data: SpeedWriteResponse) => {
    const params = new URLSearchParams({
      idea: encodeURIComponent(idea),
      mode: "speed-write",
      length: scriptLength,
      inputType: "text",
      hasSpeedWriteResults: "true",
    });

    sessionStorage.setItem("speedWriteResults", JSON.stringify(data));
    router.push(`/dashboard/scripts/editor?${params.toString()}`);
  };

  const handleSpeedWrite = async (idea: string) => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setSpeedWriteResponse(null);

    try {
      console.log("🚀 Calling Speed Write API...");
      const data = await callSpeedWriteAPI(idea);

      console.log("✅ Speed Write API response:", data);
      setSpeedWriteResponse(data);

      if (data.success && (data.optionA || data.optionB)) {
        // Trigger usage stats update after successful script generation
        console.log("💳 [Scripts] Triggering usage stats update after script generation");
        triggerUsageUpdate();

        navigateToEditor(idea, data);
      }
    } catch (error) {
      console.error("❌ Speed Write API error:", error);
      setSpeedWriteResponse({
        success: false,
        optionA: null,
        optionB: null,
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (inputMode === "text") {
      if (!scriptIdea.trim()) return;

      if (selectedMode === "speed-write") {
        await handleSpeedWrite(scriptIdea);
      } else {
        // Legacy mode handling for other modes
        const params = new URLSearchParams({
          idea: encodeURIComponent(scriptIdea),
          mode: selectedMode,
          length: scriptLength,
          inputType: "text",
        });

        router.push(`/dashboard/scripts/editor?${params.toString()}`);
      }
    } else {
      if (!videoUrl.trim()) return;

      const params = new URLSearchParams({
        videoUrl: encodeURIComponent(videoUrl),
        mode: selectedMode,
        length: scriptLength,
        inputType: "video",
      });

      router.push(`/dashboard/scripts/editor?${params.toString()}`);
    }
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">What will you Script today?</h1>
          <p className="text-muted-foreground text-lg">
            Start with an idea, analyze a viral video, or create a structured story from scratch.
          </p>
        </div>

        {/* Error Display */}
        {speedWriteResponse && !speedWriteResponse.success && (
          <Card className="border-destructive bg-destructive/5 p-4">
            <div className="text-destructive flex items-center gap-2">
              <span className="font-medium">Generation Failed:</span>
              <span>{speedWriteResponse.error}</span>
              <Button variant="outline" size="sm" onClick={() => setSpeedWriteResponse(null)} className="ml-auto">
                Dismiss
              </Button>
            </div>
          </Card>
        )}

        {/* Main Input Section with Mode Toggle */}
        <div className="space-y-6">
          <InputModeToggle
            inputMode={inputMode}
            onInputModeChange={setInputMode}
            textValue={scriptIdea}
            onTextChange={setScriptIdea}
            videoUrl={videoUrl}
            onVideoUrlChange={setVideoUrl}
            onSubmit={handleSubmit}
            disabled={isGenerating}
          />

          {/* Controls Row */}
          <div className="flex flex-wrap items-center gap-4">
            <IdeaInboxDialog />

            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <Select value={scriptLength} onValueChange={setScriptLength} disabled={isGenerating}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-border h-4 w-px" />

            {/* Script Mode Buttons - Horizontal Layout */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-medium">Mode:</span>
              {scriptModes.map((mode) => {
                const IconComponent = mode.icon;
                const isSelected = selectedMode === mode.id;

                return (
                  <Button
                    key={mode.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={!mode.available || isGenerating}
                    className={`gap-2 ${!mode.available ? "opacity-50" : ""}`}
                    onClick={() => mode.available && setSelectedMode(mode.id)}
                  >
                    <IconComponent className="h-4 w-4" />
                    {mode.label}
                    {!mode.available && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Soon
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            <div className="text-muted-foreground ml-auto text-sm">
              Press ⌘+Enter to{" "}
              {selectedMode === "speed-write"
                ? "generate scripts"
                : inputMode === "video"
                  ? "process video"
                  : "create script"}
            </div>
          </div>
        </div>

        {/* Ghost Writer Section */}
        <GhostWriter />
      </div>
    </div>
  );
}
