"use client";

import { useState, useEffect, useRef } from "react";

import {
  Copy,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  Eye,
  Bookmark,
  TrendingUp,
  Check,
  Download,
  MoreHorizontal,
  Maximize2,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { VideoWithPlayer } from "./collections-helpers";

interface VideoInsightsModalRedesignedProps {
  video: VideoWithPlayer;
  children: React.ReactNode;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VideoInsightsModalRedesigned({
  video,
  children,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: VideoInsightsModalRedesignedProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isHookExpanded, setIsHookExpanded] = useState(false);
  const [remixHooks] = useState<string[]>([
    "What if I told you there's a secret method that 95% of creators don't know about?",
    "The one thing that changed my entire content strategy overnight...",
    "I went from 0 to 100K followers in 30 days using this simple technique",
    "Why most content creators fail (and how to avoid their mistakes)",
    "The hidden algorithm hack that doubled my engagement rate",
  ]);

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
    if (!dateString) return "Unknown Date";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getPlatformColor = (platform: string) => {
    // Use minimal styling - just text, no decorative colors
    return "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100";
  };

  // Data extraction with fallbacks
  const getAuthor = () => {
    return (
      (video as any).contentMetadata?.author ?? video.metadata?.author ?? (video as any).author ?? "Unknown Author"
    );
  };

  const getViews = () => video.metrics?.views ?? (video as any).views ?? 0;
  const getLikes = () => video.metrics?.likes ?? (video as any).likes ?? 0;
  const getComments = () => video.metrics?.comments ?? (video as any).comments ?? 0;
  const getShares = () => video.metrics?.shares ?? (video as any).shares ?? 0;
  const getSaves = () => video.metrics?.saves ?? (video as any).saves ?? 0;
  const getHashtags = () => {
    return (video as any).contentMetadata?.hashtags ?? video.metadata?.hashtags ?? (video as any).hashtags ?? [];
  };
  const getDescription = () => {
    return (
      (video as any).contentMetadata?.description ??
      video.metadata?.description ??
      video.visualContext ??
      (video as any).description ??
      "No description available"
    );
  };

  const calculateEngagementRate = () => {
    const likes = getLikes();
    const comments = getComments();
    const shares = getShares();
    const views = getViews();

    if (views === 0) return 0;
    return ((likes + comments + shares) / views) * 100;
  };

  const calculateCompletionRate = () => {
    // Mock completion rate - in real implementation this would come from analytics
    return Math.floor(Math.random() * 30) + 60; // 60-90%
  };

  // Video player URL
  const playbackUrl = (video as any).iframeUrl ?? (video as any).directUrl ?? video.originalUrl ?? "";

  // KPI Metric Component
  const KPIMetric = ({
    icon,
    value,
    label,
    className = "",
  }: {
    icon: React.ReactNode;
    value: string;
    label: string;
    className?: string;
  }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="rounded bg-gray-50 p-1 dark:bg-gray-800">{icon}</div>
      <div>
        <div className="text-base font-medium text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-sm font-normal text-gray-600 dark:text-gray-400">{label}</div>
      </div>
    </div>
  );

  // Hook Remix Component
  const HookRemixCard = () => (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-800" style={{ padding: "24px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Hook</h3>
        <div className="flex" style={{ gap: "8px" }}>
          <button
            onClick={() => setIsHookExpanded(!isHookExpanded)}
            className="flex h-10 items-center gap-2 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-[0.98] dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            <Sparkles className="h-5 w-5" />
            Re-mix Hook
          </button>
          <button
            onClick={() => copyToClipboard(video.components?.hook ?? "", "Hook")}
            className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            {copiedField === "Hook" ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <p className="text-sm font-normal text-gray-900 dark:text-gray-100" style={{ lineHeight: "1.5" }}>
          {video.components?.hook ?? "No hook available"}
        </p>

        {isHookExpanded && (
          <div
            style={{
              paddingTop: "16px",
              marginTop: "16px",
              borderTop: "1px solid #E5E5E5",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Alternative Hooks:</div>
            {remixHooks.map((hook, index) => (
              <div key={index} className="rounded-xl bg-white dark:bg-gray-900" style={{ padding: "24px" }}>
                <p className="text-sm font-normal text-gray-900 dark:text-gray-100" style={{ lineHeight: "1.5" }}>
                  {hook}
                </p>
                <div className="flex" style={{ marginTop: "8px", gap: "8px" }}>
                  <button className="flex h-10 items-center gap-2 rounded-[20px] bg-transparent px-4 text-sm font-normal text-blue-600 transition-all duration-200 ease-in-out hover:bg-blue-50 active:scale-[0.98]">
                    <Copy className="h-5 w-5" />
                    Copy
                  </button>
                  <button className="flex h-10 items-center gap-2 rounded-[20px] bg-transparent px-4 text-sm font-normal text-blue-600 transition-all duration-200 ease-in-out hover:bg-blue-50 active:scale-[0.98]">
                    <Save className="h-5 w-5" />
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Keyboard navigation for up/down arrows
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && onNavigatePrevious) {
        e.preventDefault();
        onNavigatePrevious();
      } else if (e.key === "ArrowDown" && onNavigateNext) {
        e.preventDefault();
        onNavigateNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onNavigatePrevious, onNavigateNext]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="bg-background flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden p-0 sm:max-w-7xl"
        showCloseButton={false}
      >
        {/* Visually Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          Video Insights - {video.title ?? "Untitled Video"} by {getAuthor()}
        </DialogTitle>

        {/* Top Bar with Creator Metadata and KPIs */}
        <div className="border-border flex-shrink-0 border-b" style={{ padding: "24px" }}>
          <div className="flex items-center justify-between">
            {/* Creator Info */}
            <div className="flex items-center" style={{ gap: "16px" }}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.thumbnailUrl} alt={getAuthor()} />
                <AvatarFallback>{getAuthor().charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{getAuthor()}</div>
                <div className="flex items-center gap-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(video.addedAt)}
                  <Badge className={`text-sm font-normal ${getPlatformColor(video.platform)}`}>{video.platform}</Badge>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center" style={{ gap: "32px" }}>
              <KPIMetric
                icon={<Eye className="h-3 w-3 text-gray-600 dark:text-gray-400" />}
                value={formatNumber(getViews())}
                label="Views"
              />
              <KPIMetric
                icon={<Heart className="h-3 w-3 text-gray-600 dark:text-gray-400" />}
                value={formatNumber(getLikes())}
                label="Likes"
              />
              <KPIMetric
                icon={<MessageCircle className="h-3 w-3 text-gray-600 dark:text-gray-400" />}
                value={formatNumber(getComments())}
                label="Comments"
              />
              <KPIMetric
                icon={<Share className="h-3 w-3 text-gray-600 dark:text-gray-400" />}
                value={formatNumber(getShares())}
                label="Shares"
              />
              <KPIMetric
                icon={<TrendingUp className="h-3 w-3 text-gray-600 dark:text-gray-400" />}
                value={`${calculateCompletionRate()}%`}
                label="Completion"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Layout - 1/3 Video, Navigation, 2/3 Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video Section - 1/3 width */}
          <div className="relative w-1/3 flex-shrink-0 bg-black">
            {/* Video Container */}
            <div className="relative h-full w-full">
              {playbackUrl && (
                <iframe
                  src={playbackUrl}
                  title={video.title ?? "video"}
                  allowFullScreen
                  className="h-full w-full object-contain"
                />
              )}

              {/* Fullscreen Button for Mobile */}
              <div className="absolute top-2 right-2 sm:hidden">
                <button className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-gray-900/50 text-white backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-gray-900/70 active:scale-95">
                  <Maximize2 className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation Controls */}
              <div className="absolute top-2 left-2 flex gap-1 md:hidden">
                {hasPrevious && (
                  <button
                    onClick={onNavigatePrevious}
                    className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-gray-900/50 text-white backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-gray-900/70 active:scale-95"
                    title="Previous video"
                  >
                    <ChevronUp className="h-5 w-5" />
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={onNavigateNext}
                    className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-gray-900/50 text-white backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-gray-900/70 active:scale-95"
                    title="Next video"
                  >
                    <ChevronDown className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Bar - Below Video */}
            <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between">
                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.open(video.originalUrl ?? "#", "_blank")}
                    className="flex h-10 items-center gap-2 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <ExternalLink className="h-5 w-5" />
                    View Original
                  </button>

                  <button className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95">
                    <Bookmark className="h-5 w-5" />
                  </button>

                  <button className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95">
                    <Share className="h-5 w-5" />
                  </button>
                </div>

                {/* Overflow Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyToClipboard(video.originalUrl ?? "", "Video URL")}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Navigation Controls - Centered between video and content */}
          <div className="bg-background border-border relative hidden w-12 flex-shrink-0 border-x md:block">
            <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 transform flex-col gap-2">
              {hasPrevious && (
                <button
                  onClick={onNavigatePrevious}
                  className="flex h-10 w-10 items-center justify-center rounded-[20px] border border-gray-200 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-white hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100"
                  title="Previous video"
                >
                  <ChevronUp className="h-5 w-5" />
                </button>
              )}
              {hasNext && (
                <button
                  onClick={onNavigateNext}
                  className="flex h-10 w-10 items-center justify-center rounded-[20px] border border-gray-200 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-white hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100"
                  title="Next video"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Content Section - 2/3 width, Scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 120px)" }}>
            <div style={{ padding: "48px", display: "flex", flexDirection: "column", gap: "48px" }}>
              {/* Hook Card with Remix Functionality */}
              <HookRemixCard />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid h-10 w-full grid-cols-2">
                  <TabsTrigger value="overview" className="text-base font-normal">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="text-base font-normal">
                    Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="overview"
                  style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "48px" }}
                >
                  {/* Performance Metrics - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <div
                        className="cursor-pointer rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ padding: "24px" }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                            Performance Metrics
                          </h3>
                          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        style={{ padding: "24px", marginTop: "8px" }}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: "24px" }}>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <Heart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(getLikes())}
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Likes</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <MessageCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(getComments())}
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Comments</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <Share className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(getShares())}
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Shares</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(getViews())}
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Views</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <Bookmark className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {formatNumber(getSaves())}
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">Saves</div>
                            </div>
                          </div>
                          <div
                            className="flex items-center rounded-lg bg-white dark:bg-gray-900"
                            style={{ gap: "16px", padding: "24px" }}
                          >
                            <div className="rounded-md bg-gray-50 dark:bg-gray-800" style={{ padding: "16px" }}>
                              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {calculateEngagementRate().toFixed(1)}%
                              </div>
                              <div className="text-sm font-normal text-gray-600 dark:text-gray-400">
                                Engagement Rate
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Caption - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <div
                        className="cursor-pointer rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ padding: "24px" }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                            Caption
                          </h3>
                          <div className="flex items-center" style={{ gap: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(getDescription(), "Caption");
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            >
                              {copiedField === "Caption" ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                            </button>
                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        style={{ padding: "24px", marginTop: "8px" }}
                      >
                        <p className="text-base leading-normal font-normal text-gray-900 dark:text-gray-100">
                          {getDescription()}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Hashtags - Collapsible */}
                  {getHashtags().length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <div
                          className="cursor-pointer rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                          style={{ padding: "24px" }}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                              Hashtags
                            </h3>
                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div
                          className="rounded-xl bg-gray-50 dark:bg-gray-800"
                          style={{ padding: "24px", marginTop: "8px" }}
                        >
                          <div className="flex flex-wrap" style={{ gap: "8px" }}>
                            {getHashtags().map((hashtag: string, index: number) => (
                              <div
                                key={index}
                                className="rounded-lg bg-gray-100 text-sm font-normal text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                                style={{ padding: "8px 16px" }}
                              >
                                {hashtag}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TabsContent>

                <TabsContent
                  value="analysis"
                  style={{ marginTop: "48px", display: "flex", flexDirection: "column", gap: "48px" }}
                >
                  {/* Script Components - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <div
                        className="cursor-pointer rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ padding: "24px" }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                            Script Components
                          </h3>
                          <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        style={{
                          padding: "24px",
                          marginTop: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "24px",
                        }}
                      >
                        {video.components?.bridge && (
                          <div>
                            <div
                              className="text-sm font-medium text-gray-600 dark:text-gray-400"
                              style={{ marginBottom: "8px" }}
                            >
                              Bridge
                            </div>
                            <p className="text-base leading-normal font-normal text-gray-900 dark:text-gray-100">
                              {video.components.bridge}
                            </p>
                          </div>
                        )}

                        {video.components?.nugget && (
                          <div>
                            <div
                              className="text-sm font-medium text-gray-600 dark:text-gray-400"
                              style={{ marginBottom: "8px" }}
                            >
                              Golden Nugget
                            </div>
                            <p className="text-base leading-normal font-normal text-gray-900 dark:text-gray-100">
                              {video.components.nugget}
                            </p>
                          </div>
                        )}

                        {video.components?.wta && (
                          <div>
                            <div
                              className="text-sm font-medium text-gray-600 dark:text-gray-400"
                              style={{ marginBottom: "8px" }}
                            >
                              WTA (What To Action)
                            </div>
                            <p className="text-base leading-normal font-normal text-gray-900 dark:text-gray-100">
                              {video.components.wta}
                            </p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Transcript - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <div
                        className="cursor-pointer rounded-xl bg-gray-50 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                        style={{ padding: "24px" }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                            Transcript
                          </h3>
                          <div className="flex items-center" style={{ gap: "8px" }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(video.transcript ?? "", "Transcript");
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-[20px] bg-transparent text-gray-600 transition-all duration-200 ease-in-out hover:bg-gray-50 hover:text-gray-900 active:scale-95 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                            >
                              {copiedField === "Transcript" ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                <Copy className="h-5 w-5" />
                              )}
                            </button>
                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div
                        className="rounded-xl bg-gray-50 dark:bg-gray-800"
                        style={{ padding: "24px", marginTop: "8px" }}
                      >
                        <div className="max-h-48 overflow-y-auto">
                          <p className="text-base leading-normal font-normal text-gray-900 dark:text-gray-100">
                            {video.transcript ?? "No transcript available"}
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
