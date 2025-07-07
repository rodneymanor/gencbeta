import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { Video } from "@/lib/collections";

interface InsightHeaderProps {
  video: Video;
}

export function InsightHeader({ video }: InsightHeaderProps) {
  const author = video.metadata?.author;

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 p-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={author?.avatarUrl} alt={author?.name} />
          <AvatarFallback>{author?.name?.charAt(0) ?? "A"}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h2 className="text-2xl font-bold tracking-tight">{video.title ?? "Video Title"}</h2>
          <p className="text-muted-foreground">
            by {author?.name ?? "Unknown Author"} (@{author?.username ?? "unknown"})
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={video.originalUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Original
          </a>
        </Button>
      </div>
    </div>
  );
} 