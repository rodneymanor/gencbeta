"use client";

import { useState } from "react";

import { Eye, EyeOff, Zap, FileText, BarChart3, Settings, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type HighlightConfig } from "@/lib/script-analysis";

import { HemingwayEditorCore } from "./hemingway-editor-core";

interface HemingwayEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minRows?: number;
  maxRows?: number;
  readOnly?: boolean;
  autoFocus?: boolean;
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

// Header component
function EditorHeader({
  showAnalysis,
  setShowAnalysis,
  isAnalyzing,
}: {
  showAnalysis: boolean;
  setShowAnalysis: (show: boolean) => void;
  isAnalyzing: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <FileText className="text-muted-foreground h-5 w-5" />
        <h2 className="text-lg font-semibold">Script Editor</h2>
        {isAnalyzing && (
          <Badge variant="secondary" className="animate-pulse">
            <Zap className="mr-1 h-3 w-3" />
            Analyzing...
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="flex items-center gap-1"
        >
          {showAnalysis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          {showAnalysis ? "Hide" : "Show"} Analysis
        </Button>
      </div>
    </div>
  );
}

// Analysis controls component
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
    <div className="bg-muted/20 border-b p-4">
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

// Footer stats component
function EditorFooter({ stats, showAnalysis }: { stats: AnalysisStats; showAnalysis: boolean }) {
  return (
    <div className="bg-muted/20 text-muted-foreground flex items-center justify-between border-t p-4 text-sm">
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
          <Badge variant="outline" className="text-xs">
            {stats.hooks} hooks
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stats.bridges} bridges
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stats.goldenNuggets} nuggets
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stats.wtas} CTAs
          </Badge>
        </div>
      )}
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
}: HemingwayEditorProps) {
  const [highlightConfig, setHighlightConfig] = useState<HighlightConfig>({
    hooks: true,
    bridges: true,
    goldenNuggets: true,
    wtas: true,
  });

  const [showAnalysis, setShowAnalysis] = useState(true);

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
      <EditorHeader showAnalysis={showAnalysis} setShowAnalysis={setShowAnalysis} isAnalyzing={false} />

      {showAnalysis && (
        <AnalysisControls highlightConfig={highlightConfig} setHighlightConfig={setHighlightConfig} stats={stats} />
      )}

      <HemingwayEditorCore
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minRows={minRows}
        maxRows={maxRows}
        readOnly={readOnly}
        autoFocus={autoFocus}
        highlightConfig={highlightConfig}
      />

      <EditorFooter stats={stats} showAnalysis={showAnalysis} />
    </div>
  );
}
