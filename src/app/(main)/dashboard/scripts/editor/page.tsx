"use client";

import { useCallback, useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { ArrowUp, Bot, FileText, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useScripts } from "@/hooks/use-scripts";

import { ChatHistory } from "./_components/chat-history";
import { ScriptOptions } from "./_components/script-options";
import { ChatMessage, ScriptOption, UrlParams, ViewMode, generateUniqueId } from "./_components/types";
import { VideoProcessor } from "./_components/video-processor";

export default function ScriptEditorPage() {
  const searchParams = useSearchParams();
  const { createScript, isCreating } = useScripts();

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
  const [isSaved, setIsSaved] = useState(false);

  // Script Options
  const [scriptOptions, setScriptOptions] = useState<{
    optionA: ScriptOption | null;
    optionB: ScriptOption | null;
  }>({
    optionA: null,
    optionB: null,
  });

  // Parse and set URL parameters
  const parseUrlParameters = useCallback(() => {
    const idea = searchParams.get("idea") ?? undefined;
    const videoUrl = searchParams.get("videoUrl") ?? undefined;
    const mode = searchParams.get("mode") ?? "";
    const length = searchParams.get("length") ?? "20";
    const source = searchParams.get("source") ?? undefined;
    const inputType = (searchParams.get("inputType") ?? "text") as "text" | "video";
    const hasSpeedWriteResults = searchParams.get("hasSpeedWriteResults") === "true";

    setUrlParams({ idea, videoUrl, mode, length, source, inputType });

    return { idea, videoUrl, mode, length, inputType, hasSpeedWriteResults };
  }, [searchParams]);

  // Load Speed Write results from sessionStorage
  const loadSpeedWriteResults = useCallback(() => {
    try {
      const resultsData = sessionStorage.getItem("speedWriteResults");
      if (!resultsData) return null;

      const results = JSON.parse(resultsData);

      // Clear the sessionStorage to avoid stale data
      sessionStorage.removeItem("speedWriteResults");

      // Convert to our ScriptOption format
      const scriptOptions: { optionA: ScriptOption | null; optionB: ScriptOption | null } = {
        optionA: null,
        optionB: null,
      };

      if (results.optionA) {
        scriptOptions.optionA = {
          id: results.optionA.id,
          title: `${results.optionA.title} (${results.optionA.estimatedDuration})`,
          content: results.optionA.content,
        };
      }

      if (results.optionB) {
        scriptOptions.optionB = {
          id: results.optionB.id,
          title: `${results.optionB.title} (${results.optionB.estimatedDuration})`,
          content: results.optionB.content,
        };
      }

      return scriptOptions;
    } catch (error) {
      console.error("❌ Failed to load Speed Write results:", error);
      return null;
    }
  }, []);

  // Generate scripts from text idea (for non-Speed Write modes)
  const generateInitialScripts = useCallback(
    async (idea: string, mode: string, length: string) => {
      // Check if we have Speed Write results to load instead
      if (mode === "speed-write") {
        const speedWriteResults = loadSpeedWriteResults();
        if (speedWriteResults) {
          setScriptOptions(speedWriteResults);

          const aiMessage: ChatMessage = {
            id: generateUniqueId(),
            type: "ai",
            content:
              "I've generated two unique script approaches for you using AI. Option A follows the Speed Write formula for maximum engagement, while Option B takes an educational approach. Choose the one that best fits your style!",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, aiMessage]);
          return;
        }
      }

      // For all modes, use the Speed Write API to generate real scripts
      setIsGenerating(true);

      try {
        const response = await fetch("/api/script/speed-write", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idea,
            length: length as "20" | "60" | "90",
            userId: "user-id", // Replace with actual user ID when available
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate scripts");
        }

        const data = await response.json();

        if (data.success && (data.optionA || data.optionB)) {
          const scriptOptions: { optionA: ScriptOption | null; optionB: ScriptOption | null } = {
            optionA: null,
            optionB: null,
          };

          if (data.optionA) {
            scriptOptions.optionA = {
              id: data.optionA.id,
              title: `${data.optionA.title} (${data.optionA.estimatedDuration})`,
              content: data.optionA.content,
            };
          }

          if (data.optionB) {
            scriptOptions.optionB = {
              id: data.optionB.id,
              title: `${data.optionB.title} (${data.optionB.estimatedDuration})`,
              content: data.optionB.content,
            };
          }

          setScriptOptions(scriptOptions);

          const aiMessage: ChatMessage = {
            id: generateUniqueId(),
            type: "ai",
            content:
              "I've generated two complete scripts for you using AI. Choose the one that best fits your vision and style!",
            timestamp: new Date(),
          };
          setChatHistory((prev) => [...prev, aiMessage]);
        } else {
          throw new Error(data.error || "Failed to generate scripts");
        }
      } catch (error) {
        console.error("❌ Script generation failed:", error);

        const errorMessage: ChatMessage = {
          id: generateUniqueId(),
          type: "error",
          content: "Failed to generate scripts. Please try again or check your connection.",
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, errorMessage]);
      } finally {
        setIsGenerating(false);
      }
    },
    [loadSpeedWriteResults],
  );

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

  // Parse URL parameters on mount
  useEffect(() => {
    const { idea, videoUrl, mode, length, inputType, hasSpeedWriteResults } = parseUrlParameters();

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

  // Handle script save
  const handleSaveScript = async () => {
    if (!workingDraft) return;

    try {
      await createScript({
        title: workingDraft.title,
        content: workingDraft.content,
        approach: "speed-write", // Default approach
        originalIdea: urlParams.idea,
        targetLength: urlParams.length,
      });

      setIsSaved(true);

      // Reset saved state after 3 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save script:", error);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl p-4">
        <div className="grid h-[calc(100vh-10rem)] grid-cols-1 gap-4 md:h-[calc(100vh-8rem)] md:grid-cols-3">
          {/* Left Column: AI Writing Partner (1/3 width) */}
          <div className="flex flex-col md:col-span-1">
            <Card className="flex flex-1 flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3">
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
                  <div className="border-b p-3">
                    <VideoProcessor
                      videoUrl={urlParams.videoUrl}
                      onTranscriptReady={handleVideoTranscriptReady}
                      onError={handleVideoError}
                    />
                  </div>
                )}

                {/* Chat History */}
                <div className="flex-1 overflow-auto p-3">
                  <ChatHistory messages={chatHistory} />
                </div>

                {/* Sticky Chat Input */}
                <div className="bg-background flex-shrink-0 border-t p-4">
                  <div className="flex items-center gap-3">
                    <Textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          !isGenerating &&
                          !isProcessingVideo &&
                          chatInput.trim()
                        ) {
                          e.preventDefault();
                          handleChatSubmit();
                        }
                      }}
                      placeholder="Ask me to adjust the tone, add details, or make changes..."
                      className="max-h-[100px] min-h-[44px] flex-1 resize-none"
                      disabled={isGenerating || isProcessingVideo}
                    />
                    <Button
                      onClick={handleChatSubmit}
                      disabled={isGenerating || isProcessingVideo || !chatInput.trim()}
                      size="icon"
                      className="h-10 w-10"
                    >
                      <ArrowUp size={18} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Script Canvas (2/3 width) */}
          <div className="flex flex-col md:col-span-2">
            <Card className="flex flex-1 flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {viewMode === "ab-comparison" ? "Choose Your Script" : "Script Editor"}
                </CardTitle>
                {workingDraft && (
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="w-fit">
                      Working on: {workingDraft.title}
                    </Badge>
                    <Button
                      onClick={handleSaveScript}
                      disabled={isCreating}
                      size="sm"
                      className="ml-2"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isCreating ? "Saving..." : isSaved ? "Saved!" : "Save Script"}
                    </Button>
                  </div>
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
                    <div className="bg-muted/30 rounded-lg border p-4">
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
        </div>
      </div>
    </div>
  );
}
