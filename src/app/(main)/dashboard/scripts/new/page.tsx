"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Clock, Wand2, Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/auth-context";

import { IdeaInboxDialog } from "./_components/idea-inbox-dialog";
import { InputModeToggle, InputMode } from "./_components/input-mode-toggle";
import { DailyIdea, ScriptMode, mockDailyIdeas, scriptModes, getSourceIcon, getSourceColor } from "./_components/types";

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
  const { userProfile } = useAuth();

  // Input mode state
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [scriptIdea, setScriptIdea] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  // Other state
  const [selectedMode, setSelectedMode] = useState<ScriptMode["id"]>("speed-write");
  const [scriptLength, setScriptLength] = useState("20");
  const [dailyIdeas, setDailyIdeas] = useState(mockDailyIdeas);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speedWriteResponse, setSpeedWriteResponse] = useState<SpeedWriteResponse | null>(null);

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

  const handleMagicWand = async (idea: DailyIdea) => {
    if (selectedMode === "speed-write") {
      await handleSpeedWrite(idea.text);
    } else {
      // Legacy mode handling
      const params = new URLSearchParams({
        idea: encodeURIComponent(idea.text),
        mode: selectedMode,
        length: scriptLength,
        source: idea.source,
        inputType: "text",
      });

      router.push(`/dashboard/scripts/editor?${params.toString()}`);
    }
  };

  const handleBookmark = (ideaId: string) => {
    setDailyIdeas((prev) =>
      prev.map((idea) => (idea.id === ideaId ? { ...idea, isBookmarked: !idea.isBookmarked } : idea)),
    );
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

        {/* Daily Ideas Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Daily Ideas for You</h3>
            <Button variant="ghost" size="sm">
              Refresh Ideas
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Idea</TableHead>
                  <TableHead className="w-[15%]">Source</TableHead>
                  <TableHead className="w-[15%]">Category</TableHead>
                  <TableHead className="w-[10%] text-center">Saved</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyIdeas.map((idea) => {
                  const SourceIcon = getSourceIcon(idea.source);

                  return (
                    <TableRow key={idea.id} className="group">
                      <TableCell className="font-medium">
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {idea.text}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${getSourceColor(idea.source)}`}>
                          <SourceIcon className="mr-1 h-3 w-3" />
                          {idea.source === "google-trends" ? "Trends" : idea.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">{idea.category}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(idea.id)}
                          className={`h-8 w-8 p-0 ${idea.isBookmarked ? "text-yellow-500" : ""}`}
                        >
                          <Bookmark className={`h-4 w-4 ${idea.isBookmarked ? "fill-current" : ""}`} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleMagicWand(idea)}
                          className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Wand2 className="h-4 w-4" />
                          Script
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
