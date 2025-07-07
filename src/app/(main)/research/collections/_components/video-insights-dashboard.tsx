"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import type { VideoWithPlayer } from "./collections-helpers";
import { VideoEmbed } from "./video-embed";
import { InsightHeader } from "./insights/insight-header";
import { InsightStats } from "./insights/insight-stats";
import { InsightMetadata } from "./insights/insight-metadata";
import { InsightContent } from "./insights/insight-content";

interface VideoInsightsDashboardProps {
  video: VideoWithPlayer;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function VideoInsightsDashboard({ video, isOpen, onOpenChange }: VideoInsightsDashboardProps) {
  if (!video) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[1200px] max-h-[95vh] overflow-y-auto p-0 bg-background">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Video Insights Dashboard</DialogTitle>
            <DialogDescription>
              Detailed metadata and analysis for the selected video.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <InsightHeader video={video} />

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <VideoEmbed video={video} />
            </div>
            <div className="space-y-6">
              <InsightStats video={video} />
              <InsightMetadata video={video} />
            </div>
          </div>
          <InsightContent video={video} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 