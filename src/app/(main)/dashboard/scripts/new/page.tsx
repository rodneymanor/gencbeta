"use client";

import { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Mic } from "lucide-react";

import { GhostWriter } from "@/components/ghost-writer";
import { OnboardingPulseTrigger } from "@/components/onboarding/onboarding-pulse-trigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useUsage } from "@/contexts/usage-context";
import { useVoice } from "@/contexts/voice-context";
import { ClientScriptService, SpeedWriteResponse } from "@/lib/services/client-script-service";
import { ClientHookService } from "@/lib/services/client-hook-service";
import { type HookGenerationResponse } from "@/lib/prompts/hook-generation";

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
  const [hookResponse, setHookResponse] = useState<HookGenerationResponse | null>(null);

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

  // Handle GhostWriter same-page idea injection
  useEffect(() => {
    const handleGhostWriterIdea = (event: CustomEvent) => {
      const { ideaText, duration } = event.detail;
      console.log("🎯 [Scripts/New] Received GhostWriter idea:", ideaText);

      setScriptIdea(ideaText);

      if (duration) {
        setScriptLength(duration);
      }
    };

    // Listen for custom event from GhostWriter
    window.addEventListener("ghostwriter-idea-selected", handleGhostWriterIdea as EventListener);

    return () => {
      window.removeEventListener("ghostwriter-idea-selected", handleGhostWriterIdea as EventListener);
    };
  }, []);

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
      } else {
        // Handle failed generation
        setSpeedWriteResponse({
          success: false,
          optionA: null,
          optionB: null,
          error: data.error || "Failed to generate scripts",
        });
      }
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

  const handleHookGeneration = async (idea: string) => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setHookResponse(null);

    try {
      // Call hook generation service
      const data = await ClientHookService.generateHooks(idea);

      if (data.hooks && data.hooks.length > 0) {
        // Trigger usage stats update after successful hook generation
        triggerUsageUpdate();

        // Store results and navigate to editor
        sessionStorage.setItem("hookGenerationResults", JSON.stringify(data));

        const params = new URLSearchParams({
          idea: encodeURIComponent(idea),
          mode: "hook-generator",
          hasHookResults: "true",
        });

        const editorUrl = `/dashboard/scripts/editor?${params.toString()}`;
        router.push(editorUrl);
      }
    } catch (error) {
      console.error("Hook generation error:", error);
      setHookResponse({
        hooks: [],
      });
      // Show error in UI
      setSpeedWriteResponse({
        success: false,
        optionA: null,
        optionB: null,
        error: error instanceof Error ? error.message : "Failed to generate hooks",
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
      // Generate hooks using Gemini
      await handleHookGeneration(scriptIdea);
    }
  };

  // Show loading state while generating
  if (isGenerating) {
    const isHookMode = inputMode === "hook-generator";
    return (
      <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
        <div className="flex flex-1 items-center justify-center py-[var(--space-4)] pt-[var(--space-8)]">
          <div className="flex w-full flex-col items-center justify-center">
            <div className="mb-[var(--space-4)] text-center">
              <div className="mb-[var(--space-2)] flex items-center justify-center gap-3">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                <h1 className="text-foreground font-inter text-3xl font-bold">
                  {isHookMode ? "Generating Viral Hooks" : "Generating Your A/B Script Options"}
                </h1>
              </div>
              <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                {isHookMode
                  ? "Our AI is crafting multiple hook variations to capture attention"
                  : "Our AI is crafting two different script variations for you to choose from"}
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

  const handleOnboardingComplete = async (data: { description: string; speaksAbout: string; instructions: string }) => {
    try {
      // TODO: Save onboarding data to backend
      console.log("Onboarding completed:", data);

      // Here you would typically save to your backend
      // await fetch("/api/user/onboarding", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });
    } catch (error) {
      console.error("Failed to save onboarding data:", error);
      throw error;
    }
  };

  const handleGenerateTopics = async (description: string): Promise<string> => {
    try {
      // TODO: Implement AI topic generation
      console.log("Generating topics for:", description);

      // Mock topic generation - replace with actual API call
      const mockTopics = [
        "Content creation strategies",
        "AI-powered writing techniques",
        "Social media optimization",
        "Personal branding tips",
        "Audience engagement methods",
      ].join(", ");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return mockTopics;
    } catch (error) {
      console.error("Failed to generate topics:", error);
      throw error;
    }
  };

  return (
    <div className="hide-scrollbar flex min-h-[calc(100vh-6rem)] flex-col overflow-y-auto">
      {/* Onboarding Pulse Trigger */}
      <OnboardingPulseTrigger
        position="bottom-right"
        tooltip="Get AI-powered content ideas ✨"
        onComplete={handleOnboardingComplete}
        onGenerateTopics={handleGenerateTopics}
        onboardingImageSrc="/img/ai_hand.png"
      />

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
                className="border-primary/20 text-primary bg-primary/10 rounded-xl border px-[var(--space-2)] py-[var(--space-1)] text-sm"
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
              duration={scriptLength}
              onDurationChange={setScriptLength}
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
