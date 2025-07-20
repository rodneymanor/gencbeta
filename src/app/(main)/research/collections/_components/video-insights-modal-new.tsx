"use client";

import { useState, useEffect } from "react";

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
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save,
  Calendar,
  BarChart3,
  Hash,
  FileText,
  Layers,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { StatisticBar } from "@/components/statistic-bar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface VideoInsightsModalNewProps {
  video: VideoWithPlayer;
  children: React.ReactNode;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VideoInsightsModalNew({
  video,
  children,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: VideoInsightsModalNewProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isHookExpanded, setIsHookExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use external state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  // Sample remix hooks for demonstration
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
      toast.success(`${fieldName} copied`);
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

  // Keyboard navigation for up/down arrows
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" && onNavigatePrevious && hasPrevious) {
        e.preventDefault();
        onNavigatePrevious();
      } else if (e.key === "ArrowDown" && onNavigateNext && hasNext) {
        e.preventDefault();
        onNavigateNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onNavigatePrevious, onNavigateNext, hasPrevious, hasNext]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="h-[90vh] w-[90vw] max-w-none overflow-hidden p-0 md:h-[95vh] md:w-[95vw]"
        style={
          {
            backgroundColor: "var(--surface-light, #F9FAFB)",
            "--surface-light": "#F9FAFB",
            "--surface-dark": "#111",
            "--border-light": "#E5E7EB",
            "--border-dark": "#2A2A2A",
            "--primary": "#3B82F6",
            "--icon-muted-light": "#6B7280",
            "--icon-muted-dark": "#9CA3AF",
          } as React.CSSProperties
        }
        showCloseButton={false}
      >
        {/* Visually Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only" aria-label="Video Insights">
          Video Insights - {video.title ?? "Untitled Video"} by {getAuthor()}
        </DialogTitle>

        {/* Sticky Header - 72px height */}
        <div
          className="flex h-[72px] flex-shrink-0 items-center justify-between px-6"
          style={{
            borderBottom: "1px solid var(--border-light)",
            backgroundColor: "var(--surface-light)",
          }}
        >
          {/* Creator Info and Metrics */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={video.thumbnailUrl} alt={getAuthor()} />
                <AvatarFallback className="text-sm">{getAuthor().charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{getAuthor()}</div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {formatDate(video.addedAt)}
                  <Badge
                    variant="secondary"
                    className="h-5 bg-gray-100 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {video.platform}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Compact Social Metrics */}
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(getViews())}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(getLikes())}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(getComments())}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share className="h-3 w-3" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{formatNumber(getShares())}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="font-bold text-gray-900 dark:text-gray-100">{calculateCompletionRate()}%</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="h-8 w-8 rounded-full"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Content - 2-column grid */}
        <div className="grid h-[calc(100%-72px)] grid-cols-1 lg:grid-cols-[38%_62%]">
          {/* Left Column - Video Player (sticky) */}
          <div className="relative bg-black lg:sticky lg:top-0 lg:h-full">
            <div
              className="relative h-full w-full"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Video Player */}
              {playbackUrl && (
                <iframe
                  src={playbackUrl}
                  title={video.title ?? "video"}
                  allowFullScreen
                  className="h-full w-full rounded-lg object-contain"
                  style={{ aspectRatio: "9/16" }}
                />
              )}

              {/* Translucent Action Bar (appears on hover) */}
              <div
                className={`absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all duration-200 ease-out ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Primary Action */}
                  <Button
                    onClick={() => window.open(video.originalUrl ?? "#", "_blank")}
                    className="bg-primary hover:bg-primary/90 gap-2 text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Platform
                  </Button>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      aria-label="Bookmark video"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      aria-label="Share video"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20"
                          aria-label="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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

              {/* Navigation Arrows (if available) */}
              {(hasPrevious || hasNext) && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasPrevious && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNavigatePrevious}
                      className="bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                      title="Previous video (↑)"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  )}
                  {hasNext && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onNavigateNext}
                      className="bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"
                      title="Next video (↓)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Scrollable Content */}
          <div className="overflow-y-auto">
            <div className="space-y-8 p-6">
              {/* Social Metrics Bar */}
              <StatisticBar
                metrics={[
                  { icon: Clock, value: "45s", label: "avg Watch Time" },
                  { icon: TrendingUp, value: `${calculateEngagementRate().toFixed(1)}%`, label: "engagement Rate" },
                  { icon: Share, value: "1.9%", label: "share Rate" },
                  { icon: Bookmark, value: "3.2%", label: "save Rate" },
                  { icon: Eye, value: "4.5%", label: "click Through Rate" },
                  { icon: TrendingUp, value: "8.7/10", label: "viral Score" },
                ]}
                className="border-b pb-4"
              />

              {/* Hook Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-medium">Hook</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsHookExpanded(!isHookExpanded)}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Remix
                  </Button>
                </div>
                <p className="mb-3 text-gray-700 dark:text-gray-300">{video.components?.hook ?? "No hook available"}</p>

                {/* Remix Hooks (expanded state) */}
                {isHookExpanded && (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Alternative Hooks:</p>
                    {remixHooks.map((hook, index) => (
                      <div key={index} className="rounded border p-3">
                        <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">{hook}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(hook, `Hook ${index + 1}`)}
                            className="h-8 gap-1 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                            <Save className="h-3 w-3" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="gap-2">
                    <Layers className="h-4 w-4" />
                    Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Caption Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">Caption</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(getDescription(), "Caption");
                          }}
                        >
                          {copiedField === "Caption" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{getDescription()}</p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Hashtags Collapsible */}
                  {getHashtags().length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                        <div className="flex items-center gap-3">
                          <Hash className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">Hashtags</span>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                          <div className="flex flex-wrap gap-2">
                            {getHashtags().map((hashtag: string, index: number) => (
                              <span
                                key={index}
                                className="rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              >
                                {hashtag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="mt-6 space-y-6">
                  {/* Script Components Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">Script Components</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        {(() => {
                          const transcript = video.transcript ?? "";
                          const wordCount = transcript
                            .trim()
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length;

                          if (wordCount < 5) {
                            return (
                              <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  This video has no transcript.
                                </p>
                              </div>
                            );
                          }

                          return (
                            <>
                              {video.components?.bridge && (
                                <div>
                                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Bridge</h4>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{video.components.bridge}</p>
                                </div>
                              )}
                              {video.components?.nugget && (
                                <div>
                                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Golden Nugget
                                  </h4>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{video.components.nugget}</p>
                                </div>
                              )}
                              {video.components?.wta && (
                                <div>
                                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">WTA</h4>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{video.components.wta}</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Transcript Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-900">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">Transcript</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(video.transcript ?? "", "Transcript");
                          }}
                        >
                          {copiedField === "Transcript" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                        <div className="max-h-48 overflow-y-auto">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {(() => {
                              const transcript = video.transcript ?? "";
                              const wordCount = transcript
                                .trim()
                                .split(/\s+/)
                                .filter((word) => word.length > 0).length;
                              return wordCount < 5
                                ? "This video has no transcript."
                                : transcript || "No transcript available";
                            })()}
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
