"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  BarChart3,
  Eye,
  Palette,
  Maximize,
  Download,
  Upload
} from 'lucide-react';

import { MinimalEditorToolbar } from '@/components/ui/minimal-editor-toolbar';
import { ProgressivePanel } from '@/components/ui/progressive-panel';
import { FocusModeEditor } from '@/components/ui/minimal-text-editor';
import { MinimalCard, MinimalCardContent } from '@/components/ui/minimal-card';

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

interface MinimalEnhancedEditorProps {
  initialText?: string;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
}

export function MinimalEnhancedEditor({ initialText = '', onTextChange, onSave }: MinimalEnhancedEditorProps) {
  const [text, setText] = useState(initialText);
  
  // Settings state
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultSettings);
  const [highlightSettings, setHighlightSettings] = useState<AdvancedHighlightSettings>(defaultAdvancedSettings);
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(defaultUIPreferences);
  const [readabilitySettings, setReadabilitySettings] = useState<ReadabilitySettings>(defaultReadabilitySettings);
  const [elementDetectionSettings, setElementDetectionSettings] = useState<ElementDetectionSettings>(defaultElementDetectionSettings);
  
  // Panel visibility state
  const [readabilityPanelOpen, setReadabilityPanelOpen] = useState(false);
  const [highlightsPanelOpen, setHighlightsPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // Services
  const [readabilityService] = useState(() => new EnhancedReadabilityService(readabilitySettings));
  const [elementDetectionService] = useState(() => new EnhancedElementDetection(elementDetectionSettings));

  // Save current settings to localStorage
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
      },
    };
    
    saveEditorSettings(settings);
  }, [editorSettings, highlightSettings, uiPreferences, readabilitySettings, elementDetectionSettings]);

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

  // Update text when initialText prop changes
  useEffect(() => {
    if (initialText !== text) {
      setText(initialText);
    }
  }, [initialText, text]);

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

  // Analyze text for readability and elements
  const readabilityAnalysis = useMemo(() => {
    if (!text.trim()) return null;
    return readabilityService.analyzeText(text);
  }, [text, readabilityService]);

  const detectedElements = useMemo(() => {
    if (!text.trim()) return [];
    return elementDetectionService.detectElements(text);
  }, [text, elementDetectionService]);

  const scriptStats = useMemo(() => {
    const words = text.trim().split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    
    return {
      wordCount: words,
      sentenceCount: sentences,
      readingTime: Math.ceil(words / 200),
      detectedElements: {
        hooks: detectedElements.filter(e => e.type === 'hook').length,
        bridges: detectedElements.filter(e => e.type === 'bridge').length,
        goldenNuggets: detectedElements.filter(e => e.type === 'golden-nugget').length,
        ctas: detectedElements.filter(e => e.type === 'cta').length,
      }
    };
  }, [text, detectedElements]);

  // Event handlers
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);
    onTextChange?.(newText);
  }, [onTextChange]);

  const handleSave = useCallback(() => {
    onSave?.(text);
    saveCurrentSettings();
  }, [text, onSave, saveCurrentSettings]);

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
      },
    };
    
    exportEditorSettings(settings);
  }, [editorSettings, highlightSettings, uiPreferences, readabilitySettings, elementDetectionSettings]);

  const handleImportSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const imported = importEditorSettings(result);
        
        if (imported) {
          setEditorSettings(imported.editor);
          setHighlightSettings(imported.highlights);
          setUIPreferences(imported.ui);
          setReadabilitySettings(imported.readability);
          setElementDetectionSettings(imported.elementDetection);
        }
      } catch (error) {
        console.error('Failed to import settings:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  }, []);

  const handleResetSettings = useCallback(() => {
    resetEditorSettings();
    setEditorSettings(defaultSettings);
    setHighlightSettings(defaultAdvancedSettings);
    setUIPreferences(defaultUIPreferences);
    setReadabilitySettings(defaultReadabilitySettings);
    setElementDetectionSettings(defaultElementDetectionSettings);
  }, []);

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
  } as React.CSSProperties), [uiPreferences]);

  return (
    <div className="min-h-screen bg-background" style={editorStyles}>
      {/* Toolbar */}
      <MinimalEditorToolbar
        title="Script Editor"
        status="editing"
        readabilityLevel={readabilityAnalysis?.overall.level}
        onSave={handleSave}
        onToggleReadability={() => setReadabilityPanelOpen(true)}
        onToggleHighlights={() => setHighlightsPanelOpen(true)}
        onToggleSettings={() => setSettingsPanelOpen(true)}
        onExport={handleExportSettings}
        onImport={() => {/* Handled by file input */}}
        onReset={handleResetSettings}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleImportSettings}
          className="hidden"
          id="import-settings"
        />
        <label htmlFor="import-settings">
          <Upload className="h-4 w-4" />
        </label>
      </MinimalEditorToolbar>

      {/* Main Editor */}
      <main className="center-column">
        <div className="section">
          <MinimalCard>
            <MinimalCardContent>
              <FocusModeEditor
                value={text}
                onChange={handleTextChange}
                placeholder="Start writing your script here..."
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
                highlightOverlay={
                  <HighlightOverlay
                    text={text}
                    highlightSettings={{
                      hooks: highlightSettings.hooks.enabled,
                      bridges: highlightSettings.bridges.enabled,
                      goldenNuggets: highlightSettings.goldenNuggets.enabled,
                      ctas: highlightSettings.ctas.enabled,
                      readability: editorSettings.readability.enabled
                    }}
                    onElementAction={(action, elementType, text) => {
                      console.log('Element action:', action, elementType, text);
                    }}
                  />
                }
                style={{
                  fontFamily: `var(--editor-font-family)`,
                  fontSize: `var(--editor-font-size)`,
                  lineHeight: `var(--editor-line-height)`,
                  letterSpacing: `var(--editor-letter-spacing)`,
                  fontWeight: `var(--editor-font-weight)`,
                  textAlign: `var(--editor-text-align)` as any,
                }}
                autoFocus
              />
            </MinimalCardContent>
          </MinimalCard>

          {/* Quick Stats */}
          <div className="flex justify-center">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>{scriptStats.wordCount} words</span>
              <span>{scriptStats.sentenceCount} sentences</span>
              <span>{scriptStats.readingTime} min read</span>
              {readabilityAnalysis && (
                <span className="font-medium">
                  {readabilityAnalysis.overall.description} reading level
                </span>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Progressive Panels */}
      <ProgressivePanel
        title="Readability Analysis"
        icon={BarChart3}
        isOpen={readabilityPanelOpen}
        onToggle={() => setReadabilityPanelOpen(false)}
        size="lg"
      >
        <div className="space-y-4">
          {readabilityAnalysis ? (
            <div>
              <h4 className="font-medium mb-2">Analysis Results</h4>
              <p className="text-sm text-muted-foreground">
                Score: {readabilityAnalysis.overall.score} - {readabilityAnalysis.overall.description}
              </p>
              {/* Add detailed readability analysis here */}
            </div>
          ) : (
            <p className="text-muted-foreground">Start writing to see readability analysis.</p>
          )}
        </div>
      </ProgressivePanel>

      <ProgressivePanel
        title="Highlight Controls"
        icon={Eye}
        isOpen={highlightsPanelOpen}
        onToggle={() => setHighlightsPanelOpen(false)}
        size="lg"
      >
        <AdvancedHighlightControls
          settings={highlightSettings}
          onSettingsChange={setHighlightSettings}
          scriptStats={scriptStats}
        />
      </ProgressivePanel>

      <ProgressivePanel
        title="Editor Settings"
        icon={Palette}
        isOpen={settingsPanelOpen}
        onToggle={() => setSettingsPanelOpen(false)}
        size="xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-4">Editor Settings</h4>
            <SettingsPanel
              settings={editorSettings}
              onSettingsChange={setEditorSettings}
              isOpen={true}
              onToggle={() => {}}
            />
          </div>
          <div>
            <h4 className="font-medium mb-4">UI Preferences</h4>
            <UIPreferencesPanel
              preferences={uiPreferences}
              onPreferencesChange={setUIPreferences}
            />
          </div>
        </div>
      </ProgressivePanel>
    </div>
  );
} 