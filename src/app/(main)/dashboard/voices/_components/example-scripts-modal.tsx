"use client";

import { useState } from "react";

import { ChevronLeft, ChevronRight, Eye, ThumbsUp, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { OriginalScript } from "@/types/ai-voices";

interface ExampleScriptsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voiceName: string;
  examples: OriginalScript[];
}

export function ExampleScriptsModal({ open, onOpenChange, voiceName, examples }: ExampleScriptsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentScript = examples[currentIndex];
  const hasNext = currentIndex < examples.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!currentScript) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{voiceName} - Example Scripts</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No example scripts available</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {voiceName} - Example Scripts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={!hasPrev}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {currentIndex + 1} of {examples.length}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={!hasNext}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Script Card */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Script Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{currentScript.title}</h3>
                    {currentScript.platform && (
                      <Badge variant="outline" className="capitalize">
                        {currentScript.platform}
                      </Badge>
                    )}
                  </div>

                  {/* Metrics */}
                  {currentScript.metrics && (
                    <div className="text-muted-foreground flex items-center gap-4 text-sm">
                      {currentScript.metrics.views && (
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {currentScript.metrics.views.toLocaleString()}
                        </div>
                      )}
                      {currentScript.metrics.likes && (
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {currentScript.metrics.likes.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Script Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{currentScript.content}</p>
                  </div>
                </div>

                {/* Script Segments (if available) */}
                {currentScript.segments && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Script Breakdown:</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Hook</div>
                        <p className="rounded border-l-2 border-red-200 bg-red-50 p-2 text-sm dark:bg-red-950/20">
                          {currentScript.segments.Hook}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Bridge</div>
                        <p className="rounded border-l-2 border-blue-200 bg-blue-50 p-2 text-sm dark:bg-blue-950/20">
                          {currentScript.segments.Bridge}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          Golden Nugget
                        </div>
                        <p className="rounded border-l-2 border-yellow-200 bg-yellow-50 p-2 text-sm dark:bg-yellow-950/20">
                          {currentScript.segments["Golden Nugget"]}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          WTA (What To Act)
                        </div>
                        <p className="rounded border-l-2 border-green-200 bg-green-50 p-2 text-sm dark:bg-green-950/20">
                          {currentScript.segments.WTA}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Link */}
                {currentScript.source && (
                  <div className="border-t pt-2">
                    <a
                      href={currentScript.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline"
                    >
                      View original content →
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Carousel Dots */}
          {examples.length > 1 && (
            <div className="flex justify-center gap-2">
              {examples.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    index === currentIndex ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
