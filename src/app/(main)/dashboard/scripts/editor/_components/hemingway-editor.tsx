"use client";

import { useState, useEffect, useRef } from "react";

import { PartialBlock } from "@blocknote/core";
import {
  BarChart3,
  Clock,
  FileText,
  Target,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Mic,
  MicOff,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  EnhancedReadabilityService,
  defaultReadabilitySettings,
  type ReadabilityAnalysis,
} from "@/lib/enhanced-readability-service";
import { type HighlightConfig, type ScriptAnalysis } from "@/lib/script-analysis";

import { HemingwayEditorCore } from "./hemingway-editor-core";
import AIActionCombobox, { type AIAction } from "./ai-action-combobox";
import { type WTATemplate } from "./wta-templates-data";
import { auth } from "@/lib/firebase";

interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

interface HemingwayEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
  elements?: ScriptElements; // New prop for structured elements
  onBlocksChange?: (blocks: PartialBlock[]) => void; // New prop for JSON blocks
}

interface AnalysisStats {
  total: number;
  hooks: number;
  bridges: number;
  goldenNuggets: number;
  wtas: number;
  words: number;
  characters: number;
  estimatedTime: string;
}

// Footer stats component
function EditorFooter({
  stats,
  showAnalysis,
  readabilityAnalysis,
  script,
  onScriptChange,
}: {
  stats: AnalysisStats;
  showAnalysis: boolean;
  readabilityAnalysis: ReadabilityAnalysis | null;
  script: string;
  onScriptChange: (value: string) => void;
}) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [currentVoice, setCurrentVoice] = useState("Professional");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const availableVoices = ["Professional", "Casual", "Expert", "Friendly", "Authoritative"];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const setupMediaRecorder = (stream: MediaStream) => {
    const options = { mimeType: "audio/webm" };
    mediaRecorderRef.current = new MediaRecorder(stream, options);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      // Process the audio
      await processAudioWithGemini(audioBlob);

      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop());
    };
  };

  const processAudioWithGemini = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            const base64 = reader.result.toString().split(",")[1];
            resolve(base64);
          } else {
            reject(new Error("Failed to read audio"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Get Firebase Auth token
      if (!auth?.currentUser) {
        throw new Error("Please sign in to use voice transcription");
      }

      const token = await auth.currentUser.getIdToken();

      // Send to Gemini transcription API
      const response = await fetch("/api/transcribe/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: "webm",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }

      const data = await response.json();

      if (data.success && data.transcription) {
        // Add transcribed text to content
        const transcribedText = data.transcription;
        onScriptChange(script + (script.trim() ? "\n\n" : "") + transcribedText);

        toast.success("Transcription completed successfully!");
      } else {
        throw new Error("No transcription received");
      }
    } catch (error) {
      console.error("Failed to process recording:", error);
      toast.error(error instanceof Error ? error.message : "Failed to transcribe audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      setupMediaRecorder(stream);

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.success("Recording started");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          toast.error("Microphone permission denied. Please check your browser settings.");
        } else if (error.name === "NotFoundError") {
          toast.error("No microphone found. Please connect a microphone and try again.");
        } else {
          toast.error("Failed to access microphone: " + error.message);
        }
      } else {
        toast.error("Failed to start recording");
      }

      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info("Processing recording...");
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleRewriteScript = async () => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Script rewritten!");
    } catch (error) {
      console.error("Failed to rewrite script:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRewriteWithVoice = async (voiceType: string) => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      setCurrentVoice(voiceType);
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`Script rewritten with ${voiceType} voice!`);
    } catch (error) {
      console.error("Failed to rewrite script:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleChangeVoice = (voiceType: string) => {
    setCurrentVoice(voiceType);
  };

  const handleAIAction = async (action: AIAction, customInstruction?: string, submenuOption?: any) => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      // TODO: Implement actual AI action functionality
      console.log("AI Action:", action.id, customInstruction || action.label, submenuOption?.label);

      switch (action.id) {
        case "edit-text":
          console.log("Editing text with AI...");
          // TODO: Open inline editor or AI refinement dialog
          break;
        case "edit-tone":
          console.log("Adjusting tone with AI...", submenuOption ? `to ${submenuOption.label}` : "");
          // TODO: Implement tone adjustment with AI using submenuOption
          break;
        case "remix":
          console.log("Remixing content with AI...");
          // TODO: Generate creative variations
          break;
        case "humanize":
          console.log("Humanizing text with AI...");
          // TODO: Make text more natural and conversational
          break;
        case "improve-hook":
          console.log("Improving hook with AI...");
          // TODO: Enhance opening with AI
          break;
        case "strengthen-cta":
          console.log("Strengthening CTA with AI...");
          // TODO: Enhance call-to-action
          break;
        case "save-template":
          console.log("Saving as template...");
          // TODO: Save current script as reusable template
          break;
        case "custom":
          console.log("Custom instruction:", customInstruction);
          // TODO: Execute custom AI instruction
          break;
        default:
          console.log("Unknown action:", action.id);
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`AI action "${action.label}" completed!`);
    } catch (error) {
      console.error("Failed to execute AI action:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleTemplateSelect = (template: WTATemplate) => {
    // Insert the template text at the end of the script
    const newScript = script + (script.trim() ? "\n\n" : "") + template.text;
    onScriptChange(newScript);

    // Show success notification
    toast.success(`WTA template "${template.text.substring(0, 50)}..." added to script`);
  };

  return (
    <div className="bg-background/95 text-muted-foreground border-border/30 sticky bottom-0 z-10 border-t text-sm backdrop-blur-sm">
      {/* Word count and stats */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>{stats.words} words</span>
          </div>
          <span>•</span>
          <span>{stats.characters} characters</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{stats.estimatedTime}</span>
          </div>
          {readabilityAnalysis && (
            <>
              <span>•</span>
              <Badge
                variant={
                  readabilityAnalysis.overall.level === "easy"
                    ? "default"
                    : readabilityAnalysis.overall.level === "medium"
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
                title={`Grade Level: ${readabilityAnalysis.overall.gradeLevel}`}
              >
                {readabilityAnalysis.overall.level.toUpperCase()} ({readabilityAnalysis.overall.score.toFixed(1)})
              </Badge>
              <span className="text-muted-foreground text-xs">{readabilityAnalysis.overall.gradeLevel}</span>
            </>
          )}
        </div>

        {/* AI Tools and Voice Selection */}
        <div className="flex items-center gap-2">
          {/* Recording Button */}
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleRecordingToggle}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Transcribing...
              </>
            ) : isRecording ? (
              <>
                <MicOff className="mr-1 h-3 w-3" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-1 h-3 w-3" />
                Record
              </>
            )}
          </Button>

          {/* Voice Selection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                <Mic className="mr-1 h-3 w-3" />
                {currentVoice}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableVoices.map((voice) => (
                <DropdownMenuItem
                  key={voice}
                  onClick={() => handleChangeVoice(voice)}
                  className={voice === currentVoice ? "bg-accent" : ""}
                >
                  <Mic className="mr-2 h-3 w-3" />
                  {voice}
                  {voice === currentVoice && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* NotionAI-style Action Combobox */}
          <AIActionCombobox
            onActionSelect={handleAIAction}
            onTemplateSelect={handleTemplateSelect}
            disabled={isRewriting}
          />
        </div>
      </div>
    </div>
  );
}

export function HemingwayEditor({
  value,
  onChange,
  placeholder = "Start writing your script...",
  className = "",
  minRows = 10,
  maxRows = 50,
  readOnly = false,
  autoFocus = false,
  elements,
  onBlocksChange,
}: HemingwayEditorProps) {
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>({
    hooks: true,
    bridges: true,
    goldenNuggets: true,
    wtas: true,
  });

  const [showAnalysis] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<ScriptAnalysis>({
    hooks: [],
    bridges: [],
    goldenNuggets: [],
    wtas: [],
  });

  // Readability analysis state
  const [readabilityService] = useState(() => new EnhancedReadabilityService(defaultReadabilitySettings));
  const [readabilityAnalysis, setReadabilityAnalysis] = useState<ReadabilityAnalysis | null>(null);

  // Analyze readability when value changes
  useEffect(() => {
    if (value.trim()) {
      try {
        const analysis = readabilityService.analyzeText(value);
        setReadabilityAnalysis(analysis);
      } catch (error) {
        console.error("Readability analysis failed:", error);
        setReadabilityAnalysis(null);
      }
    } else {
      setReadabilityAnalysis(null);
    }
  }, [value, readabilityService]);

  // Calculate estimated reading/speaking time based on word count
  const calculateEstimatedTime = (words: number): string => {
    if (words === 0) return "0s";

    // Average speaking rate: 150-180 words per minute for content creation
    // Using 160 wpm as a good middle ground for social media scripts
    const wordsPerMinute = 160;
    const totalSeconds = Math.round((words / wordsPerMinute) * 60);

    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  // Get analysis stats from current analysis
  const getAnalysisStats = (): AnalysisStats => {
    const hooks = currentAnalysis.hooks.length;
    const bridges = currentAnalysis.bridges.length;
    const goldenNuggets = currentAnalysis.goldenNuggets.length;
    const wtas = currentAnalysis.wtas.length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;

    return {
      total: hooks + bridges + goldenNuggets + wtas,
      hooks,
      bridges,
      goldenNuggets,
      wtas,
      words,
      characters: value.length,
      estimatedTime: calculateEstimatedTime(words),
    };
  };

  const stats = getAnalysisStats();

  return (
    <div className="app-shell">
      {/* Main Content Area */}
      <div className="main-content flex h-full flex-col">
        {/* Editor */}
        <div className="flex-1">
          <HemingwayEditorCore
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            minRows={minRows}
            maxRows={maxRows}
            readOnly={readOnly}
            autoFocus={autoFocus}
            highlightConfig={highlightConfig}
            elements={elements}
            onAnalysisChange={setCurrentAnalysis}
            onBlocksChange={onBlocksChange}
          />
        </div>

        {/* Footer */}
        <EditorFooter
          stats={stats}
          showAnalysis={showAnalysis}
          readabilityAnalysis={readabilityAnalysis}
          script={value}
          onScriptChange={onChange}
        />
      </div>

      {/* Right Sidebar - Statistics & Analysis */}
      <div className="right-sidebar bg-background/50 border-border/50 overflow-y-auto border-l backdrop-blur-sm">
        <div className="space-y-[var(--space-2)] p-[var(--space-3)]">
          {/* Statistics */}
          <Card>
            <CardHeader className="pb-[var(--space-2)]">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-[var(--space-2)]">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Words</span>
                <span className="text-sm font-medium">{stats.words}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Sentences</span>
                <span className="text-sm font-medium">
                  {value.split(/[.!?]+/).filter((s) => s.trim().length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Characters</span>
                <span className="text-sm font-medium">{stats.characters}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  Estimated Time
                </span>
                <span className="text-sm font-medium">{stats.estimatedTime}</span>
              </div>
            </CardContent>
          </Card>

          {/* Readability Analysis */}
          {readabilityAnalysis && (
            <Card>
              <CardHeader className="pb-[var(--space-2)]">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Readability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-[var(--space-2)]">
                <div className="text-center">
                  <div className="text-2xl font-bold">{readabilityAnalysis.overall.score.toFixed(1)}</div>
                  <div className="text-muted-foreground text-sm">{readabilityAnalysis.overall.level.toUpperCase()}</div>
                  <div className="text-muted-foreground mt-1 text-xs">{readabilityAnalysis.overall.gradeLevel}</div>
                </div>

                <Separator />

                <div className="space-y-[var(--space-1)]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Avg Words/Sentence</span>
                    <span className="text-sm font-medium">
                      {readabilityAnalysis.statistics.averageWordsPerSentence.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Complex Words</span>
                    <span className="text-sm font-medium">{readabilityAnalysis.statistics.complexWords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Passive Voice</span>
                    <span className="text-sm font-medium">{readabilityAnalysis.statistics.passiveVoiceCount}</span>
                  </div>
                </div>

                {readabilityAnalysis.overall.suggestions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-[var(--space-1)]">
                      <h4 className="flex items-center gap-1 text-sm font-medium">
                        <Lightbulb className="h-3 w-3" />
                        Suggestions
                      </h4>
                      <div className="space-y-[var(--space-1)]">
                        {readabilityAnalysis.overall.suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="text-muted-foreground text-xs">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
