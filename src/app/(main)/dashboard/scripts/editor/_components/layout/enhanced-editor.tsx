"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Upload
} from 'lucide-react';

import { ContextualMenu } from './contextual-menu';
import { HighlightOverlay } from './highlight-overlay';
import { SettingsPanel, EditorSettings, defaultSettings } from './settings-panel';
import { AdvancedHighlightControls, AdvancedHighlightSettings, defaultAdvancedSettings } from './advanced-highlight-controls';
import { UIPreferencesPanel, UIPreferences, defaultUIPreferences } from './ui-preferences-panel';

import { analyzeReadability, ReadabilityAnalysis } from '@/lib/readability-highlighting';
import { analyzeElement, enhanceElement, generateAlternatives } from '@/lib/script-element-actions';
import { EnhancedReadabilityService, ReadabilitySettings, defaultReadabilitySettings } from '@/lib/enhanced-readability-service';
import { EnhancedElementDetection, ElementDetectionSettings, defaultElementDetectionSettings } from '@/lib/enhanced-element-detection';
import { 
  HemingwayEditorSettings,
  saveEditorSettings,
  loadEditorSettings,
  exportEditorSettings,
  importEditorSettings,
  resetEditorSettings,
  createSettingsBackup,
  getSettingsStorageInfo
} from '@/lib/settings-manager';

interface EnhancedEditorProps {
  initialText?: string;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
}

export function EnhancedEditor({ initialText = '', onTextChange, onSave }: EnhancedEditorProps) {
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
  const [elementDetectionSettings, setElementDetectionSettings] = useState<ElementDetectionSettings>(defaultElementDetectionSettings);
  
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
  }, [editorSettings.advanced.autoSave, editorSettings.advanced.saveInterval]);

  const saveCurrentSettings = useCallback(() => {
    const settings: HemingwayEditorSettings = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      editor: editorSettings,
      highlights: highlightSettings,
      ui: uiPreferences,
      readability: readabilitySettings,
      elementDetection: elementDetectionSettings,
      metadata: {
        exportedBy: 'Hemingway Script Editor',
        exportedAt: new Date().toISOString(),
        deviceInfo: 'Browser',
        browserInfo: navigator.userAgent.substring(0, 50),
      },
    };

    saveEditorSettings(settings);
  }, [editorSettings, highlightSettings, uiPreferences, readabilitySettings, elementDetectionSettings]);

  const handleExportSettings = useCallback(() => {
    const settings: HemingwayEditorSettings = {
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      editor: editorSettings,
      highlights: highlightSettings,
      ui: uiPreferences,
      readability: readabilitySettings,
      elementDetection: elementDetectionSettings,
      metadata: {
        exportedBy: 'Hemingway Script Editor',
        exportedAt: new Date().toISOString(),
        deviceInfo: 'Browser',
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
      console.error('Failed to import settings:', error);
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

    detectedElements.forEach(element => {
      switch (element.type) {
        case 'hook':
          stats.hooks++;
          break;
        case 'bridge':
          stats.bridges++;
          break;
        case 'goldenNugget':
          stats.goldenNuggets++;
          break;
        case 'cta':
          stats.ctas++;
          break;
      }
    });

    return stats;
  }, [detectedElements]);

  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
  }, [onTextChange]);

  const handleElementClick = useCallback((element: any, position: { x: number; y: number }) => {
    setSelectedElement(element);
    setContextMenuPosition(position);
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setSelectedElement(null);
    setContextMenuPosition(null);
  }, []);

  const handleEnhanceElement = useCallback(async (element: any) => {
    if (!element) return;
    
    try {
      const enhanced = await enhanceElement(element.type, element.text);
      if (enhanced) {
        const newText = text.substring(0, element.startIndex) + 
                       enhanced + 
                       text.substring(element.endIndex);
        handleTextChange(newText);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
    }
    
    handleContextMenuClose();
  }, [text, handleTextChange, handleContextMenuClose]);

  const handleAnalyzeElement = useCallback((element: any) => {
    if (!element) return;
    
    const analysis = analyzeElement(element.type, element.text);
    console.log('Element Analysis:', analysis);
    
    handleContextMenuClose();
  }, [handleContextMenuClose]);

  const handleGenerateAlternatives = useCallback((element: any) => {
    if (!element) return;
    
    const alternatives = generateAlternatives(element.type, element.text);
    console.log('Generated Alternatives:', alternatives);
    
    handleContextMenuClose();
  }, [handleContextMenuClose]);

  const handleSave = useCallback(() => {
    onSave?.(text);
    saveCurrentSettings();
  }, [text, onSave, saveCurrentSettings]);

  // Apply UI preferences as CSS variables
  const editorStyles = useMemo(() => ({
    '--editor-font-family': uiPreferences.typography.fontFamily,
    '--editor-font-size': `${uiPreferences.typography.fontSize}px`,
    '--editor-line-height': uiPreferences.typography.lineHeight,
    '--editor-letter-spacing': `${uiPreferences.typography.letterSpacing}px`,
    '--editor-font-weight': uiPreferences.typography.fontWeight,
    '--editor-text-align': uiPreferences.typography.textAlign,
    '--editor-max-width': `${uiPreferences.layout.maxWidth}px`,
    '--editor-padding': `${uiPreferences.layout.padding}px`,
    '--editor-margin': `${uiPreferences.layout.margin}px`,
    '--editor-border-radius': `${uiPreferences.theme.borderRadius}px`,
    '--editor-border-width': `${uiPreferences.theme.borderWidth}px`,
    '--editor-primary-color': uiPreferences.theme.primaryColor,
    '--editor-accent-color': uiPreferences.theme.accentColor,
  } as React.CSSProperties), [uiPreferences]);

  return (
    <div className="space-y-6" style={editorStyles}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Hemingway Script Editor</h2>
          <Badge variant="secondary">Phase 4</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAdvancedControlsOpen(!advancedControlsOpen)}
          >
            <Sliders className="h-4 w-4 mr-1" />
            Controls
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUIPreferencesOpen(!uiPreferencesOpen)}
          >
            <Palette className="h-4 w-4 mr-1" />
            UI
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSettings}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Settings Panels */}
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
          <UIPreferencesPanel
            preferences={uiPreferences}
            onPreferencesChange={setUIPreferences}
          />
        )}
      </div>

      {/* Main Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor Column */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Script Editor
                {readabilityAnalysis && (
                  <Badge 
                    variant={readabilityAnalysis.overall.level === 'easy' ? 'default' : 
                            readabilityAnalysis.overall.level === 'medium' ? 'secondary' : 'destructive'}
                  >
                    {readabilityAnalysis.overall.description}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Start writing your script here..."
                  className="min-h-[400px] resize-none"
                  style={{
                    fontFamily: `var(--editor-font-family)`,
                    fontSize: `var(--editor-font-size)`,
                    lineHeight: `var(--editor-line-height)`,
                    letterSpacing: `var(--editor-letter-spacing)`,
                    fontWeight: `var(--editor-font-weight)`,
                    textAlign: `var(--editor-text-align)` as any,
                    maxWidth: `var(--editor-max-width)`,
                    padding: `var(--editor-padding)`,
                    margin: `var(--editor-margin)`,
                    borderRadius: `var(--editor-border-radius)`,
                    borderWidth: `var(--editor-border-width)`,
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Words</span>
                <span className="text-sm font-medium">
                  {text.split(/\s+/).filter(word => word.length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sentences</span>
                <span className="text-sm font-medium">
                  {text.split(/[.!?]+/).filter(s => s.trim().length > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Characters</span>
                <span className="text-sm font-medium">{text.length}</span>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hooks</span>
                  <Badge variant="outline">{scriptStats.hooks}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bridges</span>
                  <Badge variant="outline">{scriptStats.bridges}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Golden Nuggets</span>
                  <Badge variant="outline">{scriptStats.goldenNuggets}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">CTAs</span>
                  <Badge variant="outline">{scriptStats.ctas}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Readability Analysis */}
          {readabilityAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Readability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {readabilityAnalysis.overall.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {readabilityAnalysis.overall.level.toUpperCase()}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Words/Sentence</span>
                    <span className="text-sm font-medium">
                      {readabilityAnalysis.statistics.averageWordsPerSentence.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Complex Words</span>
                    <span className="text-sm font-medium">
                      {readabilityAnalysis.statistics.complexWords}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Passive Voice</span>
                    <span className="text-sm font-medium">
                      {readabilityAnalysis.statistics.passiveVoiceCount}
                    </span>
                  </div>
                </div>
                
                {readabilityAnalysis.overall.suggestions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Suggestions
                      </h4>
                      <div className="space-y-1">
                        {readabilityAnalysis.overall.suggestions.slice(0, 3).map((suggestion, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
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
            <CardHeader>
              <CardTitle className="text-sm">Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Settings Size</span>
                  <span>{(getSettingsStorageInfo().used / 1024).toFixed(1)} KB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(getSettingsStorageInfo().percentage, 100)}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetSettings}
                  className="w-full text-xs"
                >
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
