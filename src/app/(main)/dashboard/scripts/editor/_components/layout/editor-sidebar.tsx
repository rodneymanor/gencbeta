"use client";

import { useState } from "react";

import { Palette, BarChart3, Target, Clock, Eye, EyeOff, Lightbulb, Zap, Link, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface EditorSidebarProps {
  script: string;
  highlightSettings: {
    hooks: boolean;
    bridges: boolean;
    goldenNuggets: boolean;
    ctas: boolean;
  };
  onHighlightToggle: (type: keyof EditorSidebarProps["highlightSettings"]) => void;
}

export function EditorSidebar({ script, highlightSettings, onHighlightToggle }: EditorSidebarProps) {
  const [showStats, setShowStats] = useState(true);

  // Calculate basic statistics
  const wordCount = script
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = script.length;
  const sentenceCount = script.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphCount = script.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

  // Estimate script elements (simplified detection)
  const hookCount = (
    script.match(/\b(imagine|what if|did you know|here's why|the secret|shocking|amazing|incredible)\b/gi) ?? []
  ).length;
  const bridgeCount = (script.match(/\b(but|however|now|so|because|that's why|here's the thing)\b/gi) ?? []).length;
  const ctaCount = (script.match(/\b(subscribe|like|comment|share|follow|click|buy|get|download|sign up)\b/gi) ?? [])
    .length;
  const nuggetCount = (script.match(/\b(fact|tip|secret|trick|hack|pro tip|remember|key point)\b/gi) ?? []).length;

  return (
    <div className="border-border/50 bg-background/50 w-80 border-r backdrop-blur-sm">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Writing Tools</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowStats(!showStats)} className="h-8 w-8 p-0">
            {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Highlighting Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" />
              Highlight Elements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Hooks */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-orange-500" />
                <span className="text-sm">Hooks</span>
                <Badge variant="secondary" className="text-xs">
                  {hookCount}
                </Badge>
              </div>
              <Switch checked={highlightSettings.hooks} onCheckedChange={() => onHighlightToggle("hooks")} />
            </div>

            {/* Bridges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-cyan-500" />
                <span className="text-sm">Bridges</span>
                <Badge variant="secondary" className="text-xs">
                  {bridgeCount}
                </Badge>
              </div>
              <Switch checked={highlightSettings.bridges} onCheckedChange={() => onHighlightToggle("bridges")} />
            </div>

            {/* Golden Nuggets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Golden Nuggets</span>
                <Badge variant="secondary" className="text-xs">
                  {nuggetCount}
                </Badge>
              </div>
              <Switch
                checked={highlightSettings.goldenNuggets}
                onCheckedChange={() => onHighlightToggle("goldenNuggets")}
              />
            </div>

            {/* Call-to-Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Call-to-Actions</span>
                <Badge variant="secondary" className="text-xs">
                  {ctaCount}
                </Badge>
              </div>
              <Switch checked={highlightSettings.ctas} onCheckedChange={() => onHighlightToggle("ctas")} />
            </div>
          </CardContent>
        </Card>

        {/* Writing Statistics */}
        {showStats && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Writing Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-primary text-2xl font-bold">{wordCount}</div>
                  <div className="text-muted-foreground text-xs">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-primary text-2xl font-bold">{charCount}</div>
                  <div className="text-muted-foreground text-xs">Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-primary text-2xl font-bold">{sentenceCount}</div>
                  <div className="text-muted-foreground text-xs">Sentences</div>
                </div>
                <div className="text-center">
                  <div className="text-primary text-2xl font-bold">{paragraphCount}</div>
                  <div className="text-muted-foreground text-xs">Paragraphs</div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Reading Time</span>
                </div>
                <Badge variant="outline">{readingTime} min</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Writing Tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              Writing Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-muted-foreground space-y-1 text-xs">
              <div className="flex items-start gap-2">
                <Zap className="mt-0.5 h-3 w-3 text-orange-500" />
                <span>Start with a strong hook to grab attention</span>
              </div>
              <div className="flex items-start gap-2">
                <Link className="mt-0.5 h-3 w-3 text-cyan-500" />
                <span>Use bridges to connect ideas smoothly</span>
              </div>
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-3 w-3 text-blue-500" />
                <span>Include valuable nuggets of information</span>
              </div>
              <div className="flex items-start gap-2">
                <Megaphone className="mt-0.5 h-3 w-3 text-green-500" />
                <span>End with a clear call-to-action</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
