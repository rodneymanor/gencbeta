"use client";

import { useState } from "react";

import { Type, Video, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type InputMode = "text" | "video";

interface InputModeToggleProps {
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  textValue: string;
  onTextChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (url: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isSubmitDisabled: boolean;
  onSubmit: () => void;
}

const supportedPlatforms = [
  { name: "TikTok", example: "tiktok.com/@username/video/123...", color: "bg-pink-500" },
  { name: "Instagram", example: "instagram.com/p/ABC123...", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { name: "YouTube", example: "youtube.com/watch?v=abc123...", color: "bg-red-500", comingSoon: true },
];

const detectPlatform = (url: string): string | null => {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes("tiktok.com")) return "tiktok";
  if (normalizedUrl.includes("instagram.com")) return "instagram";
  if (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")) return "youtube";

  return null;
};

const validateVideoUrl = (url: string): { isValid: boolean; platform: string | null; error?: string } => {
  if (!url.trim()) {
    return { isValid: false, platform: null };
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch {
    return { isValid: false, platform: null, error: "Please enter a valid URL" };
  }

  const platform = detectPlatform(url);

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

export function InputModeToggle({
  inputMode,
  setInputMode,
  textValue,
  onTextChange,
  videoUrl,
  onVideoUrlChange,
  onKeyPress,
  isSubmitDisabled,
  onSubmit,
}: InputModeToggleProps) {
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; platform: string | null; error?: string }>({
    isValid: false,
    platform: null,
  });

  const handleVideoUrlChange = (value: string) => {
    onVideoUrlChange(value);
    const validation = validateVideoUrl(value);
    setUrlValidation(validation);
  };

  const isVideoModeValid = inputMode === "video" ? urlValidation.isValid : true;
  const finalSubmitDisabled = isSubmitDisabled || (inputMode === "video" && !isVideoModeValid);

  return (
    <div className="space-y-6">
      {/* Input Mode Tabs */}
      <div className="bg-muted flex items-center space-x-1 rounded-lg p-1">
        <Button
          variant={inputMode === "text" ? "default" : "ghost"}
          size="sm"
          onClick={() => setInputMode("text")}
          className="flex-1 gap-2"
        >
          <Type className="h-4 w-4" />
          Text Idea
        </Button>
        <Button
          variant={inputMode === "video" ? "default" : "ghost"}
          size="sm"
          onClick={() => setInputMode("video")}
          className="flex-1 gap-2"
        >
          <Video className="h-4 w-4" />
          Video URL
        </Button>
      </div>

      {/* Conditional Input Rendering */}
      {inputMode === "text" ? (
        <div className="relative">
          <Textarea
            value={textValue}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={onKeyPress}
            placeholder="My script ideas for the day is..."
            className="min-h-32 resize-none p-6 pr-16 text-lg"
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
              value={videoUrl}
              onChange={(e) => handleVideoUrlChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Paste TikTok or Instagram video URL..."
              className="h-16 p-6 pr-16 text-lg"
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
          <div className="bg-muted/30 rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-medium">Supported Platforms</h4>
            <div className="space-y-2">
              {supportedPlatforms.map((platform) => (
                <div key={platform.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${platform.color}`} />
                    <span className="text-sm font-medium">{platform.name}</span>
                    {platform.comingSoon && (
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{platform.example}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { validateVideoUrl, detectPlatform };
