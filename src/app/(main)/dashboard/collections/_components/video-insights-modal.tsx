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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          {/* Main Split Layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Side - Hook Details */}
            <div className="space-y-6">
              {/* Hook Details Card */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hook Details</h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm font-medium">Hook:</Label>
                    <div className="bg-muted/30 mt-2 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">{video.components.hook}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm font-medium">Hook Type:</Label>
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Curiosity Spike
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm font-medium">Enter topic</Label>
                    <Input placeholder="Enter topic" className="mt-2" />
                  </div>

                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    <Shuffle className="mr-2 h-4 w-4" />
                    Remix Hook
                  </Button>
                </div>
              </div>

              {/* Remix Idea Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Remix Idea</h3>
                <div className="bg-muted/30 flex min-h-[120px] items-center justify-center rounded-lg p-4">
                  <div className="space-y-2 text-center">
                    <Lightbulb className="mx-auto h-8 w-8 text-blue-600" />
                    <p className="text-muted-foreground text-sm">Brainstorm similar ideas based on your brand</p>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Generate Ideas
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Metrics */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Metrics</h3>

              {/* Metrics Grid - 2 rows, 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{video.insights.likes.toLocaleString()}</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>♥</span> Likes
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{video.insights.comments}</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>💬</span> Comments
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{video.insights.shares}</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>↗</span> Shares
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{(video.insights.views / 1000).toFixed(1)}K</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>👁</span> Views
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{video.insights.saves}</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>🔖</span> Saves
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{video.insights.engagementRate.toFixed(2)}%</div>
                  <div className="mt-1 flex items-center justify-center gap-1 text-sm text-blue-600">
                    <span>📊</span> Engagement Rate
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Caption and Transcription */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Caption */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Caption</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(video.contentMetadata.description, "Caption")}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{video.contentMetadata.description || video.visualContext}</p>
              </div>
            </div>

            {/* Transcription */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Transcription</h3>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
                    Duration: {Math.round(video.duration ?? 30)} secs
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(video.transcript, "Transcription")}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-muted/30 max-h-48 overflow-y-auto rounded-lg p-4">
                <p className="text-sm leading-relaxed">{video.transcript}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
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
      </DialogContent>
    </Dialog>
  );
}
