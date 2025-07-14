"use client";

import { ExternalLink, Zap, Lightbulb } from "lucide-react";

import { ShineBorder } from "@/components/magicui/shine-border";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { IdeaInboxDialog } from "./idea-inbox-dialog";

export type InputMode = "script-writer" | "hook-generator";

export interface InputModeToggleProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  textValue: string;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  showIdeaInbox?: boolean;
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
    className={`relative px-1 pb-3 text-sm font-medium transition-colors ${
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

export function InputModeToggle({
  inputMode,
  onInputModeChange,
  textValue,
  onTextChange,
  onSubmit,
  disabled = false,
  showIdeaInbox = false,
}: InputModeToggleProps) {
  const finalSubmitDisabled = disabled || !textValue.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !finalSubmitDisabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Mode Tabs */}
      <div className="space-y-3">
        <div className="flex items-center border-b">
          <TabButton
            isActive={inputMode === "script-writer"}
            icon={<Zap className="mr-2 inline h-4 w-4" />}
            label="Script Writer"
            onClick={() => onInputModeChange("script-writer")}
          />
          <div className="bg-border mx-6 h-4 w-px" />
          <TabButton
            isActive={inputMode === "hook-generator"}
            icon={<Lightbulb className="mr-2 inline h-4 w-4" />}
            label="Hook Generator"
            onClick={() => onInputModeChange("hook-generator")}
          />
        </div>

        {/* Mode Description */}
        <ModeDescription mode={inputMode} />
      </div>

      {/* Input Content */}
      <div className="space-y-4">
        <div className="relative">
          <ShineBorder
            shineColor={["hsl(var(--primary)/0.3)", "hsl(var(--muted-foreground)/0.2)", "hsl(var(--accent)/0.25)"]}
            duration={6}
            borderWidth={1}
            className="rounded-2xl"
          >
            <Textarea
              placeholder={
                inputMode === "script-writer"
                  ? "My script idea is about productivity tips for remote workers..."
                  : "I want to create content about morning routines that boost productivity..."
              }
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-border/50 dark:border-border/50 ring-border/50 dark:ring-border/50 focus:ring-primary/70 dark:focus:ring-primary/70 caret-primary selection:bg-primary/30 selection:text-foreground scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent block h-14 max-h-[45vh] min-h-[56px] w-full resize-none appearance-none rounded-2xl border px-4 py-3 pr-16 text-base leading-6 shadow-sm transition-colors transition-shadow duration-150 hover:shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)] focus:ring-2 focus:ring-offset-0 focus-visible:outline-none sm:max-h-[25vh] lg:max-h-[40vh]"
              disabled={disabled}
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                height: "auto",
                minHeight: "56px",
                maxHeight: "45vh",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, window.innerHeight * 0.45) + "px";
              }}
            />
          </ShineBorder>
          <Button
            onClick={onSubmit}
            disabled={finalSubmitDisabled}
            size="sm"
            className="absolute top-1/2 right-3 z-10 h-8 w-8 -translate-y-1/2 p-0 shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        {showIdeaInbox && inputMode === "script-writer" && (
          <div className="flex justify-center">
            <IdeaInboxDialog />
          </div>
        )}
      </div>
    </div>
  );
}
