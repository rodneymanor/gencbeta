"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams } from "next/navigation";

import { Send, Bot } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { ChatHistory } from "./_components/chat-history";
import { RefinementControlsSection } from "./_components/refinement-controls";
import { ScriptOptions } from "./_components/script-options";
import {
  ChatMessage,
  ScriptOption,
  RefinementControls,
  ViewMode,
  UrlParams,
  generateScriptContent,
} from "./_components/types";

export default function ScriptEditorPage() {
  const searchParams = useSearchParams();

  // URL Parameters
  const [urlParams, setUrlParams] = useState<UrlParams>({
    idea: "",
    mode: "",
    length: "",
    source: "",
  });

  // Core State
  const [viewMode, setViewMode] = useState<ViewMode>("ab-comparison");
  const [workingDraft, setWorkingDraft] = useState<ScriptOption | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Script Options
  const [scriptOptions, setScriptOptions] = useState<{
    optionA: ScriptOption | null;
    optionB: ScriptOption | null;
  }>({
    optionA: null,
    optionB: null,
  });

  // Refinement Controls
  const [refinementControls, setRefinementControls] = useState<RefinementControls>({
    toneOfVoice: "casual",
    voiceEngine: "creator-a",
    scriptLength: "20",
  });

  // Simulate AI script generation
  const generateInitialScripts = useCallback(async (idea: string, mode: string, length: string) => {
    setIsGenerating(true);

    // Simulate API delay
    setTimeout(() => {
      const optionA: ScriptOption = {
        id: "option-a",
        title: "Option A",
        content: generateScriptContent(idea, "hook-focused", length),
      };

      const optionB: ScriptOption = {
        id: "option-b",
        title: "Option B",
        content: generateScriptContent(idea, "story-focused", length),
      };

      setScriptOptions({ optionA, optionB });

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content:
          "I've generated two script options for you. Option A focuses on a strong hook, while Option B takes a storytelling approach. Choose the one that resonates with your vision!",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 2000);
  }, []);

  // Parse URL parameters on mount
  useEffect(() => {
    const idea = searchParams.get("idea") ?? "";
    const mode = searchParams.get("mode") ?? "";
    const length = searchParams.get("length") ?? "20";
    const source = searchParams.get("source") ?? "";

    setUrlParams({ idea, mode, length, source });
    setRefinementControls((prev) => ({ ...prev, scriptLength: length }));

    // Add initial user message to chat
    if (idea) {
      const initialMessage: ChatMessage = {
        id: "initial",
        type: "user",
        content: `Write a script based on: ${decodeURIComponent(idea)}`,
        timestamp: new Date(),
      };
      setChatHistory([initialMessage]);

      // Simulate AI script generation
      generateInitialScripts(decodeURIComponent(idea), mode, length);
    }
  }, [searchParams, generateInitialScripts]);

  // Handle script option selection
  const handleOptionSelect = (option: ScriptOption) => {
    setWorkingDraft(option);
    setViewMode("editor");

    const selectionMessage: ChatMessage = {
      id: `selection-${Date.now()}`,
      type: "ai",
      content: `Great choice! I've loaded ${option.title} as your working draft. You can now refine it by asking me to adjust the tone, add specific details, or make any other changes.`,
      timestamp: new Date(),
    };
    setChatHistory((prev) => [...prev, selectionMessage]);
  };

  // Handle chat submission
  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: "I understand your request. I'm updating the script based on your feedback...",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid h-[calc(100vh-6rem)] grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: AI Writing Partner */}
          <div className="flex flex-col space-y-4">
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Writing Partner
                </CardTitle>
                {urlParams.mode && (
                  <Badge variant="outline" className="w-fit">
                    {urlParams.mode.charAt(0).toUpperCase() + urlParams.mode.slice(1)} Mode
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col space-y-4">
                {/* Chat History */}
                <ChatHistory chatHistory={chatHistory} isGenerating={isGenerating} />

                <Separator />

                {/* Refinement Controls */}
                <RefinementControlsSection
                  refinementControls={refinementControls}
                  setRefinementControls={setRefinementControls}
                />
              </CardContent>

              <CardFooter>
                {viewMode === "editor" && (
                  <div className="flex w-full gap-2">
                    <Input
                      placeholder="Ask me to refine your script..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <Button onClick={handleChatSubmit} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Script Canvas */}
          <div className="flex flex-col">
            {viewMode === "ab-comparison" ? (
              <ScriptOptions
                optionA={scriptOptions.optionA}
                optionB={scriptOptions.optionB}
                onOptionSelect={handleOptionSelect}
                isGenerating={isGenerating}
              />
            ) : (
              // Editor State - Working Draft
              <div className="flex h-full flex-col">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Working Draft</h2>
                  <Badge variant="outline">{workingDraft?.title}</Badge>
                </div>

                <Card className="flex-1">
                  <CardContent className="h-full p-6">
                    <pre className="h-full overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap">
                      {workingDraft?.content}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
