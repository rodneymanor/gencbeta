"use client";

import { useState } from "react";

import { BarChart3, Settings, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type HighlightConfig } from "@/lib/script-analysis";

import { HemingwayEditorCore } from "./hemingway-editor-core";

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
}

interface AnalysisStats {
  total: number;
  hooks: number;
  bridges: number;
  goldenNuggets: number;
  wtas: number;
  words: number;
  characters: number;
}

// Footer stats component
function EditorFooter({
  stats,
  showAnalysis,
  highlightConfig,
  setHighlightConfig,
}: {
  stats: AnalysisStats;
  showAnalysis: boolean;
  highlightConfig: HighlightConfig;
  setHighlightConfig: (config: HighlightConfig) => void;
}) {
  return (
    <div className="bg-background/50 text-muted-foreground border-t border-border/30 text-sm">
      {/* Word count and stats */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>{stats.words} words</span>
          </div>
          <span>•</span>
          <span>{stats.characters} characters</span>
        </div>

        {showAnalysis && stats.total > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-border/50">
              {stats.hooks} hooks
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50">
              {stats.bridges} bridges
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50">
              {stats.goldenNuggets} nuggets
            </Badge>
            <Badge variant="outline" className="text-xs border-border/50">
              {stats.wtas} CTAs
            </Badge>
          </div>
        )}
      </div>

      {/* Highlight settings */}
      {showAnalysis && (
        <AnalysisControls highlightConfig={highlightConfig} setHighlightConfig={setHighlightConfig} stats={stats} />
      )}
    </div>
  );
}

// Analysis controls component (now for footer)
function AnalysisControls({
  highlightConfig,
  setHighlightConfig,
  stats,
}: {
  highlightConfig: HighlightConfig;
  setHighlightConfig: (config: HighlightConfig) => void;
  stats: AnalysisStats;
}) {
  return (
    <div className="bg-background/30 border-t border-border/20 px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Highlight Settings</span>
        </div>
        <div className="flex items-center gap-2">
          <Palette className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm">{stats.total} elements found</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="hooks"
            checked={highlightConfig.hooks}
            onCheckedChange={(checked) => setHighlightConfig((prev) => ({ ...prev, hooks: checked }))}
          />
          <Label htmlFor="hooks" className="flex items-center gap-1">
            <span className="bg-script-hook h-3 w-3 rounded"></span>
            Hooks ({stats.hooks})
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="bridges"
            checked={highlightConfig.bridges}
            onCheckedChange={(checked) => setHighlightConfig((prev) => ({ ...prev, bridges: checked }))}
          />
          <Label htmlFor="bridges" className="flex items-center gap-1">
            <span className="bg-script-bridge h-3 w-3 rounded"></span>
            Bridges ({stats.bridges})
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="golden-nuggets"
            checked={highlightConfig.goldenNuggets}
            onCheckedChange={(checked) => setHighlightConfig((prev) => ({ ...prev, goldenNuggets: checked }))}
          />
          <Label htmlFor="golden-nuggets" className="flex items-center gap-1">
            <span className="bg-script-golden-nugget h-3 w-3 rounded"></span>
            Golden Nuggets ({stats.goldenNuggets})
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="wtas"
            checked={highlightConfig.wtas}
            onCheckedChange={(checked) => setHighlightConfig((prev) => ({ ...prev, wtas: checked }))}
          />
          <Label htmlFor="wtas" className="flex items-center gap-1">
            <span className="bg-script-wta h-3 w-3 rounded"></span>
            CTAs ({stats.wtas})
          </Label>
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
}: HemingwayEditorProps) {
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>({
    hooks: true,
    bridges: true,
    goldenNuggets: true,
    wtas: true,
  });

  const [showAnalysis] = useState(true);

  // Get analysis stats (simplified for now)
  const getAnalysisStats = (): AnalysisStats => {
    return {
      total: 0,
      hooks: 0,
      bridges: 0,
      goldenNuggets: 0,
      wtas: 0,
      words: value.trim().split(/\s+/).length,
      characters: value.length,
    };
  };

  const stats = getAnalysisStats();

  return (
    <div className={`flex h-full flex-col ${className}`}>
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
      />

      <EditorFooter
        stats={stats}
        showAnalysis={showAnalysis}
        highlightConfig={highlightConfig}
        setHighlightConfig={setHighlightConfig}
      />
    </div>
  );
}
