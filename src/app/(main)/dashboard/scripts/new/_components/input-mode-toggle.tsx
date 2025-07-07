"use client";

import { Type, Video, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { IdeaInboxDialog } from "./idea-inbox-dialog";

export type InputMode = "text" | "video";

export interface InputModeToggleProps {
  inputMode: InputMode;
  onInputModeChange: (mode: InputMode) => void;
  textValue: string;
  onTextChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  showIdeaInbox?: boolean;
}

interface UrlValidation {
  isValid: boolean;
  platform: string | null;
  error?: string;
}

interface TabProps {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface PlatformInfo {
  name: string;
  color: string;
  available: boolean;
  example: string;
}

const detectVideoPlatform = (url: string): string | null => {
  if (!url) return null;
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes("tiktok.com")) return "tiktok";
  if (normalizedUrl.includes("instagram.com")) return "instagram";
  if (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")) return "youtube";

  return null;
};

const validateUrl = (url: string): UrlValidation => {
  if (!url.trim()) {
    return { isValid: false, platform: null };
  }

  const platform = detectVideoPlatform(url);

  if (!platform) {
    return {
      isValid: false,
      platform: null,
      error: "Only TikTok, Instagram, and YouTube URLs are supported",
    };
  }

  if (platform === "youtube") {
    return {
      isValid: false,
      platform,
      error: "YouTube support coming soon",
    };
  }

  return { isValid: true, platform };
};

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
    if (inputMode === "text") {
      return "Describe your video idea and we'll help you script it";
    }
    return "Provide a video URL to transcribe and create a new script from it";
  };

  return <p className="text-muted-foreground text-sm leading-relaxed">{getDescription(mode)}</p>;
};

const PlatformList = () => {
  const supportedPlatforms: PlatformInfo[] = [
    { name: "TikTok", color: "bg-pink-500", available: true, example: "tiktok.com/@username/video/7123456789" },
    {
      name: "Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      available: true,
      example: "instagram.com/reel/CAbCdEfGhIj",
    },
    { name: "YouTube", color: "bg-red-500", available: false, example: "youtube.com/watch?v=dQw4w9WgXcQ" },
  ];

  return (
    <div className="bg-muted/30 rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-medium">Supported Platforms for Transcription</h4>
      <div className="space-y-2">
        {supportedPlatforms.map((platform) => (
          <div key={platform.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${platform.color} ${!platform.available && "opacity-50"}`} />
              <span className={`text-sm ${!platform.available && "text-muted-foreground"}`}>
                {platform.name}
                {!platform.available && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Coming Soon
                  </Badge>
                )}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">{platform.example}</span>
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        We&apos;ll extract the audio, transcribe the speech, and help you create a new script based on the content.
      </p>
    </div>
  );
};

export function InputModeToggle({
  inputMode,
  onInputModeChange,
  textValue,
  onTextChange,
  videoUrl,
  onVideoUrlChange,
  onSubmit,
  disabled = false,
  showIdeaInbox = false,
}: InputModeToggleProps) {
  const urlValidation = validateUrl(videoUrl);
  const finalSubmitDisabled = disabled || (inputMode === "text" ? !textValue.trim() : !urlValidation.isValid);

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
            isActive={inputMode === "text"}
            icon={<Type className="mr-2 inline h-4 w-4" />}
            label="Text Idea"
            onClick={() => onInputModeChange("text")}
          />
          <div className="bg-border mx-6 h-4 w-px" />
          <TabButton
            isActive={inputMode === "video"}
            icon={<Video className="mr-2 inline h-4 w-4" />}
            label="Video URL"
            onClick={() => onInputModeChange("video")}
          />
        </div>

        {/* Mode Description */}
        <ModeDescription mode={inputMode} />
      </div>

      {/* Input Content */}
      {inputMode === "text" ? (
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="My script idea is about productivity tips for remote workers..."
              value={textValue}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-border/50 dark:border-border/50 ring-border/50 dark:ring-border/50 focus:ring-primary/70 dark:focus:ring-primary/70 caret-primary selection:bg-primary/30 selection:text-foreground scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent block h-14 max-h-[45vh] min-h-[56px] w-full resize-none appearance-none rounded-2xl border px-4 py-3 pr-16 text-base leading-6 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-colors transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),0_4px_12px_rgba(0,0,0,0.12)] focus:ring-2 focus:ring-offset-0 focus-visible:outline-none sm:max-h-[25vh] lg:max-h-[40vh]"
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
            <Button
              onClick={onSubmit}
              disabled={finalSubmitDisabled}
              size="sm"
              className="absolute top-1/2 right-3 h-8 w-8 -translate-y-1/2 p-0 shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          {showIdeaInbox && (
            <div className="flex justify-center">
              <IdeaInboxDialog />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="https://www.tiktok.com/@user/video/123456789..."
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-background dark:bg-background text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground border-border/50 dark:border-border/50 ring-border/50 dark:ring-border/50 focus:ring-primary/70 dark:focus:ring-primary/70 caret-primary selection:bg-primary/30 selection:text-foreground block h-14 w-full appearance-none rounded-2xl border px-4 py-3 pr-12 text-base leading-6 shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-colors transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.12),0_4px_12px_rgba(0,0,0,0.12)] focus:ring-2 focus:ring-offset-0 focus-visible:outline-none"
              disabled={disabled}
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            />
            <Button
              onClick={onSubmit}
              disabled={finalSubmitDisabled}
              size="sm"
              className="absolute top-1/2 right-3 h-8 w-8 -translate-y-1/2 p-0 shadow-sm"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>

          {/* URL Validation Feedback */}
          {videoUrl && (
            <div className="space-y-2">
              {urlValidation.error ? (
                <p className="text-destructive text-sm">{urlValidation.error}</p>
              ) : urlValidation.platform ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 capitalize">
                    {urlValidation.platform} detected
                  </Badge>
                  <span className="text-muted-foreground text-sm">Ready to transcribe and script</span>
                </div>
              ) : null}
            </div>
          )}

          {/* Supported Platforms Info */}
          <PlatformList />
        </div>
      )}
    </div>
  );
}
