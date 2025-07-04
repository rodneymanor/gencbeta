"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentLoading } from "@/components/ui/loading-animations";

import { ScriptOption } from "./types";

interface ScriptOptionsProps {
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  onSelect: (option: ScriptOption) => void;
  isGenerating: boolean;
}

export function ScriptOptions({ optionA, optionB, onSelect, isGenerating }: ScriptOptionsProps) {
  if (isGenerating) {
    return (
      <div className="flex h-full items-center justify-center">
        <ContentLoading />
      </div>
    );
  }

  if (!optionA && !optionB) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">No script options available</p>
          <p className="text-muted-foreground text-sm mt-2">Please try generating scripts again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Script</h1>
          <p className="text-muted-foreground text-lg">Select the script that best fits your vision</p>
        </div>

        {/* Options Grid */}
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Option A */}
          {optionA && (
            <Card className="flex flex-col border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-semibold">Option A</CardTitle>
                <Button
                  onClick={() => onSelect(optionA)}
                  variant="default"
                  size="sm"
                  className="ml-4 px-6"
                >
                  Select This Script
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div
                  className="text-base leading-relaxed whitespace-pre-wrap p-4 bg-muted/20 rounded-lg border border-border/30"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    lineHeight: "1.7",
                  }}
                >
                  {optionA.content}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Option B */}
          {optionB && (
            <Card className="flex flex-col border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-xl font-semibold">Option B</CardTitle>
                <Button
                  onClick={() => onSelect(optionB)}
                  variant="default"
                  size="sm"
                  className="ml-4 px-6"
                >
                  Select This Script
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div
                  className="text-base leading-relaxed whitespace-pre-wrap p-4 bg-muted/20 rounded-lg border border-border/30"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    lineHeight: "1.7",
                  }}
                >
                  {optionB.content}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            After selecting a script, you&apos;ll be taken to the Hemingway Editor to refine and perfect your content.
          </p>
        </div>
      </div>
    </div>
  );
}
