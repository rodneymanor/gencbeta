"use client";

import { Eye, Heart, MessageCircle, Share, Bookmark, TrendingUp, Copy, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface VideoInsightsTabsProps {
  video: VideoData;
  copiedField: string | null;
  onCopyToClipboard: (text: string, fieldName: string) => void;
}

export function VideoInsightsTabs({ video, copiedField, onCopyToClipboard }: VideoInsightsTabsProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const insightCards = [
    { icon: Eye, label: "Views", value: video.insights.views, color: "text-blue-600" },
    { icon: Heart, label: "Likes", value: video.insights.likes, color: "text-red-600" },
    { icon: MessageCircle, label: "Comments", value: video.insights.comments, color: "text-green-600" },
    { icon: Share, label: "Shares", value: video.insights.shares, color: "text-purple-600" },
    { icon: Bookmark, label: "Saves", value: video.insights.saves, color: "text-[#9a8c98]" },
    {
      icon: TrendingUp,
      label: "Engagement Rate",
      value: `${video.insights.engagementRate}%`,
      color: "text-indigo-600",
    },
  ];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="components">Script Components</TabsTrigger>
        <TabsTrigger value="transcript">Transcript</TabsTrigger>
        <TabsTrigger value="metadata">Metadata</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        {/* Insights Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {insightCards.map((insight) => {
            const Icon = insight.icon;
            return (
              <Card key={insight.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${insight.color}`} />
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">{insight.label}</p>
                      <p className="text-2xl font-bold">
                        {typeof insight.value === "number" ? formatNumber(insight.value) : insight.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Quick Components Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Script Components Preview</h3>
          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#9a8c98]">Hook</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{video.components.hook}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">Golden Nugget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{video.components.nugget}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="components" className="space-y-4">
        <div className="space-y-4">
          {[
            { key: "hook", label: "Hook", description: "Attention-grabbing opener", color: "text-[#9a8c98]" },
            { key: "bridge", label: "Bridge", description: "Connects hook to main content", color: "text-[#4a4e69]" },
            { key: "nugget", label: "Golden Nugget", description: "Core valuable insight", color: "text-[#c9ada7]" },
            { key: "wta", label: "WTA", description: "Call to action", color: "text-[#9a8c98]" },
          ].map((component) => (
            <Card key={component.key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-lg ${component.color}`}>{component.label}</CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onCopyToClipboard(video.components[component.key as keyof VideoComponents], component.label)
                    }
                  >
                    {copiedField === component.label ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{video.components[component.key as keyof VideoComponents]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="transcript" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Full Transcript</CardTitle>
              <Button variant="outline" size="sm" onClick={() => onCopyToClipboard(video.transcript, "Transcript")}>
                {copiedField === "Transcript" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{video.transcript}</p>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{video.visualContext}</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="metadata" className="space-y-4">
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground font-medium">Platform:</span>
                  <p>{video.contentMetadata.platform}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Author:</span>
                  <p>{video.contentMetadata.author}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Content Type:</span>
                  <p className="capitalize">{video.contentMetadata.source}</p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Original URL:</span>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-blue-600 hover:underline"
                  >
                    View Original
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{video.contentMetadata.description}</p>
            </CardContent>
          </Card>

          {video.contentMetadata.hashtags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Hashtags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {video.contentMetadata.hashtags.map((hashtag, index) => (
                    <Badge key={index} variant="secondary">
                      #{hashtag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
