"use client";

import { AIVoice } from "@/types/ai-voices";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceCardProps {
  voice: AIVoice;
  onUseVoice: () => void;
  onShowExamples: () => void;
  onDeleteVoice?: () => void;
  showDeleteButton?: boolean;
}

export function VoiceCard({
  voice,
  onUseVoice,
  onShowExamples,
  onDeleteVoice,
  showDeleteButton = false,
}: VoiceCardProps) {
  return (
    <Card
      className={cn("relative transition-all duration-200 hover:shadow-md", voice.isActive && "ring-primary ring-2")}
    >
      {/* Active Indicator */}
      {voice.isActive && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Active
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg leading-tight font-semibold">{voice.name}</h3>
            {voice.creatorInspiration && (
              <p className="text-muted-foreground text-sm">Inspired by {voice.creatorInspiration}</p>
            )}
          </div>

          {/* More Actions Menu */}
          {showDeleteButton && onDeleteVoice && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          {voice.badges.map((badge, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {badge}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-muted-foreground text-sm leading-relaxed">{voice.description}</p>

        {/* Template Count */}
        <div className="text-muted-foreground mt-3 text-xs">
          {voice.templates?.length || 0} templates • {voice.exampleScripts?.length || 0} examples
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button onClick={onUseVoice} className="flex-1" disabled={voice.isActive}>
          {voice.isActive ? "Active Voice" : "Use This Voice"}
        </Button>

        <Button variant="outline" size="sm" onClick={onShowExamples} className="flex items-center gap-1">
          <Play className="h-3 w-3" />
          Examples
        </Button>
      </CardFooter>
    </Card>
  );
}
