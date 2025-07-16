"use client";

import { useState } from "react";

import { Heart, MessageCircle, Share } from "lucide-react";

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
  const [isNavigating, setIsNavigating] = useState(false);

  const handleUse = () => {
    if (onUse) {
      setIsNavigating(true);
      // Add a small delay to show the animation before action
      setTimeout(() => {
        onUse(idea);
        // Reset animation state after action completes
        setTimeout(() => {
          setIsNavigating(false);
        }, 1000);
      }, 200);
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
      data-idea-id={idea.id}
      className={cn(
        "bg-background text-foreground relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/50 shadow-md transition-all duration-300 ease-out",
        isNavigating
          ? "-translate-y-8 scale-90 transform-gpu opacity-30 shadow-2xl"
          : "translate-y-0 scale-100 transform-gpu opacity-100 hover:shadow-lg",
        className,
      )}
      tabIndex={0}
    >
      {/* Header with profile and actions */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-[#2d93ad] to-[#412722] bg-clip-text font-semibold text-transparent">
              Ghost Writer
            </span>
            <span className="text-muted-foreground text-sm">suggests</span>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs font-medium"
            onClick={(e) => {
              e.stopPropagation();
              handleUse();
            }}
          >
            Use this idea
          </Button>
        </div>
      </div>

      {/* Hook content - flexible area that pushes footer to bottom */}
      <div className="flex-1 px-4 pb-3">
        <div className="text-foreground line-clamp-6 text-sm leading-relaxed whitespace-pre-wrap">
          {cleanContent(idea.hook)}
        </div>
        {/* Hook template and strength indicators */}
        {idea.hookTemplate && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
              {idea.hookTemplate}
            </span>
            {idea.hookStrength && (
              <span className="bg-secondary/10 text-secondary-foreground rounded-full px-2 py-1 text-xs">
                {idea.hookStrength}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer with engagement metrics */}
      <div className="border-t border-border/50 bg-background px-4 py-3 mt-auto">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
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
    </div>
  );
}
