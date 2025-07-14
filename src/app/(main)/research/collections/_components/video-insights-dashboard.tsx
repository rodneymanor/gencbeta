"use client";

import type { VideoWithPlayer } from "./collections-helpers";
import { VideoInsightsModalRedesigned } from "./video-insights-modal-redesigned";

interface VideoInsightsDashboardProps {
  video: VideoWithPlayer;
  children: React.ReactNode;
}

export function VideoInsightsDashboard({ video, children }: VideoInsightsDashboardProps) {
  return <VideoInsightsModalRedesigned video={video}>{children}</VideoInsightsModalRedesigned>;
}
