"use client";

import { VideoInsightsModalRedesigned } from "./video-insights-modal-redesigned";
import type { VideoWithPlayer } from "./collections-helpers";

interface VideoInsightsDashboardProps {
  video: VideoWithPlayer;
  children: React.ReactNode;
}

export function VideoInsightsDashboard({ video, children }: VideoInsightsDashboardProps) {
  return (
    <VideoInsightsModalRedesigned video={video}>
      {children}
    </VideoInsightsModalRedesigned>
  );
} 