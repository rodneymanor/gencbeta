"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlaceholderDetectorProps {
  content: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ScriptPlaceholderDetector({
  content,
  onRegenerate,
  isRegenerating = false,
}: PlaceholderDetectorProps) {
  const [placeholders, setPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    // Detect placeholders in square brackets
    const placeholderRegex = /\[([^\]]+)\]/g;
    const matches = [...content.matchAll(placeholderRegex)];
    const foundPlaceholders = matches.map(match => match[0]);
    setPlaceholders(foundPlaceholders);
  }, [content]);

  if (placeholders.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div>
          <strong>Script contains unfilled placeholders:</strong>
          <div className="flex flex-wrap gap-1 mt-2">
            {placeholders.map((placeholder, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {placeholder}
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-sm">
          These placeholders should have been filled with actual content. The AI may have misunderstood the instructions.
        </p>
        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            size="sm"
            variant="destructive"
            className="mt-2"
          >
            {isRegenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Script
              </>
            )}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
} 