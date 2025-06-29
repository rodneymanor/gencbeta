"use client";

import { useRef, useEffect } from "react";

import { ArrowUp, Mic, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

import { RefinementControls } from "./types";

interface ScriptChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  refinementControls: RefinementControls;
  onRefinementChange: (controls: RefinementControls) => void;
}

export function ScriptChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  refinementControls,
  onRefinementChange,
}: ScriptChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 200)}px`;
    };

    textarea.addEventListener("input", adjustHeight);
    adjustHeight(); // Initial adjustment

    return () => textarea.removeEventListener("input", adjustHeight);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled && value.trim()) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmit = () => {
    if (!disabled && value.trim()) {
      onSubmit();
    }
  };

  const toneOptions = ["Professional", "Casual", "Friendly", "Authoritative", "Conversational"];
  const voiceEngineOptions = ["Neural TTS", "Standard TTS", "Premium Voice", "Custom Voice"];
  const scriptLengthOptions = [
    { value: "20", label: "20s" },
    { value: "60", label: "60s" },
    { value: "90", label: "90s" },
  ];

  return (
    <div className="bg-background w-full border-t p-3">
      <div className="border-border bg-card rounded-lg border shadow-sm">
        <div className="flex w-full flex-col">
          {/* Main input area */}
          <div className="flex items-start gap-2 p-3">
            {/* Left side dropdowns */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Tone of Voice */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted border-border h-8 border px-3 text-sm font-medium"
                  >
                    {refinementControls.toneOfVoice}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {toneOptions.map((tone) => (
                    <DropdownMenuItem
                      key={tone}
                      onClick={() => onRefinementChange({ ...refinementControls, toneOfVoice: tone })}
                      className="text-sm"
                    >
                      {tone}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Voice Engine */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted border-border h-8 border px-3 text-sm font-medium"
                  >
                    {refinementControls.voiceEngine}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {voiceEngineOptions.map((engine) => (
                    <DropdownMenuItem
                      key={engine}
                      onClick={() => onRefinementChange({ ...refinementControls, voiceEngine: engine })}
                      className="text-sm"
                    >
                      {engine}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Script Length */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted border-border h-8 border px-3 text-sm font-medium"
                  >
                    {scriptLengthOptions.find((opt) => opt.value === refinementControls.scriptLength)?.label ?? "20s"}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  {scriptLengthOptions.map((length) => (
                    <DropdownMenuItem
                      key={length.value}
                      onClick={() => onRefinementChange({ ...refinementControls, scriptLength: length.value })}
                      className="text-sm"
                    >
                      {length.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Textarea */}
            <div className="min-w-0 flex-1">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me to adjust the tone, add details, or make changes..."
                className="placeholder:text-muted-foreground max-h-[120px] min-h-[40px] resize-none border-0 bg-transparent p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
                disabled={disabled}
              />
            </div>

            {/* Right side buttons */}
            <div className="flex shrink-0 items-center gap-1">
              {/* Microphone */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                disabled={disabled}
              >
                <Mic size={16} />
              </Button>

              {/* Submit button */}
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={disabled || !value.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 w-8 disabled:opacity-50"
              >
                <ArrowUp size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
