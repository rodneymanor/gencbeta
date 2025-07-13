"use client";

import { useState } from "react";

import { Copy, ExternalLink, Play, Shuffle, User } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ContentSections } from "./content-sections";
import { HashtagsSection } from "./hashtags-section";
import { HookDetailsSection } from "./hook-details-section";
import { VideoMetricsGrid } from "./video-metrics-grid";

interface VideoInsights {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  saves: number;
  engagementRate: number;
}

interface VideoComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

interface ContentMetadata {
  platform: string;
  author: string;
  description: string;
  source: string;
  hashtags: string[];
}

interface VideoData {
  id?: string;
  url: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  transcript: string;
  components: VideoComponents;
  contentMetadata: ContentMetadata;
  visualContext: string;
  insights: VideoInsights;
  addedAt: string;
  platform: string;
  duration?: number;
  fileSize?: number;
}

interface VideoInsightsModalProps {
  video: VideoData;
  children: React.ReactNode;
}

export function VideoInsightsModal({ video, children }: VideoInsightsModalProps) {
  const [open, setOpen] = useState(false);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "tiktok":
        return "bg-black text-white";
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "youtube":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        <DialogHeader className="flex-shrink-0 pb-4 lg:pb-6">
          <div className="space-y-3">
            <DialogTitle className="flex flex-col items-start gap-2 text-lg sm:flex-row sm:items-center sm:gap-3 sm:text-xl">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Video Insights
              </div>
              <Badge className={getPlatformColor(video.platform)}>{video.platform}</Badge>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">{video.title}</DialogDescription>
            <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {video.author}
              </span>
              <span>Duration: {Math.round(video.duration ?? 30)}s</span>
              <span>Added: {new Date(video.addedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-8 p-1">
            {/* Main Split Layout */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Left Side - Hook Details */}
              <HookDetailsSection hook={video.components.hook} />

              {/* Right Side - Metrics, Caption, and Transcription */}
              <div className="space-y-6">
                {/* Metrics */}
                <div className="bg-card rounded-lg border-2 border-gray-200 p-6 shadow-sm dark:border-gray-700">
                  <h3 className="mb-4 text-lg font-semibold">Metrics</h3>

                  {/* Metrics Grid - 2 rows, 3 columns */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{video.insights.likes.toLocaleString()}</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>♥</span> Likes
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{video.insights.comments}</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>💬</span> Comments
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{video.insights.shares}</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>↗</span> Shares
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {(video.insights.views / 1000).toFixed(1)}K
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>👁</span> Views
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">{video.insights.saves}</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>🔖</span> Saves
                      </div>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4 text-center shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {video.insights.engagementRate.toFixed(1)}%
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                        <span>📊</span> Engagement Rate
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caption and Transcription Side by Side */}
                <ContentSections
                  description={video.contentMetadata.description || video.visualContext}
                  transcript={video.transcript}
                  copyToClipboard={copyToClipboard}
                />
              </div>
            </div>

            {/* Bottom Section - Hashtags */}
            <HashtagsSection hashtags={video.contentMetadata.hashtags} copyToClipboard={copyToClipboard} />

            {/* Action Buttons Row */}
            <div className="bg-card rounded-lg border-2 border-gray-200 p-6 shadow-sm dark:border-gray-700">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Repurpose
                </Button>
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Insights
                </Button>
                <Button variant="outline" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Repurpose
                </Button>
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Insights
                </Button>
                <Button variant="outline" className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Repurpose
                </Button>
                <Button variant="outline" className="gap-2">
                  <Copy className="h-4 w-4" />
                  Insights
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => window.open(video.url, "_blank")}>
                  <ExternalLink className="h-4 w-4" />
                  View Original
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
