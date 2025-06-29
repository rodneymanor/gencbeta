"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex h-64 items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Generating your script options...</p>
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
