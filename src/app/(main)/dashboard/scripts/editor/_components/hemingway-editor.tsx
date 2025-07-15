"use client";

import { useState, useEffect } from "react";

import { BarChart3, Clock, FileText, Target, Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type HighlightConfig, type ScriptAnalysis } from "@/lib/script-analysis";

import { HemingwayEditorCore } from "./hemingway-editor-core";
import { PartialBlock } from "@blocknote/core";
import { EnhancedReadabilityService, defaultReadabilitySettings, type ReadabilityAnalysis } from "@/lib/enhanced-readability-service";

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
}: {
  stats: AnalysisStats;
  showAnalysis: boolean;
  readabilityAnalysis: ReadabilityAnalysis | null;
}) {
  return (
    <div className="bg-background/50 text-muted-foreground border-border/30 border-t text-sm">
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
              <span className="text-xs text-muted-foreground">{readabilityAnalysis.overall.gradeLevel}</span>
            </>
          )}
        </div>

        {showAnalysis && stats.total > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-border/50 text-xs">
              {stats.hooks} hooks
            </Badge>
            <Badge variant="outline" className="border-border/50 text-xs">
              {stats.bridges} bridges
            </Badge>
            <Badge variant="outline" className="border-border/50 text-xs">
              {stats.goldenNuggets} nuggets
            </Badge>
            <Badge variant="outline" className="border-border/50 text-xs">
              {stats.wtas} CTAs
            </Badge>
          </div>
        )}
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
                  <div className="text-xs text-muted-foreground mt-1">{readabilityAnalysis.overall.gradeLevel}</div>
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
