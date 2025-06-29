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
    <div className={`w-full space-y-4 ${className}`}>
      <div className="space-y-3">
        {/* Main Input Container */}
        <div className="group relative">
          <Input
            value={videoIdea}
            onChange={(e) => setVideoIdea(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={SPEED_WRITE_CONFIG.ui.placeholders.ideaInput}
            className="placeholder:text-muted-foreground/70 border-border/40 hover:border-border/60 focus:border-primary/50 focus-visible:ring-primary/20 bg-background/80 h-11 pr-[120px] text-sm shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md focus-visible:shadow-md focus-visible:ring-2"
          />
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={!videoIdea.trim() || disabled}
            className="bg-primary hover:bg-primary/90 text-primary-foreground absolute top-1/2 right-1.5 h-8 -translate-y-1/2 px-3 text-xs font-medium shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="mr-1.5 h-3 w-3" />
            Quick Write
          </Button>
        </div>

        {/* Formula Info Card */}
        <div className="bg-muted/20 border-border/20 rounded-md border p-3 backdrop-blur-sm">
          <p className="text-muted-foreground/80 text-xs leading-relaxed">
            <span className="text-foreground/90 font-medium">Speed Write Formula:</span>{" "}
            <span className="text-muted-foreground/70">{SPEED_WRITE_CONFIG.ui.formula.summary}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
