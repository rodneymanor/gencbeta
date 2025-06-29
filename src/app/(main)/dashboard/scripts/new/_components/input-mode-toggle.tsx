"use client";

import { useState } from "react";

import { Type, Video, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const PlatformList = () => {
  const supportedPlatforms: PlatformInfo[] = [
    { name: "TikTok", color: "bg-pink-500", available: true, example: "tiktok.com/@user/video/123" },
    {
      name: "Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      available: true,
      example: "instagram.com/reel/ABC123",
    },
    { name: "YouTube", color: "bg-red-500", available: false, example: "youtube.com/watch?v=ABC123" },
  ];

  return (
    <div className="bg-muted/30 rounded-lg border p-4">
      <h4 className="mb-3 text-sm font-medium">Supported Platforms</h4>
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

      {/* Input Content */}
      {inputMode === "text" ? (
        <div className="relative">
          <Textarea
            placeholder="My script ideas for the day is..."
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[200px] resize-none pr-16 text-base leading-relaxed"
            disabled={disabled}
          />
          <Button
            onClick={onSubmit}
            disabled={finalSubmitDisabled}
            size="sm"
            className="absolute right-4 bottom-4 h-10 w-10 p-0"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="https://www.tiktok.com/@user/video/123..."
              value={videoUrl}
              onChange={(e) => onVideoUrlChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pr-16 text-base"
              disabled={disabled}
            />
            <Button
              onClick={onSubmit}
              disabled={finalSubmitDisabled}
              size="sm"
              className="absolute right-4 bottom-3 h-10 w-10 p-0"
            >
              <ExternalLink className="h-5 w-5" />
            </Button>
          </div>

          {/* URL Validation Feedback */}
          {videoUrl && (
            <div className="space-y-2">
              {urlValidation.error ? (
                <p className="text-destructive text-sm">{urlValidation.error}</p>
              ) : urlValidation.platform ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {urlValidation.platform} detected
                  </Badge>
                  <span className="text-muted-foreground text-sm">Ready to process</span>
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
