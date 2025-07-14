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
          <p className="text-muted-foreground mt-2 text-sm">Please try generating scripts again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-[var(--space-3)]">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-[var(--space-4)] text-center">
          <h1 className="mb-[var(--space-1)] text-3xl font-bold">Choose Your Script</h1>
          <p className="text-muted-foreground text-lg">Select the script that best fits your vision</p>
        </div>

        {/* Options Grid */}
        <div className="grid h-full grid-cols-1 gap-[var(--space-3)] lg:grid-cols-2">
          {/* Option A */}
          {optionA && (
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--space-2)]">
                <CardTitle className="text-xl font-semibold">Option A</CardTitle>
                <Button
                  onClick={() => onSelect(optionA)}
                  className="bg-primary text-primary-foreground hover:bg-primary/85 ml-[var(--space-2)] h-10 rounded-[20px] border-none px-[var(--space-3)] text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                >
                  Select This Script
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div
                  className="bg-muted/20 rounded-lg p-[var(--space-2)] text-base leading-relaxed whitespace-pre-wrap"
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
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--space-2)]">
                <CardTitle className="text-xl font-semibold">Option B</CardTitle>
                <Button
                  onClick={() => onSelect(optionB)}
                  className="bg-primary text-primary-foreground hover:bg-primary/85 ml-[var(--space-2)] h-10 rounded-[20px] border-none px-[var(--space-3)] text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                >
                  Select This Script
                </Button>
              </CardHeader>
              <CardContent className="flex-1 pt-0">
                <div
                  className="bg-muted/20 rounded-lg p-[var(--space-2)] text-base leading-relaxed whitespace-pre-wrap"
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
        <div className="mt-[var(--space-4)] text-center">
          <p className="text-muted-foreground text-sm">
            After selecting a script, you&apos;ll be taken to the Hemingway Editor to refine and perfect your content.
          </p>
        </div>
      </div>
    </div>
  );
}
