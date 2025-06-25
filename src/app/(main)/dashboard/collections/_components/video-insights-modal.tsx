"use client";

import { useState } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { VideoInsightsTabs } from "./video-insights-tabs";

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
}

interface VideoInsightsModalProps {
  video: VideoData;
  children: React.ReactNode;
}

export function VideoInsightsModal({ video, children }: VideoInsightsModalProps) {
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold">{video.title}</DialogTitle>
              <DialogDescription className="mt-1">
                by {video.author} • Added {new Date(video.addedAt).toLocaleDateString()}
              </DialogDescription>
            </div>
            <Badge className={getPlatformColor(video.platform)}>{video.platform}</Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <VideoInsightsTabs video={video} copiedField={copiedField} onCopyToClipboard={copyToClipboard} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
