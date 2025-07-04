"use client";

import { useState } from "react";

import { Bookmark, BookmarkCheck, X, Heart, MessageCircle, Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContentIdea } from "@/types/ghost-writer";

interface GhostWriterCardProps {
  idea: ContentIdea;
  onSave?: (ideaId: string) => void;
  onDismiss?: (ideaId: string) => void;
  onUse?: (idea: ContentIdea) => void;
  isSaved?: boolean;
  className?: string;
}

export function GhostWriterCard({ idea, onSave, onDismiss, onUse, isSaved = false, className }: GhostWriterCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (isLoading || !onSave) return;
    setIsLoading(true);
    try {
      await onSave(idea.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (isLoading || !onDismiss) return;
    setIsLoading(true);
    try {
      await onDismiss(idea.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUse = () => {
    if (onUse) {
      onUse(idea);
    }
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
        "border-border/50 bg-card hover:shadow-subtle hover:ring-border/50 focus-visible:ring-primary/50 divide-border/50 relative flex w-full max-w-lg cursor-pointer flex-col gap-3 divide-y overflow-hidden rounded-xl border p-4 transition-all duration-200 select-none hover:scale-[1.02] hover:ring-1 focus-visible:ring-2 focus-visible:outline-none",
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
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={isLoading || isSaved}
          >
            {isSaved ? <BookmarkCheck className="text-primary h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Script content */}
      <div className="text-foreground line-clamp-10 pb-3 text-sm leading-tight whitespace-pre-wrap">
        {(idea as ContentIdea & { script?: string }).script ?? idea.hook}
      </div>

      {/* Engagement metrics */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center space-x-6">
          <button className="text-muted-foreground hover:text-destructive flex items-center space-x-2 transition-colors">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.likes.toLocaleString()}</span>
          </button>

          <button className="text-muted-foreground hover:text-primary flex items-center space-x-2 transition-colors">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.comments}</span>
          </button>

          <button className="text-muted-foreground hover:text-primary flex items-center space-x-2 transition-colors">
            <Share className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.shares}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
