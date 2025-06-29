"use client";

import { useCallback, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Bot, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ChatHistory } from "./_components/chat-history";
import { ScriptChatInput } from "./_components/script-chat-input";
import { ScriptOptions } from "./_components/script-options";
import {
  ChatMessage,
  RefinementControls,
  ScriptOption,
  UrlParams,
  ViewMode,
  generateScriptContent,
  generateUniqueId,
} from "./_components/types";
import { VideoProcessor } from "./_components/video-processor";

export default function ScriptEditorPage() {
  const searchParams = useSearchParams();

  // URL Parameters
  const [urlParams, setUrlParams] = useState<UrlParams>({
    mode: "",
    length: "",
    inputType: "text",
  });

  // Core State
  const [viewMode, setViewMode] = useState<ViewMode>("ab-comparison");
  const [workingDraft, setWorkingDraft] = useState<ScriptOption | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);

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

  // Generate scripts from text idea
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
        id: generateUniqueId(),
        type: "ai",
        content:
          "I've generated two script options for you. Option A focuses on a strong hook, while Option B takes a storytelling approach. Choose the one that resonates with your vision!",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 2000);
  }, []);

  // Handle video transcription completion
  const handleVideoTranscriptReady = useCallback(
    (transcript: string) => {
      setIsProcessingVideo(false);

      // Add transcript to chat history
      const transcriptMessage: ChatMessage = {
        id: generateUniqueId(),
        type: "system",
        content: `Video transcription completed. Here's what was said:\n\n"${transcript}"`,
        timestamp: new Date(),
        metadata: {
          videoUrl: urlParams.videoUrl,
          processingStep: "complete",
        },
      };
      setChatHistory((prev) => [...prev, transcriptMessage]);

      // Generate script options based on transcript
      generateInitialScripts(transcript, urlParams.mode, urlParams.length);
    },
    [urlParams, generateInitialScripts],
  );

  // Handle video processing error
  const handleVideoError = useCallback(
    (error: string) => {
      setIsProcessingVideo(false);

      const errorMessage: ChatMessage = {
        id: generateUniqueId(),
        type: "error",
        content: `Failed to process video: ${error}`,
        timestamp: new Date(),
        metadata: {
          videoUrl: urlParams.videoUrl,
          retryable: true,
        },
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    },
    [urlParams.videoUrl],
  );

  // Process video URL input
  const processVideoInput = useCallback((videoUrl: string) => {
    setIsProcessingVideo(true);

    const initialMessage: ChatMessage = {
      id: generateUniqueId(),
      type: "user",
      content: `Analyze this video and create script options: ${decodeURIComponent(videoUrl)}`,
      timestamp: new Date(),
    };
    setChatHistory([initialMessage]);
  }, []);

  // Process text idea input
  const processTextInput = useCallback(
    (idea: string, mode: string, length: string) => {
      const initialMessage: ChatMessage = {
        id: generateUniqueId(),
        type: "user",
        content: `Write a script based on: ${decodeURIComponent(idea)}`,
        timestamp: new Date(),
      };
      setChatHistory([initialMessage]);

      // Generate scripts from text idea
      generateInitialScripts(decodeURIComponent(idea), mode, length);
    },
    [generateInitialScripts],
  );

  // Parse and set URL parameters
  const parseUrlParameters = useCallback(() => {
    const idea = searchParams.get("idea") ?? undefined;
    const videoUrl = searchParams.get("videoUrl") ?? undefined;
    const mode = searchParams.get("mode") ?? "";
    const length = searchParams.get("length") ?? "20";
    const source = searchParams.get("source") ?? undefined;
    const inputType = (searchParams.get("inputType") ?? "text") as "text" | "video";

    setUrlParams({ idea, videoUrl, mode, length, source, inputType });
    setRefinementControls((prev) => ({ ...prev, scriptLength: length }));

    return { idea, videoUrl, mode, length, inputType };
  }, [searchParams]);

  // Parse URL parameters on mount
  useEffect(() => {
    const { idea, videoUrl, mode, length, inputType } = parseUrlParameters();

    // Handle different input types
    if (inputType === "video" && videoUrl) {
      processVideoInput(videoUrl);
    } else if (inputType === "text" && idea) {
      processTextInput(idea, mode, length);
    }
  }, [parseUrlParameters, processVideoInput, processTextInput]);

  // Handle script option selection
  const handleOptionSelect = (option: ScriptOption) => {
    setWorkingDraft(option);
    setViewMode("editor");

    const selectionMessage: ChatMessage = {
      id: generateUniqueId(),
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
      id: generateUniqueId(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: generateUniqueId(),
        type: "ai",
        content: "I understand your request. I'm updating the script based on your feedback...",
        timestamp: new Date(),
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid h-[calc(100vh-6rem)] grid-cols-3 gap-6">
          {/* Left Column: Script Canvas (2/3 width) */}
          <div className="col-span-2 flex flex-col space-y-4">
            <Card className="flex flex-1 flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Script Canvas
                </CardTitle>
                {workingDraft && (
                  <Badge variant="outline" className="w-fit">
                    Working on: {workingDraft.title}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {viewMode === "ab-comparison" && scriptOptions ? (
                  <ScriptOptions
                    optionA={scriptOptions.optionA}
                    optionB={scriptOptions.optionB}
                    isGenerating={isGenerating}
                    onSelect={handleOptionSelect}
                  />
                ) : workingDraft ? (
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg border p-6">
                      <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {workingDraft.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground flex h-full items-center justify-center">
                    <div className="text-center">
                      <FileText className="mx-auto mb-4 h-12 w-12" />
                      <p>Your script will appear here once generated</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Writing Partner (1/3 width) */}
          <div className="flex flex-col">
            <Card className="flex flex-1 flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0">
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

              {/* Chat Content */}
              <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                {/* Video Processing */}
                {isProcessingVideo && urlParams.videoUrl && (
                  <div className="border-b p-4">
                    <VideoProcessor
                      videoUrl={urlParams.videoUrl}
                      onTranscriptReady={handleVideoTranscriptReady}
                      onError={handleVideoError}
                    />
                  </div>
                )}

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-4">
                  <ChatHistory messages={chatHistory} />
                </div>

                {/* Sticky Chat Input */}
                <ScriptChatInput
                  value={chatInput}
                  onChange={setChatInput}
                  onSubmit={handleChatSubmit}
                  disabled={isGenerating || isProcessingVideo}
                  refinementControls={refinementControls}
                  onRefinementChange={setRefinementControls}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
