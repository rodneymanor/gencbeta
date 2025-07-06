"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";

import {
  FileText,
  BarChart3,
  Lightbulb,
  Target,
  Settings,
  Sliders,
  Palette,
  Save,
  Download,
  Upload,
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
import {
  HemingwayEditorSettings,
  saveEditorSettings,
  loadEditorSettings,
  exportEditorSettings,
  importEditorSettings,
  resetEditorSettings,
  createSettingsBackup,
  getSettingsStorageInfo,
} from "@/lib/settings-manager";

import {
  AdvancedHighlightControls,
  AdvancedHighlightSettings,
  defaultAdvancedSettings,
} from "./advanced-highlight-controls";
import { ContextualMenu } from "./contextual-menu";
import { HighlightOverlay } from "./highlight-overlay";
import { SettingsPanel, EditorSettings, defaultSettings } from "./settings-panel";
import { UIPreferencesPanel, UIPreferences, defaultUIPreferences } from "./ui-preferences-panel";

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
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [highlightSettings, setHighlightSettings] = useState<AdvancedHighlightSettings>(defaultAdvancedSettings);
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(defaultUIPreferences);
  const [readabilitySettings, setReadabilitySettings] = useState<ReadabilitySettings>(defaultReadabilitySettings);
  const [elementDetectionSettings, setElementDetectionSettings] = useState<ElementDetectionSettings>(
    defaultElementDetectionSettings,
  );

  // Panel visibility state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [advancedControlsOpen, setAdvancedControlsOpen] = useState(false);
  const [uiPreferencesOpen, setUIPreferencesOpen] = useState(false);

  // Services
  const [readabilityService] = useState(() => new EnhancedReadabilityService(readabilitySettings));
  const [elementDetectionService] = useState(() => new EnhancedElementDetection(elementDetectionSettings));

  // Load settings on mount
  useEffect(() => {
    const savedSettings = loadEditorSettings();
    if (savedSettings) {
      setEditorSettings(savedSettings.editor);
      setHighlightSettings(savedSettings.highlights);
      setUIPreferences(savedSettings.ui);
      setReadabilitySettings(savedSettings.readability);
      setElementDetectionSettings(savedSettings.elementDetection);
    }
  }, []);

  const saveCurrentSettings = useCallback(() => {
    const settings: HemingwayEditorSettings = {
      version: "1.0.0",
      lastModified: new Date().toISOString(),
      editor: editorSettings,
      highlights: highlightSettings,
      ui: uiPreferences,
      readability: readabilitySettings,
      elementDetection: elementDetectionSettings,
      metadata: {
        exportedBy: "Hemingway Script Editor",
        exportedAt: new Date().toISOString(),
        deviceInfo: "Browser",
        browserInfo: navigator.userAgent.substring(0, 50),
      },
    };

    saveEditorSettings(settings);
  }, [editorSettings, highlightSettings, uiPreferences, readabilitySettings, elementDetectionSettings]);

  // Update services when settings change
  useEffect(() => {
    readabilityService.updateSettings(readabilitySettings);
  }, [readabilitySettings, readabilityService]);

  useEffect(() => {
    elementDetectionService.updateSettings(elementDetectionSettings);
  }, [elementDetectionSettings, elementDetectionService]);

  // Auto-save settings
  useEffect(() => {
    if (editorSettings.advanced.autoSave) {
      const interval = setInterval(() => {
        saveCurrentSettings();
      }, editorSettings.advanced.saveInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [editorSettings.advanced.autoSave, editorSettings.advanced.saveInterval, saveCurrentSettings]);

  const handleExportSettings = useCallback(() => {
    const settings: HemingwayEditorSettings = {
      version: "1.0.0",
      lastModified: new Date().toISOString(),
      editor: editorSettings,
      highlights: highlightSettings,
      ui: uiPreferences,
      readability: readabilitySettings,
      elementDetection: elementDetectionSettings,
      metadata: {
        exportedBy: "Hemingway Script Editor",
        exportedAt: new Date().toISOString(),
        deviceInfo: "Browser",
        browserInfo: navigator.userAgent.substring(0, 50),
      },
    };

    exportEditorSettings(settings);
  }, [editorSettings, highlightSettings, uiPreferences, readabilitySettings, elementDetectionSettings]);

  const handleImportSettings = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedSettings = await importEditorSettings(file);
      setEditorSettings(importedSettings.editor);
      setHighlightSettings(importedSettings.highlights);
      setUIPreferences(importedSettings.ui);
      setReadabilitySettings(importedSettings.readability);
      setElementDetectionSettings(importedSettings.elementDetection);
    } catch (error) {
      console.error("Failed to import settings:", error);
    }
  }, []);

  const handleResetSettings = useCallback(() => {
    createSettingsBackup();
    resetEditorSettings();
    setEditorSettings(defaultSettings);
    setHighlightSettings(defaultAdvancedSettings);
    setUIPreferences(defaultUIPreferences);
    setReadabilitySettings(defaultReadabilitySettings);
    setElementDetectionSettings(defaultElementDetectionSettings);
  }, []);

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
    saveCurrentSettings();
  }, [text, onSave, saveCurrentSettings]);

  // Apply UI preferences as CSS variables
  const editorStyles = useMemo(
    () =>
      ({
        "--editor-font-family": uiPreferences.typography.fontFamily,
        "--editor-font-size": `${uiPreferences.typography.fontSize}px`,
        "--editor-line-height": uiPreferences.typography.lineHeight,
        "--editor-letter-spacing": `${uiPreferences.typography.letterSpacing}px`,
        "--editor-font-weight": uiPreferences.typography.fontWeight,
        "--editor-text-align": uiPreferences.typography.textAlign,
        "--editor-max-width": `${uiPreferences.layout.maxWidth}px`,
        "--editor-padding": `${uiPreferences.layout.padding}px`,
        "--editor-margin": `${uiPreferences.layout.margin}px`,
        "--editor-border-radius": `${uiPreferences.theme.borderRadius}px`,
        "--editor-border-width": `${uiPreferences.theme.borderWidth}px`,
        "--editor-primary-color": uiPreferences.theme.primaryColor,
        "--editor-accent-color": uiPreferences.theme.accentColor,
      }) as React.CSSProperties,
    [uiPreferences],
  );

  return (
    <div className="app-shell" style={editorStyles}>
      {/* Left Sidebar - Tools & Navigation */}
      <div className="left-sidebar bg-background/50 border-border/50 border-r backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 p-4">
          {/* Editor Title */}
          <div className="flex flex-col items-center gap-2">
            <FileText className="text-primary h-6 w-6" />
            <h2 className="text-center text-xs font-medium">Hemingway Editor</h2>
          </div>

          <Separator orientation="horizontal" className="w-full" />

          {/* Quick Actions */}
          <div className="flex w-full flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdvancedControlsOpen(!advancedControlsOpen)}
              className="h-10 w-10 p-0"
              title="Highlight Controls"
            >
              <Sliders className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUIPreferencesOpen(!uiPreferencesOpen)}
              className="h-10 w-10 p-0"
              title="UI Preferences"
            >
              <Palette className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
              className="h-10 w-10 p-0"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="horizontal" className="w-full" />

          {/* Save Actions */}
          <div className="flex w-full flex-col gap-2">
            <Button variant="ghost" size="sm" onClick={handleSave} className="h-10 w-10 p-0" title="Save">
              <Save className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportSettings}
              className="h-10 w-10 p-0"
              title="Export Settings"
            >
              <Download className="h-4 w-4" />
            </Button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" title="Import Settings">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content flex h-full flex-col">
        {/* Settings Panels */}
        {(settingsPanelOpen || advancedControlsOpen || uiPreferencesOpen) && (
          <div className="border-border/50 border-b p-6">
            <div className="grid gap-4">
              {settingsPanelOpen && (
                <SettingsPanel
                  settings={editorSettings}
                  onSettingsChange={setEditorSettings}
                  isOpen={settingsPanelOpen}
                  onToggle={() => setSettingsPanelOpen(!settingsPanelOpen)}
                />
              )}

              {advancedControlsOpen && (
                <AdvancedHighlightControls
                  settings={highlightSettings}
                  onSettingsChange={setHighlightSettings}
                  scriptStats={scriptStats}
                />
              )}

              {uiPreferencesOpen && (
                <UIPreferencesPanel preferences={uiPreferences} onPreferencesChange={setUIPreferences} />
              )}
            </div>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 p-6">
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
            <CardContent className="h-full pb-6">
              <div className="relative h-full">
                <Textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Start writing your script here..."
                  className="h-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed focus:ring-0 focus:outline-none"
                  style={{
                    fontFamily: `var(--editor-font-family)`,
                    fontSize: `var(--editor-font-size)`,
                    lineHeight: `var(--editor-line-height)`,
                    letterSpacing: `var(--editor-letter-spacing)`,
                    fontWeight: `var(--editor-font-weight)`,
                    textAlign: `var(--editor-text-align)` as any,
                  }}
                />

                {text && (
                  <HighlightOverlay
                    text={text}
                    readabilityAnalysis={readabilityAnalysis}
                    detectedElements={detectedElements}
                    highlightSettings={highlightSettings}
                    onElementClick={handleElementClick}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Sidebar - Statistics & Analysis */}
      <div className="right-sidebar bg-background/50 border-border/50 overflow-y-auto border-l backdrop-blur-sm">
        <div className="space-y-4 p-4">
          {/* Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
            </CardContent>
          </Card>

          {/* Readability Analysis */}
          {readabilityAnalysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" />
                  Readability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          )}

          {/* Storage Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Settings Size</span>
                  <span>{(getSettingsStorageInfo().used / 1024).toFixed(1)} KB</span>
                </div>
                <div className="bg-muted h-2 w-full rounded-full">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getSettingsStorageInfo().percentage, 100)}%` }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleResetSettings} className="w-full text-xs">
                  Reset All Settings
                </Button>
              </div>
            </CardContent>
          </Card>
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
