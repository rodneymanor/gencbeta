"use client";

import { useState, useEffect, useRef } from "react";

import {
  X,
  Bookmark,
  Share2,
  MoreVertical,
  Sparkles,
  Copy,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
  Share,
  TrendingUp,
  Clock,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { StatisticBar } from "@/components/statistic-bar";
import { toast } from "sonner";

import type { VideoWithPlayer } from "./collections-helpers";

interface VideoInsightsModalRedesignedProps {
  video: VideoWithPlayer;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function VideoInsightsModalRedesigned({
  video,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious = false,
  hasNext = false,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: VideoInsightsModalRedesignedProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showRemixOptions, setShowRemixOptions] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    caption: false,
    hashtags: false,
    scriptComponents: false,
    transcript: false,
  });
  const [copiedField, setCopiedField] = useState("");
  const modalRef = useRef(null);

  // Use external state if provided, otherwise use internal state
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;

  // Mock data for demonstration - replace with actual video data extraction
  const getVideoData = () => {
    const getAuthor = () => {
      return (
        (video as any).contentMetadata?.author ?? video.metadata?.author ?? (video as any).author ?? "Unknown Author"
      );
    };

    const getViews = () => video.metrics?.views ?? (video as any).views ?? 0;
    const getLikes = () => video.metrics?.likes ?? (video as any).likes ?? 0;
    const getComments = () => video.metrics?.comments ?? (video as any).comments ?? 0;
    const getShares = () => video.metrics?.shares ?? (video as any).shares ?? 0;

    const formatNumber = (num: number): string => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return num.toString();
    };

    const calculateCompletionRate = () => {
      return Math.floor(Math.random() * 30) + 60; // 60-90%
    };

    return {
      id: video.id || "unknown",
      videoUrl: (video as any).iframeUrl ?? (video as any).directUrl ?? video.originalUrl ?? "",
      creator: {
        name: getAuthor(),
        avatar: video.thumbnailUrl || "https://i.pravatar.cc/32?u=" + getAuthor(),
        platform: video.platform || "Unknown",
      },
      date: video.addedAt ? new Date(video.addedAt).toLocaleDateString() : "Unknown date",
      stats: {
        views: formatNumber(getViews()),
        likes: formatNumber(getLikes()),
        comments: formatNumber(getComments()),
        shares: formatNumber(getShares()),
        completion: `${calculateCompletionRate()}%`,
      },
      hook: video.components?.hook || "No hook available",
      remixOptions: [
        "Ever wondered why top creators always go viral? Here's the secret...",
        "The algorithm loves this ONE thing - and I'm about to share it",
        "I tested 100 viral videos and found the pattern nobody talks about",
        "Stop scrolling! This creator hack will change your content game",
        "What if I told you there's a formula for viral content?",
      ],
      performance: {
        avgWatchTime: "45s",
        engagementRate: "7.8%",
        shareRate: "1.9%",
        saveRate: "3.2%",
        clickThroughRate: "4.5%",
        viralScore: "8.7/10",
      },
      caption:
        (video as any).contentMetadata?.description ??
        video.metadata?.description ??
        video.visualContext ??
        "No description available",
      hashtags: (video as any).contentMetadata?.hashtags ?? video.metadata?.hashtags ?? (video as any).hashtags ?? [],
      scriptComponents: (() => {
        const transcript = video.transcript || "";
        const wordCount = transcript
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        if (wordCount < 5) {
          return {
            bridge: "This video has no transcript.",
            goldenNugget: "This video has no transcript.",
            wta: "This video has no transcript.",
          };
        }
        return {
          bridge: video.components?.bridge || "No bridge available",
          goldenNugget: video.components?.nugget || "No golden nugget available",
          wta: video.components?.wta || "No WTA available",
        };
      })(),
      transcript: (() => {
        const transcript = video.transcript || "";
        const wordCount = transcript
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        return wordCount < 5 ? "This video has no transcript." : transcript || "No transcript available";
      })(),
    };
  };

  const videoData = getVideoData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowUp" && onNavigatePrevious && hasPrevious) onNavigatePrevious();
      if (e.key === "ArrowDown" && onNavigateNext && hasNext) onNavigateNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onNavigatePrevious, onNavigateNext, hasPrevious, hasNext, setOpen]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied`);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Navigation Arrow Above */}
      {onNavigatePrevious && hasPrevious && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={onNavigatePrevious}
            className="bg-secondary/90 hover:bg-card/80 border-border group rounded-full border p-3 shadow-lg backdrop-blur-sm transition-all duration-200"
            aria-label="Previous video"
            title="Previous video (↑)"
          >
            <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
      )}

      <div
        ref={modalRef}
        className="bg-background text-foreground border-border relative h-[85vh] max-h-[900px] w-[85vw] max-w-6xl overflow-hidden rounded-xl border shadow-2xl"
        role="dialog"
        aria-label="Video Insights"
      >
        {/* Visually Hidden DialogTitle for accessibility */}
        <div className="sr-only">
          Video Insights - {video.title ?? "Untitled Video"} by {videoData.creator.name}
        </div>

        {/* Header */}
        <div className="bg-background/95 border-border sticky top-0 z-10 flex h-[72px] items-center justify-between border-b px-6 backdrop-blur">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <img src={videoData.creator.avatar} alt={videoData.creator.name} className="h-8 w-8 rounded-full" />
              <div>
                <h3 className="text-sm font-bold">{videoData.creator.name}</h3>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>{videoData.date}</span>
                  <span className="bg-secondary text-secondary-foreground rounded px-1.5 py-0.5">
                    {videoData.creator.platform}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-muted-foreground flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span className="text-foreground font-bold">{videoData.stats.views}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span className="text-foreground font-bold">{videoData.stats.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span className="text-foreground font-bold">{videoData.stats.comments}</span>
              </div>
              <div className="flex items-center gap-1">
                <Share className="h-3 w-3" />
                <span className="text-foreground font-bold">{videoData.stats.shares}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-foreground font-bold">{videoData.stats.completion}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            className="hover:bg-secondary ml-4 rounded-lg p-2 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex h-[calc(100%-72px)]">
          {/* Left Column - Video Player */}
          <div className="flex w-[38%] items-start p-6">
            <div className="group relative w-full overflow-hidden rounded-lg bg-black">
              <div className="aspect-[9/16] w-full">
                <iframe
                  src={videoData.videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Hover Action Bar */}
              <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex items-center justify-between">
                  <button
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-blue-700"
                    onClick={() => window.open(video.originalUrl ?? "#", "_blank")}
                  >
                    View on Platform
                  </button>
                  <div className="flex gap-2">
                    <button
                      className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/20"
                      aria-label="Bookmark"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/20"
                      aria-label="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/20"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="border-border w-[62%] overflow-y-auto border-l">
            <div className="space-y-6 p-6">
              {/* Social Metrics Bar */}
              <StatisticBar
                metrics={[
                  { icon: Clock, value: videoData.performance.avgWatchTime, label: "avg Watch Time" },
                  { icon: TrendingUp, value: videoData.performance.engagementRate, label: "engagement Rate" },
                  { icon: Share, value: videoData.performance.shareRate, label: "share Rate" },
                  { icon: Bookmark, value: videoData.performance.saveRate, label: "save Rate" },
                  { icon: Eye, value: videoData.performance.clickThroughRate, label: "click Through Rate" },
                  { icon: TrendingUp, value: videoData.performance.viralScore, label: "viral Score" },
                ]}
                className="border-border border-b pb-4"
              />

              {/* Hook Card */}
              <div className="bg-card border-border space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold">Hook</h4>
                  <button
                    onClick={() => setShowRemixOptions(!showRemixOptions)}
                    className="bg-secondary hover:bg-secondary/80 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Remix
                  </button>
                </div>

                <p className="text-foreground">{videoData.hook}</p>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${showRemixOptions ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="border-border space-y-2 border-t pt-3">
                    {videoData.remixOptions.map((option, idx) => (
                      <div
                        key={idx}
                        className="bg-muted flex transform items-start justify-between gap-3 rounded-lg p-3 transition-all duration-200 ease-out"
                      >
                        <p className="text-muted-foreground flex-1 text-sm">{option}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopy(option, `remix-${idx}`)}
                            className="hover:bg-secondary rounded p-1.5 transition-colors duration-200"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-border border-b">
                <div className="flex gap-8">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`pb-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === "overview"
                        ? "text-foreground border-primary border-b-2"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`pb-3 text-sm font-medium transition-colors duration-200 ${
                      activeTab === "analysis"
                        ? "text-foreground border-primary border-b-2"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Analysis
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="relative">
                {activeTab === "overview" && (
                  <div className="animate-in fade-in-0 space-y-6 duration-300">
                    {/* Script Components */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection("scriptComponents")}
                        className="bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg p-3 transition-colors duration-200"
                      >
                        <span className="font-medium">Script Components</span>
                        {expandedSections.scriptComponents ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${expandedSections.scriptComponents ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="bg-muted space-y-3 rounded-lg p-3">
                          {Object.entries(videoData.scriptComponents).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                              <h5 className="text-muted-foreground text-sm font-medium capitalize">
                                {key === "wta" ? "WTA" : key.replace(/([A-Z])/g, " $1").trim()}
                              </h5>
                              <p className="text-foreground text-sm">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Transcript */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection("transcript")}
                        className="bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg p-3 transition-colors duration-200"
                      >
                        <span className="font-medium">Transcript</span>
                        {expandedSections.transcript ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${expandedSections.transcript ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="bg-muted rounded-lg p-3">
                          <div className="scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent max-h-[200px] overflow-y-auto pr-2">
                            <p className="text-foreground text-sm">{videoData.transcript}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="animate-in fade-in-0 space-y-6 duration-300">
                    {/* Caption */}
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection("caption")}
                        className="bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg p-3 transition-colors duration-200"
                      >
                        <span className="font-medium">Caption</span>
                        {expandedSections.caption ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${expandedSections.caption ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
                      >
                        <div className="bg-muted space-y-2 rounded-lg p-3">
                          <p className="text-foreground text-sm">{videoData.caption}</p>
                          <button
                            onClick={() => handleCopy(videoData.caption, "caption")}
                            className="bg-secondary hover:bg-secondary/80 flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors duration-200"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hashtags */}
                    {videoData.hashtags.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => toggleSection("hashtags")}
                          className="bg-card hover:bg-card/80 flex w-full items-center justify-between rounded-lg p-3 transition-colors duration-200"
                        >
                          <span className="font-medium">Hashtags</span>
                          {expandedSections.hashtags ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-300 ease-out ${expandedSections.hashtags ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}
                        >
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex flex-wrap gap-2">
                              {videoData.hashtags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-secondary hover:bg-secondary/80 rounded-full px-3 py-1 text-sm transition-colors duration-200"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toast notification */}
        {copiedField && (
          <div className="bg-secondary absolute bottom-6 left-1/4 z-30 -translate-x-1/2 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm">{copiedField} copied</p>
          </div>
        )}
      </div>

      {/* Navigation Arrow Below */}
      {onNavigateNext && hasNext && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onNavigateNext}
            className="bg-secondary/90 hover:bg-card/80 border-border group rounded-full border p-3 shadow-lg backdrop-blur-sm transition-all duration-200"
            aria-label="Next video"
            title="Next video (↓)"
          >
            <ArrowDown className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          </button>
        </div>
      )}
    </div>
  );
}
