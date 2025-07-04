"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Bookmark, BookmarkCheck, X, Heart, MessageCircle, Share, Sparkles } from "lucide-react";

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
  const router = useRouter();

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
        "relative flex w-full max-w-lg flex-col gap-3 overflow-hidden rounded-lg border bg-white p-4 shadow-sm",
        className,
      )}
    >
      {/* Header with profile and actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#22223b] to-[#4a4e69] shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-[#22223b] to-[#4a4e69] bg-clip-text font-semibold text-transparent">
              Ghost Writer
            </span>
            <span className="text-sm text-gray-500">suggests</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleSave}
            disabled={isLoading || isSaved}
          >
            {isSaved ? <BookmarkCheck className="h-4 w-4 text-blue-500" /> : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Script content */}
      <div className="line-clamp-10 text-sm leading-tight whitespace-pre-wrap text-gray-800">
        {(idea as ContentIdea & { script?: string }).script ?? idea.hook}
      </div>

      {/* Engagement metrics */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <div className="flex items-center space-x-6">
          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-red-500">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.likes.toLocaleString()}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-blue-500">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.comments}</span>
          </button>

          <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-green-500">
            <Share className="h-4 w-4" />
            <span className="text-sm font-medium">{engagement.shares}</span>
          </button>
        </div>

        <Button
          onClick={handleUse}
          size="sm"
          variant="ghost"
          className="h-8 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          Use Script
        </Button>
      </div>
    </div>
  );
}
