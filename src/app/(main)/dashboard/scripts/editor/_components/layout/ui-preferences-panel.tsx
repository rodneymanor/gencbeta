"use client";

import { useState } from "react";

import {
  Palette,
  Type,
  Layout,
  Monitor,
  Moon,
  Sun,
  Laptop,
  Eye,
  Sliders,
  Paintbrush,
  Grid,
  Spacing,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface UIPreferences {
  theme: {
    mode: "light" | "dark" | "auto";
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    borderWidth: number;
  };

  typography: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
    fontWeight: "normal" | "medium" | "semibold" | "bold";
    textAlign: "left" | "center" | "right" | "justify";
  };

  layout: {
    maxWidth: number;
    padding: number;
    margin: number;
    showLineNumbers: boolean;
    showRuler: boolean;
    rulerPosition: number;
    compactMode: boolean;
    fullscreenMode: boolean;
  };

  editor: {
    showMinimap: boolean;
    highlightCurrentLine: boolean;
    showIndentGuides: boolean;
    wordWrap: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    spellCheck: boolean;
    showWhitespace: boolean;
  };

  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    focusIndicator: boolean;
    screenReaderOptimized: boolean;
    keyboardNavigation: boolean;
    largeClickTargets: boolean;
  };

  performance: {
    enableAnimations: boolean;
    animationSpeed: "slow" | "normal" | "fast";
    enableTransitions: boolean;
    lazyLoading: boolean;
    virtualScrolling: boolean;
    debounceDelay: number;
  };
}

interface UIPreferencesPanelProps {
  preferences: UIPreferences;
  onPreferencesChange: (preferences: UIPreferences) => void;
}

const defaultUIPreferences: UIPreferences = {
  theme: {
    mode: "auto",
    primaryColor: "#f97316",
    accentColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderRadius: 8,
    borderWidth: 1,
  },
  typography: {
    fontFamily: "Inter",
    fontSize: 16,
    lineHeight: 1.7,
    letterSpacing: 0,
    fontWeight: "normal",
    textAlign: "left",
  },
  layout: {
    maxWidth: 800,
    padding: 24,
    margin: 16,
    showLineNumbers: false,
    showRuler: true,
    rulerPosition: 80,
    compactMode: false,
    fullscreenMode: false,
  },
  editor: {
    showMinimap: false,
    highlightCurrentLine: true,
    showIndentGuides: true,
    wordWrap: true,
    autoSave: true,
    autoSaveInterval: 30,
    spellCheck: true,
    showWhitespace: false,
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    focusIndicator: true,
    screenReaderOptimized: false,
    keyboardNavigation: true,
    largeClickTargets: false,
  },
  performance: {
    enableAnimations: true,
    animationSpeed: "normal",
    enableTransitions: true,
    lazyLoading: true,
    virtualScrolling: false,
    debounceDelay: 300,
  },
};

const fontFamilies = [
  { value: "Inter", label: "Inter" },
  { value: "system-ui", label: "System UI" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Source Code Pro", label: "Source Code Pro" },
];

const colorPresets = [
  { name: "Orange", primary: "#f97316", accent: "#3b82f6" },
  { name: "Blue", primary: "#3b82f6", accent: "#f97316" },
  { name: "Green", primary: "#10b981", accent: "#8b5cf6" },
  { name: "Purple", primary: "#8b5cf6", accent: "#10b981" },
  { name: "Pink", primary: "#ec4899", accent: "#06b6d4" },
  { name: "Red", primary: "#ef4444", accent: "#22c55e" },
];

export function UIPreferencesPanel({ preferences, onPreferencesChange }: UIPreferencesPanelProps) {
  const [activeTab, setActiveTab] = useState("theme");

  const updatePreference = (category: keyof UIPreferences, key: string, value: any) => {
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    };
    onPreferencesChange(newPreferences);
  };

  const resetToDefaults = () => {
    onPreferencesChange(defaultUIPreferences);
  };

  const applyColorPreset = (preset: (typeof colorPresets)[0]) => {
    const newPreferences = {
      ...preferences,
      theme: {
        ...preferences.theme,
        primaryColor: preset.primary,
        accentColor: preset.accent,
      },
    };
    onPreferencesChange(newPreferences);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          UI Preferences
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="theme" className="text-xs">
              <Palette className="mr-1 h-3 w-3" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="typography" className="text-xs">
              <Type className="mr-1 h-3 w-3" />
              Text
            </TabsTrigger>
            <TabsTrigger value="layout" className="text-xs">
              <Layout className="mr-1 h-3 w-3" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="editor" className="text-xs">
              <Monitor className="mr-1 h-3 w-3" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="text-xs">
              <Eye className="mr-1 h-3 w-3" />
              A11y
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs">
              <Sliders className="mr-1 h-3 w-3" />
              Perf
            </TabsTrigger>
          </TabsList>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "auto", icon: Laptop, label: "Auto" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={preferences.theme.mode === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePreference("theme", "mode", value)}
                      className="flex-1"
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Presets</Label>
                <div className="grid grid-cols-3 gap-2">
                  {colorPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyColorPreset(preset)}
                      className="h-12 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Border Radius: {preferences.theme.borderRadius}px</Label>
                <Slider
                  value={[preferences.theme.borderRadius]}
                  onValueChange={([value]) => updatePreference("theme", "borderRadius", value)}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Border Width: {preferences.theme.borderWidth}px</Label>
                <Slider
                  value={[preferences.theme.borderWidth]}
                  onValueChange={([value]) => updatePreference("theme", "borderWidth", value)}
                  max={4}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          {/* Typography Settings */}
          <TabsContent value="typography" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={preferences.typography.fontFamily}
                  onValueChange={(value) => updatePreference("typography", "fontFamily", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>{font.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Font Size: {preferences.typography.fontSize}px</Label>
                <Slider
                  value={[preferences.typography.fontSize]}
                  onValueChange={([value]) => updatePreference("typography", "fontSize", value)}
                  max={24}
                  min={12}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Line Height: {preferences.typography.lineHeight}</Label>
                <Slider
                  value={[preferences.typography.lineHeight]}
                  onValueChange={([value]) => updatePreference("typography", "lineHeight", value)}
                  max={2.5}
                  min={1.2}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Letter Spacing: {preferences.typography.letterSpacing}px</Label>
                <Slider
                  value={[preferences.typography.letterSpacing]}
                  onValueChange={([value]) => updatePreference("typography", "letterSpacing", value)}
                  max={2}
                  min={-1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Font Weight</Label>
                <Select
                  value={preferences.typography.fontWeight}
                  onValueChange={(value) => updatePreference("typography", "fontWeight", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semibold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Text Alignment</Label>
                <div className="flex gap-2">
                  {[
                    { value: "left", icon: AlignLeft },
                    { value: "center", icon: AlignCenter },
                    { value: "right", icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={preferences.typography.textAlign === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePreference("typography", "textAlign", value)}
                      className="flex-1"
                    >
                      <Icon className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Layout Settings */}
          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Max Width: {preferences.layout.maxWidth}px</Label>
                <Slider
                  value={[preferences.layout.maxWidth]}
                  onValueChange={([value]) => updatePreference("layout", "maxWidth", value)}
                  max={1200}
                  min={600}
                  step={50}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Padding: {preferences.layout.padding}px</Label>
                <Slider
                  value={[preferences.layout.padding]}
                  onValueChange={([value]) => updatePreference("layout", "padding", value)}
                  max={48}
                  min={8}
                  step={4}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Margin: {preferences.layout.margin}px</Label>
                <Slider
                  value={[preferences.layout.margin]}
                  onValueChange={([value]) => updatePreference("layout", "margin", value)}
                  max={32}
                  min={0}
                  step={4}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Show Line Numbers</Label>
                  <Switch
                    checked={preferences.layout.showLineNumbers}
                    onCheckedChange={(checked) => updatePreference("layout", "showLineNumbers", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Ruler</Label>
                  <Switch
                    checked={preferences.layout.showRuler}
                    onCheckedChange={(checked) => updatePreference("layout", "showRuler", checked)}
                  />
                </div>

                {preferences.layout.showRuler && (
                  <div className="space-y-2 pl-4">
                    <Label>Ruler Position: {preferences.layout.rulerPosition} chars</Label>
                    <Slider
                      value={[preferences.layout.rulerPosition]}
                      onValueChange={([value]) => updatePreference("layout", "rulerPosition", value)}
                      max={120}
                      min={60}
                      step={10}
                      className="w-full"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label>Compact Mode</Label>
                  <Switch
                    checked={preferences.layout.compactMode}
                    onCheckedChange={(checked) => updatePreference("layout", "compactMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Fullscreen Mode</Label>
                  <Switch
                    checked={preferences.layout.fullscreenMode}
                    onCheckedChange={(checked) => updatePreference("layout", "fullscreenMode", checked)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Editor Settings */}
          <TabsContent value="editor" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Show Minimap</Label>
                <Switch
                  checked={preferences.editor.showMinimap}
                  onCheckedChange={(checked) => updatePreference("editor", "showMinimap", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Highlight Current Line</Label>
                <Switch
                  checked={preferences.editor.highlightCurrentLine}
                  onCheckedChange={(checked) => updatePreference("editor", "highlightCurrentLine", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Indent Guides</Label>
                <Switch
                  checked={preferences.editor.showIndentGuides}
                  onCheckedChange={(checked) => updatePreference("editor", "showIndentGuides", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Word Wrap</Label>
                <Switch
                  checked={preferences.editor.wordWrap}
                  onCheckedChange={(checked) => updatePreference("editor", "wordWrap", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Auto Save</Label>
                <Switch
                  checked={preferences.editor.autoSave}
                  onCheckedChange={(checked) => updatePreference("editor", "autoSave", checked)}
                />
              </div>

              {preferences.editor.autoSave && (
                <div className="space-y-2 pl-4">
                  <Label>Auto Save Interval: {preferences.editor.autoSaveInterval}s</Label>
                  <Slider
                    value={[preferences.editor.autoSaveInterval]}
                    onValueChange={([value]) => updatePreference("editor", "autoSaveInterval", value)}
                    max={300}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Spell Check</Label>
                <Switch
                  checked={preferences.editor.spellCheck}
                  onCheckedChange={(checked) => updatePreference("editor", "spellCheck", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Whitespace</Label>
                <Switch
                  checked={preferences.editor.showWhitespace}
                  onCheckedChange={(checked) => updatePreference("editor", "showWhitespace", checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Accessibility Settings */}
          <TabsContent value="accessibility" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>High Contrast</Label>
                <Switch
                  checked={preferences.accessibility.highContrast}
                  onCheckedChange={(checked) => updatePreference("accessibility", "highContrast", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Reduced Motion</Label>
                <Switch
                  checked={preferences.accessibility.reducedMotion}
                  onCheckedChange={(checked) => updatePreference("accessibility", "reducedMotion", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Focus Indicator</Label>
                <Switch
                  checked={preferences.accessibility.focusIndicator}
                  onCheckedChange={(checked) => updatePreference("accessibility", "focusIndicator", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Screen Reader Optimized</Label>
                <Switch
                  checked={preferences.accessibility.screenReaderOptimized}
                  onCheckedChange={(checked) => updatePreference("accessibility", "screenReaderOptimized", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Keyboard Navigation</Label>
                <Switch
                  checked={preferences.accessibility.keyboardNavigation}
                  onCheckedChange={(checked) => updatePreference("accessibility", "keyboardNavigation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Large Click Targets</Label>
                <Switch
                  checked={preferences.accessibility.largeClickTargets}
                  onCheckedChange={(checked) => updatePreference("accessibility", "largeClickTargets", checked)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Animations</Label>
                <Switch
                  checked={preferences.performance.enableAnimations}
                  onCheckedChange={(checked) => updatePreference("performance", "enableAnimations", checked)}
                />
              </div>

              {preferences.performance.enableAnimations && (
                <div className="space-y-2 pl-4">
                  <Label>Animation Speed</Label>
                  <Select
                    value={preferences.performance.animationSpeed}
                    onValueChange={(value) => updatePreference("performance", "animationSpeed", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Enable Transitions</Label>
                <Switch
                  checked={preferences.performance.enableTransitions}
                  onCheckedChange={(checked) => updatePreference("performance", "enableTransitions", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Lazy Loading</Label>
                <Switch
                  checked={preferences.performance.lazyLoading}
                  onCheckedChange={(checked) => updatePreference("performance", "lazyLoading", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Virtual Scrolling</Label>
                <Switch
                  checked={preferences.performance.virtualScrolling}
                  onCheckedChange={(checked) => updatePreference("performance", "virtualScrolling", checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Debounce Delay: {preferences.performance.debounceDelay}ms</Label>
                <Slider
                  value={[preferences.performance.debounceDelay]}
                  onValueChange={([value]) => updatePreference("performance", "debounceDelay", value)}
                  max={1000}
                  min={100}
                  step={50}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={resetToDefaults} className="flex-1">
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultUIPreferences };
export type { UIPreferences };
