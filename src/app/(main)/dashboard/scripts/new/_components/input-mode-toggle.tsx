"use client";

import { useState, useEffect, useRef, useMemo } from "react";

import { ArrowUp, Zap, Lightbulb, Plus, ChevronDown, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type InputMode = "script-writer" | "hook-generator";

export interface InputModeToggleProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  textValue: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  duration?: string;
  onDurationChange?: (duration: string) => void;
}

interface TabProps {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const TabButton = ({ isActive, icon, label, onClick }: TabProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative px-[var(--space-1)] pb-[var(--space-2)] text-sm font-medium transition-colors ${
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {icon}
    {label}
    {isActive && <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5 rounded-full" />}
  </button>
);

const ModeDescription = ({ mode }: { mode: InputMode }) => {
  const getDescription = (inputMode: InputMode): string => {
    if (inputMode === "script-writer") {
      return "Describe your video idea and we'll generate complete scripts using our fast writer workflow";
    }
    return "Enter an idea and we'll generate hook ideas to help you start your script";
  };

  return <p className="text-muted-foreground text-sm leading-relaxed">{getDescription(mode)}</p>;
};

// Sample ideas from idea inbox - in real app this would come from props or API
const sampleIdeas = [
  "10 productivity tips for remote workers",
  "Morning routines that boost energy",
  "Simple meal prep ideas for busy professionals",
  "How to stay motivated when working from home",
  "Budget-friendly home workout routines",
  "Time management techniques for entrepreneurs",
];

// Duration options
const durationOptions = [
  { value: "15", label: "15 seconds" },
  { value: "20", label: "20 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "45", label: "45 seconds" },
  { value: "60", label: "60 seconds" },
  { value: "90", label: "90 seconds" },
];

export function InputModeToggle({
  inputMode,
  onInputModeChange,
  textValue,
  onTextChange,
  onSubmit,
  disabled = false,
  duration: externalDuration,
  onDurationChange,
}: InputModeToggleProps) {
  const [isIdeaComboboxOpen, setIsIdeaComboboxOpen] = useState(false);
  const [internalDuration, setInternalDuration] = useState("30");

  // Use external duration if provided, otherwise use internal state
  const duration = externalDuration ?? internalDuration;
  const setDuration = onDurationChange ?? setInternalDuration;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Calculate submit disabled state reactively
  const finalSubmitDisabled = useMemo(() => {
    return disabled || !textValue.trim() || textValue.length > 1000;
  }, [disabled, textValue]);

  // Initialize textarea height on mount
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = "70px";
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !finalSubmitDisabled) {
      console.log("⌨️ [InputModeToggle] Keyboard shortcut triggered!");
      console.log("⌨️ [InputModeToggle] onSubmit function:", typeof onSubmit);
      e.preventDefault();
      e.stopPropagation();
      onSubmit();
    }
  };

  const handleIdeaSelect = (idea: string) => {
    onTextChange(idea);
    setIsIdeaComboboxOpen(false);
  };

  return (
    <div className="space-y-[var(--space-3)]">
      {/* Input Mode Tabs */}
      <div className="space-y-[var(--space-1)]">
        <div className="flex items-center border-b">
          <TabButton
            isActive={inputMode === "script-writer"}
            icon={<Zap className="mr-[var(--space-1)] inline h-4 w-4" />}
            label="Script Writer"
            onClick={() => onInputModeChange("script-writer")}
          />
          <div className="bg-border mx-[var(--space-3)] h-4 w-px" />
          <TabButton
            isActive={inputMode === "hook-generator"}
            icon={<Lightbulb className="mr-[var(--space-1)] inline h-4 w-4" />}
            label="Hook Generator"
            onClick={() => onInputModeChange("hook-generator")}
          />
        </div>

        {/* Mode Description */}
        <ModeDescription mode={inputMode} />
      </div>

      {/* Input Content */}
      <div
        ref={containerRef}
        className="border-border/50 space-y-[var(--space-2)] rounded-2xl border px-[var(--space-3)] pb-[10px]"
      >
        {/* Simplified Textarea */}
        <Textarea
          ref={textareaRef}
          placeholder={
            inputMode === "script-writer"
              ? "My script idea is about productivity tips for remote workers..."
              : "I want to create content about morning routines that boost productivity..."
          }
          value={textValue}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="vertical-scroll-fade-mask text-foreground placeholder:text-muted-foreground caret-primary selection:bg-primary/30 block w-full resize-none border-0 bg-transparent px-0 py-[var(--space-2)] text-base leading-6 transition-all duration-75 focus:ring-0 focus-visible:outline-none"
          disabled={disabled}
          style={
            {
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              minHeight: "70px",
            } as React.CSSProperties & { fieldSizing?: string }
          }
          onInput={(e) => {
            const el = e.currentTarget;

            // Auto-resize logic
            el.style.height = "auto";
            const maxHeight = Math.min(window.innerHeight * 0.45, 350);
            const contentHeight = el.scrollHeight;
            const newHeight = Math.min(contentHeight, maxHeight);
            el.style.height = newHeight + "px";
            el.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";

            // Also adjust container height to accommodate the textarea growth
            if (containerRef.current) {
              // Container height = textarea height + spacing + controls height + container padding
              const controlsHeight = 32; // approximate height of bottom controls
              const spacing = 16; // var(--space-2)
              const containerPadding = 0; // no vertical padding now
              const totalContainerHeight = newHeight + spacing + controlsHeight + containerPadding;
              containerRef.current.style.minHeight = totalContainerHeight + "px";
            }
          }}
        />

        {/* Bottom Controls - Positioned below textarea */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-1)]">
            {/* Character Counter */}
            <div
              className={`text-xs ${
                textValue.length > 1000
                  ? "text-destructive font-medium"
                  : textValue.length > 850
                    ? "text-orange-500"
                    : "text-muted-foreground"
              }`}
            >
              {textValue.length}/1000
            </div>

            {/* Plus Button for Idea Inbox */}
            <Popover open={isIdeaComboboxOpen} onOpenChange={setIsIdeaComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search ideas..." className="h-8" />
                  <CommandList className="max-h-48">
                    <CommandEmpty>No ideas found.</CommandEmpty>
                    <CommandGroup heading="Ideas">
                      {sampleIdeas.map((idea) => (
                        <CommandItem
                          key={idea}
                          value={idea}
                          onSelect={() => handleIdeaSelect(idea)}
                          className="cursor-pointer py-[var(--space-1)] text-sm"
                        >
                          <Check
                            className={cn(
                              "mr-[var(--space-1)] h-3 w-3",
                              textValue === idea ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {idea}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Duration Dropdown - Only show for script writer mode */}
            {inputMode === "script-writer" && (
              <Select value={duration} onValueChange={setDuration} disabled={disabled}>
                <SelectTrigger className="text-muted-foreground hover:text-foreground focus:ring-primary h-8 w-auto min-w-[120px] border-0 bg-transparent focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("🎯 [InputModeToggle] Submit button clicked!");
              console.log("🎯 [InputModeToggle] onSubmit function:", typeof onSubmit);
              console.log("🎯 [InputModeToggle] disabled:", finalSubmitDisabled);
              console.log("🎯 [InputModeToggle] textValue:", textValue);
              onSubmit();
            }}
            disabled={finalSubmitDisabled}
            size="sm"
            className="h-8 w-8 p-0 shadow-sm"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
