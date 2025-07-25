"use client";

import { useEffect, useState } from "react";

import { AlertTriangle, RefreshCw, Eye } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { detectNegativeKeywords } from "@/data/negative-keywords";

interface ScriptNegativeKeywordDetectorProps {
  content: string;
  negativeKeywords: string[];
  onRegenerateRequest?: () => void;
  isRegenerating?: boolean;
  className?: string;
}

export function ScriptNegativeKeywordDetector({
  content,
  negativeKeywords,
  onRegenerateRequest,
  isRegenerating = false,
  className = "",
}: ScriptNegativeKeywordDetectorProps) {
  const [detection, setDetection] = useState<{
    hasNegativeKeywords: boolean;
    detectedKeywords: string[];
    highlightedText: string;
  } | null>(null);

  useEffect(() => {
    if (content && negativeKeywords.length > 0) {
      const result = detectNegativeKeywords(content, negativeKeywords);
      setDetection(result);
    } else {
      setDetection(null);
    }
  }, [content, negativeKeywords]);

  if (!detection || !detection.hasNegativeKeywords) {
    return null;
  }

  return (
    <div className={className}>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="mb-2 font-medium">
              Detected {detection.detectedKeywords.length} AI-overused word
              {detection.detectedKeywords.length !== 1 ? "s" : ""}
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {detection.detectedKeywords.map((keyword) => (
                <Badge key={keyword} variant="destructive" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
            <p className="text-sm">
              These words make content sound robotic and AI-generated. Consider regenerating for more natural language.
            </p>
          </div>
          <div className="ml-4 flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="mr-1 h-4 w-4" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Script with Highlighted Keywords</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: detection.highlightedText.replace(
                        /class="negative-keyword"/g,
                        'class="bg-red-200 dark:bg-red-900 px-1 py-0.5 rounded font-semibold"',
                      ),
                    }}
                  />
                  <div className="bg-muted mt-4 rounded-lg p-3">
                    <p className="text-muted-foreground text-sm">
                      <strong>Legend:</strong> Highlighted words are flagged as AI-overused terms that should be avoided
                      for more natural, human-like content.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            {onRegenerateRequest && (
              <Button onClick={onRegenerateRequest} disabled={isRegenerating} size="sm">
                {isRegenerating ? (
                  <>
                    <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
