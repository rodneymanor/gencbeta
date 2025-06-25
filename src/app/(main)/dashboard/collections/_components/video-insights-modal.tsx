"use client";

import { useState } from "react";

import { Copy, ExternalLink, Lightbulb, Play, Shuffle, User } from "lucide-react";
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
import { Label } from "@/components/ui/label";

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
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-none overflow-hidden sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        <DialogHeader className="pb-4 lg:pb-6">
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

        <div className="flex-1 overflow-auto">
          <div className="space-y-6">
            {/* Hook Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hook Details</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Hook:</Label>
                  <div className="bg-muted/50 mt-2 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">{video.components.hook}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Hook Type:</Label>
                  <Badge variant="outline" className="mt-2">
                    Pattern Recognition
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Shuffle className="h-4 w-4" />
                    Remix Hook
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(video.components.hook, "Hook")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Metrics & Analysis */}
            <div className="space-y-6">
              {/* Metrics Grid */}
              <VideoMetricsGrid insights={video.insights} />

              {/* Script Components */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Script Breakdown</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Bridge:</Label>
                      <div className="bg-muted/50 mt-2 rounded-lg p-3">
                        <p className="text-sm">{video.components.bridge}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-auto p-1"
                          onClick={() => copyToClipboard(video.components.bridge, "Bridge")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Golden Nugget:</Label>
                      <div className="bg-muted/50 mt-2 rounded-lg p-3">
                        <p className="text-sm">{video.components.nugget}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-auto p-1"
                          onClick={() => copyToClipboard(video.components.nugget, "Golden Nugget")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Call to Action:</Label>
                      <div className="bg-muted/50 mt-2 rounded-lg p-3">
                        <p className="text-sm">{video.components.wta}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-auto p-1"
                          onClick={() => copyToClipboard(video.components.wta, "Call to Action")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Full Transcript:</Label>
                      <div className="bg-muted/50 mt-2 max-h-24 overflow-y-auto rounded-lg p-3">
                        <p className="text-sm">{video.transcript}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-auto p-1"
                          onClick={() => copyToClipboard(video.transcript, "Transcript")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Analysis */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visual Context</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{video.visualContext}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-auto p-1"
                    onClick={() => copyToClipboard(video.visualContext, "Visual Context")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
                <Button variant="default" className="gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Generate Ideas
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
