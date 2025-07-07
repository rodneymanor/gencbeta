import React from "react";
import type { Video } from "@/lib/collections";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InsightContentProps {
  video: Video;
}

export function InsightContent({ video }: InsightContentProps) {
  const transcript = video.transcription;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Content Analysis</h3>
      <Card className="p-4">
        <h4 className="font-semibold">Transcript</h4>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border bg-background p-2">
          <p className="text-sm font-mono whitespace-pre-wrap">{transcript ?? "Transcript not available."}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            Remix Transcript
          </Button>
          <Button variant="outline" size="sm">
            Find Viral Hooks
          </Button>
        </div>
      </Card>
    </div>
  );
} 