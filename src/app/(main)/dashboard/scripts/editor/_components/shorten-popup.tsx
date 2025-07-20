"use client";

import { useState, useRef, useEffect } from "react";

import { Check, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface ShortenPopupProps {
  originalText: string;
  position?: { x: number; y: number }; // Optional when used within Popover
  onAccept: (shortenedText: string) => void;
  onReject: () => void;
  onRefresh: () => void;
  embedded?: boolean; // Flag to indicate if it's embedded in a Popover
}

export function ShortenPopup({
  originalText,
  position,
  onAccept,
  onReject,
  onRefresh,
  embedded = false,
}: ShortenPopupProps) {
  const [shortenedText, setShortenedText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Shorten text using API
  const shortenText = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: originalText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten text");
      }

      const data = await response.json();
      setShortenedText(data.shortenedText || "");
    } catch (err) {
      setError("Failed to shorten text. Please try again.");
      console.error("Shorten error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial shortening
  useEffect(() => {
    shortenText();
  }, [originalText]);

  const handleAccept = () => {
    if (shortenedText.trim()) {
      onAccept(shortenedText);
    }
  };

  const handleRefresh = () => {
    onRefresh();
    shortenText();
  };

  // Content component that can be rendered embedded or standalone
  const popupContent = (
    <div className="space-y-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">✂️</span>
          <span className="text-sm font-medium">Shorten</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onReject} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground ml-2 text-sm">Shortening...</span>
        </div>
      ) : error ? (
        <div className="py-4 text-center">
          <p className="text-destructive mb-2 text-sm">{error}</p>
          <Button onClick={handleRefresh} size="sm" variant="outline">
            <RefreshCw className="mr-1 h-3 w-3" />
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Shortened Text Input */}
          <div className="space-y-2">
            <Textarea
              value={shortenedText}
              onChange={(e) => setShortenedText(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              placeholder="Shortened text will appear here..."
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleRefresh} size="sm" variant="outline" className="h-8 px-3">
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button onClick={handleAccept} size="sm" className="h-8 px-3" disabled={!shortenedText.trim()}>
              <Check className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // Return embedded content or standalone positioned card
  if (embedded) {
    return popupContent;
  }

  // Adjust position to stay within viewport for standalone mode
  const adjustedPosition = {
    x: Math.min(position?.x || 0, window.innerWidth - 350),
    y: Math.min(position?.y || 0, window.innerHeight - 200),
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000]">
      <Card
        ref={popupRef}
        className="border-border pointer-events-auto absolute w-80 border shadow-lg"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 1000,
        }}
      >
        {popupContent}
      </Card>
    </div>
  );
}
