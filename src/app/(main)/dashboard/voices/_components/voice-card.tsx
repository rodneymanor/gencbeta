"use client";

import { MoreHorizontal, Play, Trash2, CheckCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AIVoice } from "@/types/ai-voices";

interface VoiceCardProps {
  voice: AIVoice;
  onUseVoice: () => void;
  onShowExamples: () => void;
  onDeleteVoice?: () => void;
  showDeleteButton?: boolean;
}

function ActiveIndicator() {
  return (
    <div className="absolute -top-2 -right-2 z-10">
      <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg">
        <CheckCircle className="h-3 w-3" />
        Active Voice
      </div>
    </div>
  );
}

function VoiceHeader({
  voice,
  showDeleteButton,
  onDeleteVoice,
}: {
  voice: AIVoice;
  showDeleteButton: boolean;
  onDeleteVoice?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg leading-tight font-semibold">{voice.name}</h3>
        {voice.creatorInspiration && (
          <p className="text-muted-foreground mt-1 text-sm leading-tight">Inspired by {voice.creatorInspiration}</p>
        )}
      </div>

      {showDeleteButton && onDeleteVoice && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDeleteVoice} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Voice
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function VoiceBadges({ badges }: { badges: string[] }) {
  return (
    <>
      {/* Platform Optimization Badge */}
      <div className="mt-3 flex items-center gap-1">
        <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 text-xs font-medium">
          <Sparkles className="mr-1 h-3 w-3" />
          Optimized for TikTok & Instagram
        </Badge>
      </div>

      {/* Voice Characteristics Badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {badges.map((badge, index) => (
          <Badge key={index} variant="secondary" className="text-xs font-medium">
            {badge}
          </Badge>
        ))}
      </div>
    </>
  );
}

function VoiceContent({
  voice,
  templateCount,
  exampleCount,
}: {
  voice: AIVoice;
  templateCount: number;
  exampleCount: number;
}) {
  return (
    <>
      {/* Sub-headline */}
      <h4 className="text-foreground mb-2 text-sm leading-tight font-medium">
        {voice.creatorInspiration ? `${voice.creatorInspiration}'s Proven Formula` : "Professional Content Template"}
      </h4>

      {/* Description - Fixed height for consistency */}
      <div className="h-16 overflow-hidden">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">{voice.description}</p>
      </div>

      {/* Template & Example Stats */}
      <div className="border-border/50 mt-4 flex items-center justify-between border-t pt-3">
        <div className="text-muted-foreground text-xs">
          <span className="font-medium">{templateCount}</span> templates
        </div>
        <div className="text-muted-foreground text-xs">
          <span className="font-medium">{exampleCount}</span> examples
        </div>
      </div>
    </>
  );
}

function VoiceActions({
  voice,
  onShowExamples,
  onUseVoice,
}: {
  voice: AIVoice;
  onShowExamples: () => void;
  onUseVoice: () => void;
}) {
  return (
    <>
      {/* View Sample Scripts Button - Now on top */}
      <Button
        variant="outline"
        onClick={onShowExamples}
        className="flex w-full items-center justify-center gap-2 font-medium"
      >
        <Play className="h-4 w-4" />
        View Sample Scripts
      </Button>

      {/* Use This Voice Button - Now below */}
      <Button onClick={onUseVoice} className="w-full font-medium" disabled={voice.isActive}>
        {voice.isActive ? "Currently Active" : "Use This Voice"}
      </Button>
    </>
  );
}

export function VoiceCard({
  voice,
  onUseVoice,
  onShowExamples,
  onDeleteVoice,
  showDeleteButton = false,
}: VoiceCardProps) {
  // Ensure consistent template and example counts for display
  const templateCount = voice.templates ? voice.templates.length : 0;
  const exampleCount = voice.exampleScripts ? voice.exampleScripts.length : 0;

  return (
    <Card
      className={cn(
        "hover:shadow-primary/5 relative flex h-full flex-col transition-all duration-200 hover:shadow-lg",
        voice.isActive && "ring-primary shadow-primary/10 shadow-lg ring-2",
      )}
    >
      {/* Active Indicator */}
      {voice.isActive && <ActiveIndicator />}

      <CardHeader className="pb-4">
        <VoiceHeader voice={voice} showDeleteButton={showDeleteButton} onDeleteVoice={onDeleteVoice} />
        <VoiceBadges badges={voice.badges} />
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <VoiceContent voice={voice} templateCount={templateCount} exampleCount={exampleCount} />
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-0">
        <VoiceActions voice={voice} onShowExamples={onShowExamples} onUseVoice={onUseVoice} />
      </CardFooter>
    </Card>
  );
}
