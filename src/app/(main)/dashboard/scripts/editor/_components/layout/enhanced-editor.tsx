"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

import {
  FileText,
  BarChart3,
  Lightbulb,
  Target,
} from "lucide-react";

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
  optimizeCTA
} from "@/lib/script-element-actions";


import { ContextualMenu } from "./contextual-menu";
import { HighlightOverlay } from "./highlight-overlay";

interface EnhancedEditorProps {
  initialText?: string;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
}

// CustomTextarea component with unique data attribute
function CustomTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea data-custom-textarea {...props} />;
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
      case 'hook':
        const hookResult = await enhanceHook(elementText);
        return hookResult.success ? hookResult.result : null;
      case 'bridge':
        const bridgeResult = await strengthenBridge(elementText);
        return bridgeResult.success ? bridgeResult.result : null;
      case 'golden-nugget':
        const nuggetResult = await amplifyGoldenNugget(elementText);
        return nuggetResult.success ? nuggetResult.result : null;
      case 'cta':
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
        <div className="flex-1 p-6">
          <Card className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[12px] shadow-sm p-6">
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
            <CardContent className="h-full pb-6 bg-white p-6">
              <div className="relative h-full">
                <CustomTextarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Start writing your script here..."
                  className="h-full resize-none text-base leading-relaxed focus:outline-none w-full border-0"
                  style={{ border: 'none' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar - Statistics & Analysis */}
      <div className="right-sidebar bg-background/50 border-border/50 overflow-y-auto border-l backdrop-blur-sm">
        <div className="space-y-4 p-4">
          {/* Readability Analysis (now on top) */}
          <div
            className="relative flex flex-col rounded-xl min-w-[225px] p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
          >
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              Readability
            </h3>
            {readabilityAnalysis ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{readabilityAnalysis.overall.score.toFixed(1)}</div>
                  <div className="text-muted-foreground text-sm">{readabilityAnalysis.overall.level.toUpperCase()}</div>
                </div>
                <Separator />
                <div className="space-y-2">
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
                    <div className="space-y-2">
                      <h4 className="flex items-center gap-1 text-sm font-medium">
                        <Lightbulb className="h-3 w-3" />
                        Suggestions
                      </h4>
                      <div className="space-y-1">
                        {readabilityAnalysis.overall.suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="text-muted-foreground text-xs">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm text-center py-8">No readability data available.</div>
            )}
          </div>
          {/* Statistics */}
          <div
            className="relative flex flex-col rounded-xl min-w-[225px] p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md"
          >
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </h3>
            <div className="space-y-3">
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
            </div>
          </div>
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
