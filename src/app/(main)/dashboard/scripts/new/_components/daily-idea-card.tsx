"use client";

import { Wand2, Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { DailyIdea, getSourceIcon, getSourceColor } from "./types";

interface DailyIdeaCardProps {
  idea: DailyIdea;
  onMagicWand: (idea: DailyIdea) => void;
  onBookmark: (ideaId: string) => void;
}

export function DailyIdeaCard({ idea, onMagicWand, onBookmark }: DailyIdeaCardProps) {
  const SourceIcon = getSourceIcon(idea.source);

  return (
    <Card className="group transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={`text-xs capitalize ${getSourceColor(idea.source)}`}>
              <SourceIcon className="mr-1 h-3 w-3" />
              {idea.source === "google-trends" ? "Google Trends" : idea.source}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {idea.category}
            </Badge>
          </div>

          <p
            className="overflow-hidden text-sm leading-relaxed"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {idea.text}
          </p>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBookmark(idea.id)}
              className={`h-8 w-8 p-0 ${idea.isBookmarked ? "text-yellow-500" : ""}`}
            >
              <Bookmark className={`h-4 w-4 ${idea.isBookmarked ? "fill-current" : ""}`} />
            </Button>

            <Button
              size="sm"
              onClick={() => onMagicWand(idea)}
              className="gap-2 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Wand2 className="h-4 w-4" />
              Script
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
