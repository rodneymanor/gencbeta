"use client";

import { useState } from "react";

import {
  Eye,
  EyeOff,
  Palette,
  Sliders,
  Zap,
  Link,
  Target,
  Megaphone,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface HighlightSettings {
  hooks: boolean;
  bridges: boolean;
  goldenNuggets: boolean;
  ctas: boolean;
  readability: boolean;
}

interface AdvancedHighlightSettings extends HighlightSettings {
  // Individual element settings
  elementSettings: {
    hooks: {
      opacity: number;
      showLabels: boolean;
      animateOnHover: boolean;
      color: string;
    };
    bridges: {
      opacity: number;
      showLabels: boolean;
      animateOnHover: boolean;
      color: string;
    };
    goldenNuggets: {
      opacity: number;
      showLabels: boolean;
      animateOnHover: boolean;
      color: string;
    };
    ctas: {
      opacity: number;
      showLabels: boolean;
      animateOnHover: boolean;
      color: string;
    };
  };

  // Readability settings
  readabilitySettings: {
    opacity: number;
    showGradient: boolean;
    colorIntensity: number;
    showTooltips: boolean;
  };

  // Global settings
  global: {
    masterOpacity: number;
    animationSpeed: number;
    showOverlay: boolean;
    blendMode: "normal" | "multiply" | "overlay";
  };
}

interface AdvancedHighlightControlsProps {
  settings: AdvancedHighlightSettings;
  onSettingsChange: (settings: AdvancedHighlightSettings) => void;
  scriptStats: {
    hooks: number;
    bridges: number;
    goldenNuggets: number;
    ctas: number;
  };
}

const defaultAdvancedSettings: AdvancedHighlightSettings = {
  hooks: true,
  bridges: true,
  goldenNuggets: true,
  ctas: true,
  readability: false,
  elementSettings: {
    hooks: {
      opacity: 60,
      showLabels: true,
      animateOnHover: true,
      color: "#f59e0b",
    },
    bridges: {
      opacity: 55,
      showLabels: true,
      animateOnHover: true,
      color: "#3b82f6",
    },
    goldenNuggets: {
      opacity: 65,
      showLabels: true,
      animateOnHover: true,
      color: "#f97316",
    },
    ctas: {
      opacity: 70,
      showLabels: true,
      animateOnHover: true,
      color: "#10b981",
    },
  },
  readabilitySettings: {
    opacity: 40,
    showGradient: true,
    colorIntensity: 75,
    showTooltips: true,
  },
  global: {
    masterOpacity: 100,
    animationSpeed: 300,
    showOverlay: true,
    blendMode: "normal",
  },
};

export function AdvancedHighlightControls({ settings, onSettingsChange, scriptStats }: AdvancedHighlightControlsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["elements"]));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateSetting = (path: string, value: any) => {
    const pathArray = path.split(".");
    const newSettings = { ...settings };

    let current: any = newSettings;
    for (let i = 0; i < pathArray.length - 1; i++) {
      if (!current[pathArray[i]]) {
        current[pathArray[i]] = {};
      }
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;

    onSettingsChange(newSettings);
  };

  const toggleElement = (element: keyof HighlightSettings) => {
    updateSetting(element, !settings[element]);
  };

  const elementConfig = {
    hooks: {
      icon: Zap,
      label: "Hooks",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      count: scriptStats.hooks,
    },
    bridges: {
      icon: Link,
      label: "Bridges",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      count: scriptStats.bridges,
    },
    goldenNuggets: {
      icon: Target,
      label: "Golden Nuggets",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      count: scriptStats.goldenNuggets,
    },
    ctas: {
      icon: Megaphone,
      label: "CTAs",
      color: "text-green-600",
      bgColor: "bg-green-100",
      count: scriptStats.ctas,
    },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Palette className="h-4 w-4" />
          Highlight Controls
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Toggle Bar */}
        <div className="bg-muted flex items-center gap-2 rounded-lg p-2">
          {Object.entries(elementConfig).map(([key, config]) => {
            const isEnabled = settings[key as keyof HighlightSettings];
            const IconComponent = config.icon;

            return (
              <Button
                key={key}
                variant={isEnabled ? "default" : "ghost"}
                size="sm"
                onClick={() => toggleElement(key as keyof HighlightSettings)}
                className="h-8 px-2"
              >
                <IconComponent className="mr-1 h-3 w-3" />
                <span className="text-xs">{config.label}</span>
                {config.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-xs">
                    {config.count}
                  </Badge>
                )}
              </Button>
            );
          })}

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={settings.readability ? "default" : "ghost"}
            size="sm"
            onClick={() => toggleElement("readability")}
            className="h-8 px-2"
          >
            <BarChart3 className="mr-1 h-3 w-3" />
            <span className="text-xs">Readability</span>
          </Button>
        </div>

        {/* Master Controls */}
        <Collapsible open={expandedSections.has("global")} onOpenChange={() => toggleSection("global")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                <span className="text-sm font-medium">Global Settings</span>
              </div>
              {expandedSections.has("global") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label className="text-xs">Master Opacity: {settings.global.masterOpacity}%</Label>
              <Slider
                value={[settings.global.masterOpacity]}
                onValueChange={([value]) => updateSetting("global.masterOpacity", value)}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Animation Speed: {settings.global.animationSpeed}ms</Label>
              <Slider
                value={[settings.global.animationSpeed]}
                onValueChange={([value]) => updateSetting("global.animationSpeed", value)}
                max={1000}
                min={100}
                step={50}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs">Show Overlay</Label>
              <Switch
                checked={settings.global.showOverlay}
                onCheckedChange={(checked) => updateSetting("global.showOverlay", checked)}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Element-Specific Controls */}
        <Collapsible open={expandedSections.has("elements")} onOpenChange={() => toggleSection("elements")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Element Settings</span>
              </div>
              {expandedSections.has("elements") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-2">
            {Object.entries(elementConfig).map(([key, config]) => {
              const elementSettings = settings.elementSettings[key as keyof typeof settings.elementSettings];
              const isEnabled = settings[key as keyof HighlightSettings];
              const IconComponent = config.icon;

              return (
                <div key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${config.color}`} />
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {config.count} found
                    </Badge>
                    <Switch checked={isEnabled} onCheckedChange={() => toggleElement(key as keyof HighlightSettings)} />
                  </div>

                  {isEnabled && (
                    <div className="border-muted space-y-3 border-l-2 pl-6">
                      <div className="space-y-2">
                        <Label className="text-xs">Opacity: {elementSettings.opacity}%</Label>
                        <Slider
                          value={[elementSettings.opacity]}
                          onValueChange={([value]) => updateSetting(`elementSettings.${key}.opacity`, value)}
                          max={100}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Show Labels</Label>
                        <Switch
                          checked={elementSettings.showLabels}
                          onCheckedChange={(checked) => updateSetting(`elementSettings.${key}.showLabels`, checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Animate on Hover</Label>
                        <Switch
                          checked={elementSettings.animateOnHover}
                          onCheckedChange={(checked) => updateSetting(`elementSettings.${key}.animateOnHover`, checked)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {/* Readability Controls */}
        <Collapsible open={expandedSections.has("readability")} onOpenChange={() => toggleSection("readability")}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-between p-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm font-medium">Readability Settings</span>
              </div>
              {expandedSections.has("readability") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Enable Readability Highlighting</Label>
              <Switch checked={settings.readability} onCheckedChange={() => toggleElement("readability")} />
            </div>

            {settings.readability && (
              <div className="border-muted space-y-3 border-l-2 pl-4">
                <div className="space-y-2">
                  <Label className="text-xs">Opacity: {settings.readabilitySettings.opacity}%</Label>
                  <Slider
                    value={[settings.readabilitySettings.opacity]}
                    onValueChange={([value]) => updateSetting("readabilitySettings.opacity", value)}
                    max={100}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Color Intensity: {settings.readabilitySettings.colorIntensity}%</Label>
                  <Slider
                    value={[settings.readabilitySettings.colorIntensity]}
                    onValueChange={([value]) => updateSetting("readabilitySettings.colorIntensity", value)}
                    max={100}
                    min={25}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Gradient</Label>
                  <Switch
                    checked={settings.readabilitySettings.showGradient}
                    onCheckedChange={(checked) => updateSetting("readabilitySettings.showGradient", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Tooltips</Label>
                  <Switch
                    checked={settings.readabilitySettings.showTooltips}
                    onCheckedChange={(checked) => updateSetting("readabilitySettings.showTooltips", checked)}
                  />
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Quick Actions */}
        <div className="flex gap-2 border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Toggle all elements
              const allEnabled = Object.keys(elementConfig).every((key) => settings[key as keyof HighlightSettings]);
              Object.keys(elementConfig).forEach((key) => {
                updateSetting(key, !allEnabled);
              });
            }}
            className="flex-1"
          >
            <Eye className="mr-1 h-3 w-3" />
            Toggle All
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Reset to defaults
              onSettingsChange(defaultAdvancedSettings);
            }}
            className="flex-1"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { defaultAdvancedSettings };
export type { AdvancedHighlightSettings };
