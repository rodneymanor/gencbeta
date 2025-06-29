"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import { ScriptOption } from "./types";

interface ScriptOptionsProps {
  optionA: ScriptOption | null;
  optionB: ScriptOption | null;
  onOptionSelect: (option: ScriptOption) => void;
  isGenerating: boolean;
}

export function ScriptOptions({ optionA, optionB, onOptionSelect, isGenerating }: ScriptOptionsProps) {
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
      <h2 className="text-xl font-semibold">Choose Your Script</h2>
      <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
        {/* Option A */}
        {optionA && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Option A</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{optionA.content}</pre>
            </CardContent>
            <CardFooter>
              <Button onClick={() => onOptionSelect(optionA)} className="w-full">
                Choose Option A
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Option B */}
        {optionB && (
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Option B</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">{optionB.content}</pre>
            </CardContent>
            <CardFooter>
              <Button onClick={() => onOptionSelect(optionB)} className="w-full">
                Choose Option B
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
