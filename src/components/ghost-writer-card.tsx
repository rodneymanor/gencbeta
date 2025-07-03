"use client";

import { useState } from "react";

import { Bookmark, BookmarkCheck, X } from "lucide-react";

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

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col gap-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-gray-200 hover:shadow-lg",
        className,
      )}
    >
      {/* Action buttons - minimal and subtle */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
          onClick={handleSave}
          disabled={isLoading || isSaved}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4 text-blue-500" /> : <Bookmark className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
          onClick={handleDismiss}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {/* Complete script - main content, prominent */}
        <div className="line-clamp-6 text-base leading-relaxed font-medium whitespace-pre-line text-gray-900">
          {(idea as any).script ?? idea.hook}
        </div>
      </div>

      {/* Footer with action */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">{idea.estimatedDuration}s</span>
          <span className="text-xs text-gray-300">•</span>
          <span className="text-xs text-gray-400 capitalize">{idea.difficulty}</span>
        </div>

        <Button
          onClick={handleUse}
          size="sm"
          variant="ghost"
          className="h-8 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Use Idea
        </Button>
      </div>
    </div>
  );
}
