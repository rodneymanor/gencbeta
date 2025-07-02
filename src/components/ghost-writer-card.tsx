"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, X, Sparkles, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ContentIdea, CONTENT_PILLARS } from "@/types/ghost-writer";

interface GhostWriterCardProps {
  idea: ContentIdea;
  onSave?: (ideaId: string) => void;
  onDismiss?: (ideaId: string) => void;
  onUse?: (idea: ContentIdea) => void;
  isSaved?: boolean;
  className?: string;
}

export function GhostWriterCard({
  idea,
  onSave,
  onDismiss,
  onUse,
  isSaved = false,
  className,
}: GhostWriterCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pillarInfo = CONTENT_PILLARS[idea.pillar];

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
        "group relative flex w-full flex-col gap-4 overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20",
        className,
      )}
    >
      {/* Header with pillar badge and actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs font-medium",
              pillarInfo.color.replace('bg-', 'bg-').replace('-500', '-100'),
              pillarInfo.color.replace('bg-', 'text-').replace('-500', '-700')
            )}
          >
            <span className="mr-1">{pillarInfo.icon}</span>
            {pillarInfo.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {idea.estimatedDuration}s
          </Badge>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={handleSave}
            disabled={isLoading || isSaved}
          >
            {isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2">
          {idea.title}
        </h3>

        {/* Hook */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span className="font-medium">Hook</span>
          </div>
          <p className="text-sm text-foreground/90 line-clamp-2 italic">
            "{idea.hook}"
          </p>
        </div>

        {/* Description/Outline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-3 w-3" />
            <span className="font-medium">Outline</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {idea.scriptOutline || idea.description}
          </p>
        </div>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                #{tag}
              </Badge>
            ))}
            {idea.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{idea.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="capitalize">{idea.difficulty}</span>
          <span>•</span>
          <span>{idea.targetAudience}</span>
        </div>
        
        <Button 
          onClick={handleUse}
          size="sm"
          className="h-8 px-3 text-xs font-medium"
        >
          Use Idea
        </Button>
      </div>
    </div>
  );
} 