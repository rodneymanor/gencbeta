"use client";

import { useState, useEffect, useCallback } from "react";

import { Download, Save, Mic, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useVoice, type VoiceType } from "@/contexts/voice-context";

interface FloatingToolbarProps {
  script: string;
  onScriptChange: (script: string) => void;
}

export function FloatingToolbar({ script }: FloatingToolbarProps) {
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { currentVoice, setCurrentVoice, availableVoices } = useVoice();

  const handleSave = useCallback(async () => {
    if (!script.trim()) return;

    setIsSaving(true);
    try {
      // TODO: Implement actual save functionality
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Script saved successfully!");
    } catch {
      toast.error("Failed to save script");
    } finally {
      setIsSaving(false);
    }
  }, [script]);

  // Add keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const handleDownload = () => {
    if (!script.trim()) return;

    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Script downloaded!");
  };

  const handleChangeVoice = (voiceType: VoiceType) => {
    setCurrentVoice(voiceType);
    toast.success(`Voice changed to ${voiceType}`);
  };

  const handleRewriteWithVoice = async (voiceType: VoiceType) => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      // Change the voice first
      setCurrentVoice(voiceType);
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      toast.success(`Script rewritten with ${voiceType} voice!`);
    } catch {
      toast.error("Failed to rewrite script");
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRewriteScript = async () => {
    if (!script.trim()) return;

    setIsRewriting(true);
    try {
      // TODO: Implement actual AI rewrite functionality
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      toast.success("Script rewritten!");
    } catch {
      toast.error("Failed to rewrite script");
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <Card className="bg-background/95 border shadow-lg backdrop-blur-sm">
        <CardContent className="p-2">
          <div className="flex items-center gap-1">
            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !script.trim()}
              className="h-8 px-3"
            >
              <Save className="mr-1 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>

            {/* Download Button */}
            <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!script.trim()} className="h-8 px-3">
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Voice Selection & Rewrite Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isRewriting} className="h-8 px-3">
                  <Mic className="mr-1 h-4 w-4" />
                  {currentVoice}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Voice Selection */}
                {availableVoices.map((voice) => (
                  <DropdownMenuItem
                    key={voice}
                    onClick={() => handleChangeVoice(voice)}
                    className={voice === currentVoice ? "bg-accent" : ""}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {voice} Voice
                    {voice === currentVoice && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                {/* Rewrite with Voice Options */}
                {availableVoices.map((voice) => (
                  <DropdownMenuItem
                    key={`rewrite-${voice}`}
                    onClick={() => handleRewriteWithVoice(voice)}
                    disabled={!script.trim()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rewrite as {voice}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Tools Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isRewriting || !script.trim()} className="h-8 px-3">
                  <Sparkles className="mr-1 h-4 w-4" />
                  AI Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRewriteScript}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rewrite Script
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Hook")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve Hook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("CTA")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Strengthen CTA
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewriteWithVoice("Flow")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve Flow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Keyboard Shortcuts Indicator */}
            <div className="text-muted-foreground ml-2 flex items-center gap-1 text-xs">
              <kbd className="bg-muted rounded px-1.5 py-0.5">⌘S</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
