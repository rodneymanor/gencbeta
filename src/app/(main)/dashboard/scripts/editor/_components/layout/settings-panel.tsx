"use client";

import { useState } from "react";

import {
  Settings,
  ChevronDown,
  ChevronUp,
  Palette,
  Eye,
  Target,
  BarChart3,
  Download,
  Upload,
  RotateCcw,
  Sliders,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export interface EditorSettings {
  // Highlighting Settings
  highlighting: {
    enabled: boolean;
    opacity: number;
    showBorders: boolean;
    animationSpeed: "slow" | "normal" | "fast";
  };

  // Script Element Settings
  scriptElements: {
    hooks: {
      enabled: boolean;
      sensitivity: number;
      color: string;
    };
    bridges: {
      enabled: boolean;
      sensitivity: number;
      color: string;
    };
    goldenNuggets: {
      enabled: boolean;
      sensitivity: number;
      color: string;
    };
    ctas: {
      enabled: boolean;
      sensitivity: number;
      color: string;
    };
  };

  // Readability Settings
  readability: {
    enabled: boolean;
    algorithm: "flesch" | "gunning-fog" | "coleman-liau" | "automated";
    thresholds: {
      easy: number;
      medium: number;
      hard: number;
    };
    showScores: boolean;
    highlightSentences: boolean;
  };

  // UI Preferences
  ui: {
    theme: "light" | "dark" | "auto";
    fontSize: number;
    lineHeight: number;
    showStatistics: boolean;
    compactMode: boolean;
  };

  // Advanced Settings
  advanced: {
    autoSave: boolean;
    saveInterval: number;
    debugMode: boolean;
    experimentalFeatures: boolean;
  };
}

interface SettingsPanelProps {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const defaultSettings: EditorSettings = {
  highlighting: {
    enabled: true,
    opacity: 50,
    showBorders: true,
    animationSpeed: "normal",
  },
  scriptElements: {
    hooks: {
      enabled: true,
      sensitivity: 75,
      color: "#f59e0b", // yellow
    },
    bridges: {
      enabled: true,
      sensitivity: 70,
      color: "#3b82f6", // blue
    },
    goldenNuggets: {
      enabled: true,
      sensitivity: 80,
      color: "#f97316", // orange
    },
    ctas: {
      enabled: true,
      sensitivity: 85,
      color: "#10b981", // green
    },
  },
  readability: {
    enabled: true,
    algorithm: "flesch",
    thresholds: {
      easy: 70,
      medium: 40,
      hard: 0,
    },
    showScores: true,
    highlightSentences: true,
  },
  ui: {
    theme: "auto",
    fontSize: 16,
    lineHeight: 1.7,
    showStatistics: true,
    compactMode: false,
  },
  advanced: {
    autoSave: true,
    saveInterval: 30,
    debugMode: false,
    experimentalFeatures: false,
  },
};

export function SettingsPanel({ settings, onSettingsChange, isOpen, onToggle }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("highlighting");

  const updateSettings = (path: string, value: any) => {
    const pathArray = path.split(".");
    const newSettings = { ...settings };

    let current: any = newSettings;
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;

    onSettingsChange(newSettings);
  };

  const resetToDefaults = () => {
    onSettingsChange(defaultSettings);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hemingway-editor-settings.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        onSettingsChange({ ...defaultSettings, ...importedSettings });
      } catch (error) {
        console.error("Failed to import settings:", error);
      }
    };
    reader.readAsText(file);
  };

  const sections = [
    {
      id: "highlighting",
      title: "Highlighting",
      icon: Palette,
      description: "Visual highlighting controls",
    },
    {
      id: "elements",
      title: "Script Elements",
      icon: Target,
      description: "Element detection settings",
    },
    {
      id: "readability",
      title: "Readability",
      icon: BarChart3,
      description: "Analysis algorithms and thresholds",
    },
    {
      id: "ui",
      title: "Interface",
      icon: Eye,
      description: "UI preferences and layout",
    },
    {
      id: "advanced",
      title: "Advanced",
      icon: Sliders,
      description: "Power user features",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Editor Settings</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Settings</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportSettings} className="h-8">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <Button variant="outline" size="sm" className="h-8">
                    <Upload className="mr-1 h-3 w-3" />
                    Import
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={resetToDefaults} className="h-8">
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="mt-4 flex flex-wrap gap-1">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveSection(section.id)}
                  className="h-8"
                >
                  <section.icon className="mr-1 h-3 w-3" />
                  {section.title}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Highlighting Settings */}
            {activeSection === "highlighting" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="highlighting-enabled">Enable Highlighting</Label>
                  <Switch
                    id="highlighting-enabled"
                    checked={settings.highlighting.enabled}
                    onCheckedChange={(checked) => updateSettings("highlighting.enabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Highlight Opacity: {settings.highlighting.opacity}%</Label>
                  <Slider
                    value={[settings.highlighting.opacity]}
                    onValueChange={([value]) => updateSettings("highlighting.opacity", value)}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-borders">Show Element Borders</Label>
                  <Switch
                    id="show-borders"
                    checked={settings.highlighting.showBorders}
                    onCheckedChange={(checked) => updateSettings("highlighting.showBorders", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Animation Speed</Label>
                  <Select
                    value={settings.highlighting.animationSpeed}
                    onValueChange={(value) => updateSettings("highlighting.animationSpeed", value)}
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
              </div>
            )}

            {/* Script Elements Settings */}
            {activeSection === "elements" && (
              <div className="space-y-6">
                {Object.entries(settings.scriptElements).map(([elementType, elementSettings]) => (
                  <div key={elementType} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {elementType.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                    </div>

                    <div className="border-muted space-y-3 border-l-2 pl-4">
                      <div className="flex items-center justify-between">
                        <Label>Enable Detection</Label>
                        <Switch
                          checked={elementSettings.enabled}
                          onCheckedChange={(checked) =>
                            updateSettings(`scriptElements.${elementType}.enabled`, checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Detection Sensitivity: {elementSettings.sensitivity}%</Label>
                        <Slider
                          value={[elementSettings.sensitivity]}
                          onValueChange={([value]) =>
                            updateSettings(`scriptElements.${elementType}.sensitivity`, value)
                          }
                          max={100}
                          min={25}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Readability Settings */}
            {activeSection === "readability" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="readability-enabled">Enable Readability Analysis</Label>
                  <Switch
                    id="readability-enabled"
                    checked={settings.readability.enabled}
                    onCheckedChange={(checked) => updateSettings("readability.enabled", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Analysis Algorithm</Label>
                  <Select
                    value={settings.readability.algorithm}
                    onValueChange={(value) => updateSettings("readability.algorithm", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flesch">Flesch Reading Ease</SelectItem>
                      <SelectItem value="gunning-fog">Gunning Fog Index</SelectItem>
                      <SelectItem value="coleman-liau">Coleman-Liau Index</SelectItem>
                      <SelectItem value="automated">Automated Readability Index</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Readability Thresholds</Label>

                  <div className="space-y-2">
                    <Label className="text-xs text-green-600">
                      Easy Threshold: {settings.readability.thresholds.easy}
                    </Label>
                    <Slider
                      value={[settings.readability.thresholds.easy]}
                      onValueChange={([value]) => updateSettings("readability.thresholds.easy", value)}
                      max={100}
                      min={60}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-yellow-600">
                      Medium Threshold: {settings.readability.thresholds.medium}
                    </Label>
                    <Slider
                      value={[settings.readability.thresholds.medium]}
                      onValueChange={([value]) => updateSettings("readability.thresholds.medium", value)}
                      max={70}
                      min={20}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-scores">Show Readability Scores</Label>
                    <Switch
                      id="show-scores"
                      checked={settings.readability.showScores}
                      onCheckedChange={(checked) => updateSettings("readability.showScores", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="highlight-sentences">Highlight Sentences</Label>
                    <Switch
                      id="highlight-sentences"
                      checked={settings.readability.highlightSentences}
                      onCheckedChange={(checked) => updateSettings("readability.highlightSentences", checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UI Settings */}
            {activeSection === "ui" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.ui.theme} onValueChange={(value) => updateSettings("ui.theme", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Font Size: {settings.ui.fontSize}px</Label>
                  <Slider
                    value={[settings.ui.fontSize]}
                    onValueChange={([value]) => updateSettings("ui.fontSize", value)}
                    max={24}
                    min={12}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Line Height: {settings.ui.lineHeight}</Label>
                  <Slider
                    value={[settings.ui.lineHeight]}
                    onValueChange={([value]) => updateSettings("ui.lineHeight", value)}
                    max={2.5}
                    min={1.2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-statistics">Show Writing Statistics</Label>
                    <Switch
                      id="show-statistics"
                      checked={settings.ui.showStatistics}
                      onCheckedChange={(checked) => updateSettings("ui.showStatistics", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <Switch
                      id="compact-mode"
                      checked={settings.ui.compactMode}
                      onCheckedChange={(checked) => updateSettings("ui.compactMode", checked)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeSection === "advanced" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-save">Auto Save</Label>
                  <Switch
                    id="auto-save"
                    checked={settings.advanced.autoSave}
                    onCheckedChange={(checked) => updateSettings("advanced.autoSave", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Save Interval: {settings.advanced.saveInterval}s</Label>
                  <Slider
                    value={[settings.advanced.saveInterval]}
                    onValueChange={([value]) => updateSettings("advanced.saveInterval", value)}
                    max={300}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <Switch
                      id="debug-mode"
                      checked={settings.advanced.debugMode}
                      onCheckedChange={(checked) => updateSettings("advanced.debugMode", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="experimental-features">Experimental Features</Label>
                    <Switch
                      id="experimental-features"
                      checked={settings.advanced.experimentalFeatures}
                      onCheckedChange={(checked) => updateSettings("advanced.experimentalFeatures", checked)}
                    />
                  </div>
                </div>

                {settings.advanced.debugMode && (
                  <div className="bg-muted mt-4 rounded-lg p-3">
                    <Label className="text-muted-foreground text-xs">Debug Info</Label>
                    <pre className="mt-1 max-h-32 overflow-auto text-xs">{JSON.stringify(settings, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { defaultSettings };
