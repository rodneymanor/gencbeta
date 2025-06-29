"use client";

import { useState } from "react";

import { Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SPEED_WRITE_CONFIG } from "@/config/speed-write-prompt";

interface SpeedWriteInputProps {
  onQuickWrite: (idea: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function SpeedWriteInput({ onQuickWrite, disabled = false, className = "" }: SpeedWriteInputProps) {
  const [videoIdea, setVideoIdea] = useState("");

  const handleSubmit = () => {
    if (!videoIdea.trim() || disabled) return;
    onQuickWrite(videoIdea);
    setVideoIdea(""); // Clear input after submission
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`mx-auto w-full max-w-2xl space-y-4 ${className}`}>
      <div className="space-y-3">
        <div className="relative">
          <Input
            value={videoIdea}
            onChange={(e) => setVideoIdea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={SPEED_WRITE_CONFIG.ui.placeholders.ideaInput}
            className="border-border/50 focus:border-border focus-visible:ring-ring/20 bg-background/50 h-12 pr-28 text-base backdrop-blur-sm focus-visible:ring-1"
          />
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!videoIdea.trim() || disabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground absolute top-1/2 right-2 h-8 -translate-y-1/2 px-3 font-medium shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="mr-1 h-3 w-3" />
            Quick Write
          </Button>
        </div>

        <div className="bg-muted/30 border-border/30 rounded-lg border p-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            <span className="text-foreground font-semibold">Speed Write Formula:</span>{" "}
            {SPEED_WRITE_CONFIG.ui.formula.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
