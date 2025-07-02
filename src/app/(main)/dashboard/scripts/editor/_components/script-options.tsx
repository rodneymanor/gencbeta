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
      <div className="space-y-4">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
            </CardHeader>
            <CardContent className="flex-1">
              <ContentLoading />
            </CardContent>
          </Card>
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="bg-muted h-6 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 w-16 animate-pulse rounded" />
            </CardHeader>
            <CardContent className="flex-1">
              <ContentLoading />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
        {/* Option A */}
        {optionA && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">Option A</CardTitle>
              <Button onClick={() => onSelect(optionA)} variant="outline" size="sm" className="ml-4">
                Select
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{optionA.content}</pre>
            </CardContent>
          </Card>
        )}

        {/* Option B */}
        {optionB && (
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-lg">Option B</CardTitle>
              <Button onClick={() => onSelect(optionB)} variant="outline" size="sm" className="ml-4">
                Select
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{optionB.content}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
