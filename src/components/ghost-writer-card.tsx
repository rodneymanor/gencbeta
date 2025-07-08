"use client";

import { useState } from "react";

import { Bookmark, BookmarkCheck, X, Heart, MessageCircle, Share, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContentIdea } from "@/types/ghost-writer";

interface GhostWriterCardProps {
  idea: ContentIdea;
  onSave?: (ideaId: string, action: "save" | "dismiss") => void;
  onDismiss?: (ideaId: string) => void;
  onUse?: (idea: ContentIdea) => void;
  isSaved?: boolean;
  className?: string;
}

export function GhostWriterCard({ idea, onSave, onDismiss, onUse, isSaved = false, className }: GhostWriterCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveToggle = async () => {
    if (isLoading || !onSave) return;
    setIsLoading(true);
    try {
      await onSave(idea.id, isSaved ? "dismiss" : "save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUse = () => {
    if (onUse) {
      onUse(idea);
    }
  };

  // Helper to remove descriptive labels from AI output
  const cleanContent = (raw: string): string => {
    if (!raw) return "";

    // Define regex to remove leading labels like "Hook:", "Bridge:", "Golden Nugget:", "WTA:", "Idea 1:" etc.
    const labelPattern = /^\s*(hook|bridge|golden[\s-]?nugget|wta|idea)\s*\d*\s*[:\-–]?\s*/i;

    // Split into lines and clean each line
    return raw
      .split(/\n+/)
      .map((line) => line.replace(labelPattern, "").trim())
      .filter((line) => line.length > 0)
      .join("\n");
  };

  // Generate mock engagement metrics for visual appeal
  const engagement = {
    likes: Math.floor(Math.random() * 2000) + 500,
    comments: Math.floor(Math.random() * 150) + 20,
    shares: Math.floor(Math.random() * 100) + 10,
  };

  return (
    <div
      className={cn(
        "bg-card text-card-foreground divide-border/50 focus-visible:ring-primary/50 focus-visible:ring-offset-background flex w-full max-w-lg cursor-pointer flex-col gap-3 divide-y overflow-hidden rounded-xl p-4 shadow-md transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      onClick={handleUse}
      tabIndex={0}
    >
      {/* Header with profile and actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text font-semibold text-transparent">
              Ghost Writer
            </span>
            <span className="text-muted-foreground text-sm">suggests</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-muted-foreground hover:text-primary h-8 w-8 p-0", isSaved && "text-primary")}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle();
            }}
            disabled={isLoading}
          >
            {isSaved ? <Star fill="currentColor" className="h-4 w-4" /> : <Star className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Script content */}
      <div className="py-3">
        <div className="text-foreground line-clamp-6 text-sm leading-relaxed whitespace-pre-wrap">
          {cleanContent((idea as ContentIdea & { script?: string }).script ?? idea.hook)}
        </div>
      </div>

      {/* Placeholder engagement metrics */}
      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          <span>{engagement.likes.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          <span>{engagement.comments.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Share className="h-3 w-3" />
          <span>{engagement.shares.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
