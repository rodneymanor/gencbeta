"use client";

import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Mic } from "lucide-react";

import { GhostWriter } from "@/components/ghost-writer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useUsage } from "@/contexts/usage-context";
import { useVoice } from "@/contexts/voice-context";
import { ClientScriptService, SpeedWriteResponse } from "@/lib/services/client-script-service";

import { InputModeToggle, InputMode } from "./_components/input-mode-toggle";

export default function NewScriptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();
  const { triggerUsageUpdate } = useUsage();
  const { currentVoice } = useVoice();

  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>("script-writer");
  const [scriptIdea, setScriptIdea] = useState("");

  // Other state
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
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const callSpeedWriteAPI = async (idea: string): Promise<SpeedWriteResponse> => {
    const result = await ClientScriptService.generateSpeedWrite({
      idea,
      length: scriptLength as "20" | "60" | "90",
      userId: userProfile?.uid,
    });

    return result;
  };

  const handleSpeedWrite = async (idea: string) => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setSpeedWriteResponse(null);

    try {
      // Wait for API to complete first
      const data = await callSpeedWriteAPI(idea);

      if (data.success && (data.optionA || data.optionB)) {
        // Trigger usage stats update after successful script generation
        triggerUsageUpdate();
      }

      // Store results and navigate to editor
      sessionStorage.setItem("speedWriteResults", JSON.stringify(data));

      const params = new URLSearchParams({
        idea: encodeURIComponent(idea),
        mode: "speed-write",
        length: scriptLength,
        inputType: "text",
        hasSpeedWriteResults: "true",
      });

      const editorUrl = `/dashboard/scripts/editor?${params.toString()}`;
      router.push(editorUrl);
    } catch (error) {
      console.error("Script generation error:", error);
      setSpeedWriteResponse({
        success: false,
        optionA: null,
        optionB: null,
        error: error instanceof Error ? error.message : "Failed to generate scripts",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!scriptIdea.trim()) {
      return;
    }

    if (inputMode === "script-writer") {
      // Use the existing speed write workflow for script writer
      await handleSpeedWrite(scriptIdea);
    } else if (inputMode === "hook-generator") {
      // For hook generator, navigate to Hemingway editor with hook generation mode
      const params = new URLSearchParams({
        idea: encodeURIComponent(scriptIdea),
        mode: "hook-generator",
        length: scriptLength,
        inputType: "text",
      });

      router.push(`/dashboard/scripts/editor?${params.toString()}`);
    }
  };

  // Show loading state while generating scripts
  if (isGenerating) {
    return (
      <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
        <div className="flex flex-1 items-center justify-center py-[var(--space-4)] pt-[var(--space-8)]">
          <div className="flex w-full flex-col items-center justify-center">
            <div className="mb-[var(--space-4)] text-center">
              <div className="mb-[var(--space-2)] flex items-center justify-center gap-3">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                <h1 className="text-foreground font-inter text-3xl font-bold">Generating Your A/B Script Options</h1>
              </div>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                Our AI is crafting two different script variations for you to choose from
              </p>
              <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-sm">
                This usually takes 10-15 seconds...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
      {/* Hero Section - Vertically Centered */}
      <div className="flex flex-1 items-center justify-center py-[var(--space-4)] pt-[var(--space-8)]">
        <div className="flex w-full flex-col items-center justify-center">
          {/* Header */}
          <div className="mb-[var(--space-4)] text-center">
            <h1 className="text-foreground font-inter mb-[var(--space-1)] text-5xl font-bold">
              What&apos;s your content idea?
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Transform your ideas into engaging content with AI assistance
            </p>
          </div>

          {/* Error Display */}
          {speedWriteResponse && !speedWriteResponse.success && (
            <Card className="border-destructive bg-destructive/5 mb-[var(--space-3)] w-full max-w-2xl p-[var(--space-2)]">
              <div className="text-destructive flex items-center gap-[var(--space-1)]">
                <span className="font-medium">Generation Failed:</span>
                <span>{speedWriteResponse.error}</span>
                <Button variant="outline" size="sm" onClick={() => setSpeedWriteResponse(null)} className="ml-auto">
                  Dismiss
                </Button>
              </div>
            </Card>
          )}

          {/* Main Input Section - 700px width */}
          <div className="w-full max-w-2xl">
            {/* Voice Badge */}
            <div className="mb-[var(--space-2)] flex justify-center">
              <Badge
                variant="outline"
                className="border-primary/30 text-primary bg-primary/10 px-[var(--space-2)] py-[var(--space-1)] text-sm"
              >
                <Mic className="mr-[var(--space-1)] h-3 w-3" />
                {currentVoice} Voice
              </Badge>
            </div>

            <InputModeToggle
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              textValue={scriptIdea}
              onTextChange={setScriptIdea}
              onSubmit={handleSubmit}
              disabled={isGenerating}
            />

            {/* Controls Row - Simplified */}
            <div className="mt-[var(--space-2)] flex items-center justify-center gap-[var(--space-2)]">
              <div className="text-muted-foreground text-sm">Press ⌘+Enter to generate content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ghost Writer Section - Below Hero */}
      <div className="mx-auto w-full max-w-7xl px-[var(--space-2)] pt-[var(--space-6)] pb-[var(--space-4)]">
        <div className="bg-sidebar rounded-lg p-[var(--space-2)] md:p-[var(--space-4)]">
          <GhostWriter />
        </div>
      </div>
    </div>
  );
}
