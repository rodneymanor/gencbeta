/* eslint-disable complexity */
/* eslint-disable max-lines */
"use client";

import { useState } from "react";

import {
  Heart,
  MessageCircle,
  Share,
  Eye,
  Bookmark,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { VideoWithPlayer } from "./collections-helpers";

interface VideoInsightsDashboardProps {
  video: VideoWithPlayer;
  children: React.ReactNode;
}

export function VideoInsightsDashboard({ video, children }: VideoInsightsDashboardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [remixTopic, setRemixTopic] = useState("");

  // Enhanced debugging: Log the complete video object structure
  console.log("🔍 [VideoInsightsDashboard] ===== VIDEO DATA ANALYSIS =====");
  console.log("🔍 [VideoInsightsDashboard] Video ID:", video.id);
  console.log("🔍 [VideoInsightsDashboard] Video title:", video.title);
  console.log("🔍 [VideoInsightsDashboard] Video platform:", video.platform);
  console.log("🔍 [VideoInsightsDashboard] Video originalUrl:", video.originalUrl);
  
  // Log all top-level properties
  console.log("🔍 [VideoInsightsDashboard] All video properties:", Object.keys(video));
  
  // Log metrics structure
  console.log("🔍 [VideoInsightsDashboard] Video metrics object:", video.metrics);
  console.log("🔍 [VideoInsightsDashboard] Metrics properties:", video.metrics ? Object.keys(video.metrics) : "No metrics");
  
  // Log metadata structure
  console.log("🔍 [VideoInsightsDashboard] Video metadata object:", video.metadata);
  console.log("🔍 [VideoInsightsDashboard] Metadata properties:", video.metadata ? Object.keys(video.metadata) : "No metadata");
  
  // Log components structure
  console.log("🔍 [VideoInsightsDashboard] Video components object:", video.components);
  console.log("🔍 [VideoInsightsDashboard] Components properties:", video.components ? Object.keys(video.components) : "No components");
  
  // Check for alternative data locations
  console.log("🔍 [VideoInsightsDashboard] Video author (direct):", (video as any).author);
  console.log("🔍 [VideoInsightsDashboard] Video likes (direct):", (video as any).likes);
  console.log("🔍 [VideoInsightsDashboard] Video views (direct):", (video as any).views);
  console.log("🔍 [VideoInsightsDashboard] Video comments (direct):", (video as any).comments);
  console.log("🔍 [VideoInsightsDashboard] Video shares (direct):", (video as any).shares);
  
  // Log the full video object for complete analysis
  console.log("🔍 [VideoInsightsDashboard] Full video object:", JSON.stringify(video, null, 2));
  console.log("🔍 [VideoInsightsDashboard] ===== END ANALYSIS =====");

  const formatNumber = (num: number | undefined): string => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleRemixHook = () => {
    if (!remixTopic.trim()) {
      toast.error("Please enter a topic to remix");
      return;
    }
    // TODO: Implement hook remix functionality
    toast.info("Hook remix feature coming soon!");
  };

  const handleGenerateIdeas = () => {
    // TODO: Implement idea generation functionality
    toast.info("Idea generation feature coming soon!");
  };

  const getHookType = (hook: string): string => {
    const hookLower = hook.toLowerCase();
    if (hookLower.includes("?")) return "Question";
    if (hookLower.includes("!")) return "Exclamation";
    if (hookLower.includes("imagine") || hookLower.includes("what if")) return "Imagination";
    if (hookLower.includes("before") || hookLower.includes("after")) return "Before/After";
    if (hookLower.includes("secret") || hookLower.includes("hidden")) return "Revelation";
    return "Curiosity Spike";
  };

  const getAuthorityBadge = (engagementRate: number | undefined): { text: string; color: string } => {
    if (!engagementRate) return { text: "N/A", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" };
    if (engagementRate >= 15) return { text: "Authority", color: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" };
    if (engagementRate >= 10) return { text: "High Engagement", color: "bg-blue-100 text-blue-800 hover:bg-blue-200" };
    if (engagementRate >= 5) return { text: "Good Engagement", color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" };
    return { text: "Standard", color: "bg-gray-100 text-gray-800 hover:bg-gray-200" };
  };

  // Enhanced engagement rate calculation with fallbacks
  const calculateEngagementRate = () => {
    // Try multiple possible data locations
    const likes = video.metrics?.likes || (video as any).likes || 0;
    const comments = video.metrics?.comments || (video as any).comments || 0;
    const shares = video.metrics?.shares || (video as any).shares || 0;
    const views = video.metrics?.views || (video as any).views || 0;
    
    console.log("🔍 [VideoInsightsDashboard] Engagement calculation:", { likes, comments, shares, views });
    
    if (views === 0) return 0;
    return ((likes + comments + shares) / views) * 100;
  };

  const authorityBadge = getAuthorityBadge(calculateEngagementRate());

  // Get author with fallbacks
  const getAuthor = () => {
    return (
      (video as any).contentMetadata?.author ||
      video.metadata?.author ||
      (video as any).author ||
      'Unknown Author'
    );
  };

  // Get views with fallbacks
  const getViews = () => {
    return video.metrics?.views || (video as any).views || 0;
  };

  // Get likes with fallbacks
  const getLikes = () => {
    return video.metrics?.likes || (video as any).likes || 0;
  };

  // Get comments with fallbacks
  const getComments = () => {
    return video.metrics?.comments || (video as any).comments || 0;
  };

  // Get shares with fallbacks
  const getShares = () => {
    return video.metrics?.shares || (video as any).shares || 0;
  };

  // Get hashtags with fallbacks
  const getHashtags = () => {
    return (
      (video as any).contentMetadata?.hashtags ||
      video.metadata?.hashtags ||
      (video as any).hashtags ||
      []
    );
  };

  // Get saves with fallbacks
  const getSaves = () => {
    return video.metrics?.saves || (video as any).saves || 0;
  };

  // Get description with fallbacks (caption)
  const getDescription = () => {
    return (
      (video as any).contentMetadata?.description ||
      video.metadata?.description ||
      video.visualContext ||
      (video as any).description ||
      'No description available'
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="!max-w-[1200px] max-h-[95vh] overflow-y-auto p-0 bg-background">
        <DialogTitle className="sr-only">Video Insights - {video.title}</DialogTitle>
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-foreground">{getAuthor()}</h1>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <span className="font-medium">{formatNumber(getViews())} Views</span>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">
                  Published on {formatDate(video.addedAt)}
                </span>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {video.platform.toLowerCase()}
                  </Badge>
                  {getHashtags().slice(0, 2).map((hashtag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      {hashtag}
                    </Badge>
                  ))}
                </div>
                <Badge className={authorityBadge.color}>{authorityBadge.text}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-4 space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base">Hook Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Hook:</div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {video.components?.hook || 'No hook available'}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Hook Type:</div>
                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 text-xs">
                      {getHookType(video.components?.hook || '')}
                    </Badge>
                  </div>
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter topic"
                        value={remixTopic}
                        onChange={(e) => setRemixTopic(e.target.value)}
                        className="flex-1 text-sm border-border focus:border-primary focus:ring-primary"
                      />
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleRemixHook}>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Remix
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base">Remix Idea</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2 text-sm">
                      Brainstorm similar ideas based on your brand
                    </h3>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleGenerateIdeas}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generate Ideas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="col-span-8 space-y-4">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base">Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{formatNumber(getLikes())}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3" />
                        <span>Likes</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{formatNumber(getComments())}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-3 h-3" />
                        <span>Comments</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{formatNumber(getShares())}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Share className="w-3 h-3" />
                        <span>Shares</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{formatNumber(getViews())}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        <span>Views</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{formatNumber(getSaves())}</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Bookmark className="w-3 h-3" />
                        <span>Saves</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{calculateEngagementRate().toFixed(2)}%</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>Engagement Rate</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground text-base">Caption</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(getDescription(), "Caption")}
                      >
                        {copiedField === "Caption" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {getDescription()}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground text-base">Transcription</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Duration: {video.duration || 0}s</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => copyToClipboard(video.transcript || '', "Transcript")}
                        >
                          {copiedField === "Transcript" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
                      {video.transcript || 'No transcript available'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Script Components */}
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground text-base">Script Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground leading-relaxed">
                  <div>
                    <span className="font-medium text-muted-foreground">Bridge: </span>
                    {video.components?.bridge || 'No bridge available'}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Golden Nugget: </span>
                    {video.components?.nugget || 'No golden nugget available'}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">WTA: </span>
                    {video.components?.wta || 'No WTA available'}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open(video.originalUrl || '#', "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original
                </Button>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 