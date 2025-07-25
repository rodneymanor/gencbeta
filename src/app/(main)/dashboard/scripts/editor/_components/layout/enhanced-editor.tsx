"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

import { FileText, BarChart3, Lightbulb, Target, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  EnhancedElementDetection,
  ElementDetectionSettings,
  defaultElementDetectionSettings,
} from "@/lib/enhanced-element-detection";
import {
  EnhancedReadabilityService,
  ReadabilitySettings,
  defaultReadabilitySettings,
} from "@/lib/enhanced-readability-service";
import {
  analyzeElement,
  generateAlternatives,
  enhanceHook,
  strengthenBridge,
  amplifyGoldenNugget,
  optimizeCTA,
} from "@/lib/script-element-actions";

import { ContextualMenu } from "./contextual-menu";
import { HighlightOverlay } from "./highlight-overlay";

interface EnhancedEditorProps {
  initialText?: string;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
}

export function EnhancedEditor({ initialText = "", onTextChange, onSave }: EnhancedEditorProps) {
  const [text, setText] = useState(initialText);
  const [selectedElement, setSelectedElement] = useState<{
    type: string;
    text: string;
    startIndex: number;
    endIndex: number;
  } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Settings state
  const [readabilitySettings, setReadabilitySettings] = useState<ReadabilitySettings>(defaultReadabilitySettings);
  const [elementDetectionSettings, setElementDetectionSettings] = useState<ElementDetectionSettings>(
    defaultElementDetectionSettings,
  );

  // Services
  const [readabilityService] = useState(() => new EnhancedReadabilityService(readabilitySettings));
  const [elementDetectionService] = useState(() => new EnhancedElementDetection(elementDetectionSettings));

  // Update services when settings change
  useEffect(() => {
    readabilityService.updateSettings(readabilitySettings);
  }, [readabilitySettings, readabilityService]);

  useEffect(() => {
    elementDetectionService.updateSettings(elementDetectionSettings);
  }, [elementDetectionSettings, elementDetectionService]);

  const readabilityAnalysis = useMemo(() => {
    if (!text.trim() || !readabilitySettings.enabled) return null;
    return readabilityService.analyzeText(text);
  }, [text, readabilitySettings.enabled, readabilityService]);

  const detectedElements = useMemo(() => {
    if (!text.trim()) return [];
    return elementDetectionService.detectElements(text);
  }, [text, elementDetectionService]);

  const scriptStats = useMemo(() => {
    const stats = {
      hooks: 0,
      bridges: 0,
      goldenNuggets: 0,
      ctas: 0,
    };

    detectedElements.forEach((element) => {
      switch (element.type) {
        case "hook":
          stats.hooks++;
          break;
        case "bridge":
          stats.bridges++;
          break;
        case "goldenNugget":
          stats.goldenNuggets++;
          break;
        case "cta":
          stats.ctas++;
          break;
      }
    });

    return stats;
  }, [detectedElements]);

  // Calculate estimated speaking time
  const estimatedTime = useMemo(() => {
    const words = text.split(/\s+/).filter((word) => word.length > 0).length;
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
  }, [text]);

  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      onTextChange?.(newText);
    },
    [onTextChange],
  );

  const handleElementClick = useCallback((element: any, position: { x: number; y: number }) => {
    setSelectedElement(element);
    setContextMenuPosition(position);
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setSelectedElement(null);
    setContextMenuPosition(null);
  }, []);

  const enhanceElement = useCallback(async (elementType: string, elementText: string) => {
    switch (elementType) {
      case "hook":
        const hookResult = await enhanceHook(elementText);
        return hookResult.success ? hookResult.result : null;
      case "bridge":
        const bridgeResult = await strengthenBridge(elementText);
        return bridgeResult.success ? bridgeResult.result : null;
      case "golden-nugget":
        const nuggetResult = await amplifyGoldenNugget(elementText);
        return nuggetResult.success ? nuggetResult.result : null;
      case "cta":
        const ctaResult = await optimizeCTA(elementText);
        return ctaResult.success ? ctaResult.result : null;
      default:
        return null;
    }
  }, []);

  const handleEnhanceElement = useCallback(
    async (element: any) => {
      if (!element) return;

      try {
        const enhanced = await enhanceElement(element.type, element.text);
        if (enhanced) {
          const newText = text.substring(0, element.startIndex) + enhanced + text.substring(element.endIndex);
          handleTextChange(newText);
        }
      } catch (error) {
        console.error("Enhancement failed:", error);
      }

      handleContextMenuClose();
    },
    [text, handleTextChange, handleContextMenuClose, enhanceElement],
  );

  const handleAnalyzeElement = useCallback(
    (element: any) => {
      if (!element) return;

      const analysis = analyzeElement(element.type, element.text);
      console.log("Element Analysis:", analysis);

      handleContextMenuClose();
    },
    [handleContextMenuClose],
  );

  const handleGenerateAlternatives = useCallback(
    (element: any) => {
      if (!element) return;

      const alternatives = generateAlternatives(element.type, element.text);
      console.log("Generated Alternatives:", alternatives);

      handleContextMenuClose();
    },
    [handleContextMenuClose],
  );

  const handleSave = useCallback(() => {
    onSave?.(text);
  }, [text, onSave]);

  return (
    <div className="app-shell">
      {/* Main Content Area */}
      <div className="main-content flex h-full flex-col">
        {/* Editor */}
        <div className="flex-1 p-[var(--space-3)]">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Script Editor
                {readabilityAnalysis && (
                  <Badge
                    variant={
                      readabilityAnalysis.overall.level === "easy"
                        ? "default"
                        : readabilityAnalysis.overall.level === "medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {readabilityAnalysis.overall.description}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full pb-[var(--space-3)]">
              <div className="relative h-full">
                <Textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Start writing your script here..."
                  className="h-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed focus:ring-0 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>
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
                <span className="text-sm font-medium">
                  {text.split(/\s+/).filter((word) => word.length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Sentences</span>
                <span className="text-sm font-medium">
                  {text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Characters</span>
                <span className="text-sm font-medium">{text.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  Estimated Time
                </span>
                <span className="text-sm font-medium">{estimatedTime}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Hooks</span>
                  <Badge variant="outline">{scriptStats.hooks}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Bridges</span>
                  <Badge variant="outline">{scriptStats.bridges}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Golden Nuggets</span>
                  <Badge variant="outline">{scriptStats.goldenNuggets}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">CTAs</span>
                  <Badge variant="outline">{scriptStats.ctas}</Badge>
                </div>
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

      {/* Contextual Menu */}
      {selectedElement && contextMenuPosition && (
        <ContextualMenu
          element={selectedElement}
          position={contextMenuPosition}
          onClose={handleContextMenuClose}
          onEnhance={handleEnhanceElement}
          onAnalyze={handleAnalyzeElement}
          onGenerateAlternatives={handleGenerateAlternatives}
        />
      )}
    </div>
  );
}
