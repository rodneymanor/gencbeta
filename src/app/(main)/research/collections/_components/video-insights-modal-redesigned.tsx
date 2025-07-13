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
  Calendar
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  onOpenChange: externalOnOpenChange
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
    "The hidden algorithm hack that doubled my engagement rate"
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

  // Data extraction with fallbacks
  const getAuthor = () => {
    return (
      (video as any).contentMetadata?.author ??
      video.metadata?.author ??
      (video as any).author ??
      'Unknown Author'
    );
  };

  const getViews = () => video.metrics?.views ?? (video as any).views ?? 0;
  const getLikes = () => video.metrics?.likes ?? (video as any).likes ?? 0;
  const getComments = () => video.metrics?.comments ?? (video as any).comments ?? 0;
  const getShares = () => video.metrics?.shares ?? (video as any).shares ?? 0;
  const getSaves = () => video.metrics?.saves ?? (video as any).saves ?? 0;
  const getHashtags = () => {
    return (
      (video as any).contentMetadata?.hashtags ??
      video.metadata?.hashtags ??
      (video as any).hashtags ??
      []
    );
  };
  const getDescription = () => {
    return (
      (video as any).contentMetadata?.description ??
      video.metadata?.description ??
      video.visualContext ??
      (video as any).description ??
      'No description available'
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
  const playbackUrl = (video as any).iframeUrl ?? (video as any).directUrl ?? video.originalUrl ?? '';

  // KPI Metric Component
  const KPIMetric = ({ 
    icon, 
    value, 
    label, 
    className = "" 
  }: { 
    icon: React.ReactNode; 
    value: string; 
    label: string; 
    className?: string;
  }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="p-1 bg-muted rounded">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  // Hook Remix Component
  const HookRemixCard = () => (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Hook</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setIsHookExpanded(!isHookExpanded)}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Re-mix Hook
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyToClipboard(video.components?.hook ?? '', "Hook")}
            >
              {copiedField === "Hook" ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground leading-relaxed">
          {video.components?.hook ?? 'No hook available'}
        </p>
        
        {isHookExpanded && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="text-xs font-medium text-muted-foreground">Alternative Hooks:</div>
            {remixHooks.map((hook, index) => (
              <div key={index} className="p-3 bg-background rounded-lg border">
                <p className="text-sm text-foreground">{hook}</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Keyboard navigation for up/down arrows
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && onNavigatePrevious) {
        e.preventDefault();
        onNavigatePrevious();
      } else if (e.key === 'ArrowDown' && onNavigateNext) {
        e.preventDefault();
        onNavigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onNavigatePrevious, onNavigateNext]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden p-0 bg-background sm:max-w-7xl" showCloseButton={false}>
        {/* Visually Hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          Video Insights - {video.title ?? 'Untitled Video'} by {getAuthor()}
        </DialogTitle>
        
        {/* Top Bar with Creator Metadata and KPIs */}
        <div className="flex-shrink-0 p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {/* Creator Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={video.thumbnailUrl} alt={getAuthor()} />
                <AvatarFallback>{getAuthor().charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-foreground">{getAuthor()}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(video.addedAt)}
                  <Badge className={`text-xs ${getPlatformColor(video.platform)}`}>
                    {video.platform}
                  </Badge>
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center gap-4">
              <KPIMetric
                icon={<Eye className="h-3 w-3 text-blue-500" />}
                value={formatNumber(getViews())}
                label="Views"
              />
              <KPIMetric
                icon={<Heart className="h-3 w-3 text-red-500" />}
                value={formatNumber(getLikes())}
                label="Likes"
              />
              <KPIMetric
                icon={<MessageCircle className="h-3 w-3 text-green-500" />}
                value={formatNumber(getComments())}
                label="Comments"
              />
              <KPIMetric
                icon={<Share className="h-3 w-3 text-purple-500" />}
                value={formatNumber(getShares())}
                label="Shares"
              />
              <KPIMetric
                icon={<TrendingUp className="h-3 w-3 text-indigo-500" />}
                value={`${calculateCompletionRate()}%`}
                label="Completion"
              />
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Layout - 1/3 Video, Navigation, 2/3 Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video Section - 1/3 width */}
          <div className="relative flex-shrink-0 bg-black w-1/3">
            {/* Video Container */}
            <div className="relative h-full w-full">
              {playbackUrl && (
                <iframe
                  src={playbackUrl}
                  title={video.title ?? 'video'}
                  allowFullScreen
                  className="h-full w-full object-contain"
                />
              )}
              
              {/* Fullscreen Button for Mobile */}
              <div className="absolute top-2 right-2 sm:hidden">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Navigation Controls */}
              <div className="absolute top-2 left-2 md:hidden flex gap-1">
                {hasPrevious && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigatePrevious}
                    className="h-8 w-8 p-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    title="Previous video"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                )}
                {hasNext && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateNext}
                    className="h-8 w-8 p-0 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                    title="Next video"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action Bar - Below Video */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <div className="flex items-center justify-between">
                {/* Primary Actions */}
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8"
                    onClick={() => window.open(video.originalUrl ?? '#', "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Original
                  </Button>
                  
                  <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8">
                    <Bookmark className="h-3 w-3" />
                  </Button>
                  
                  <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8">
                    <Share className="h-3 w-3" />
                  </Button>
                </div>

                {/* Overflow Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-8 w-8">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => copyToClipboard(video.originalUrl ?? '', "Video URL")}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Navigation Controls - Centered between video and content */}
          <div className="relative flex-shrink-0 w-12 bg-background border-x border-border hidden md:block">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2">
              {hasPrevious && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigatePrevious}
                  className="h-10 w-10 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background shadow-sm"
                  title="Previous video"
                >
                  <ChevronUp className="h-5 w-5" />
                </Button>
              )}
              {hasNext && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateNext}
                  className="h-10 w-10 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background shadow-sm"
                  title="Next video"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Content Section - 2/3 width, Scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-6 space-y-6">
              {/* Hook Card with Remix Functionality */}
              <HookRemixCard />

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-sm">Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Performance Metrics - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Performance Metrics</CardTitle>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="border-t-0 rounded-t-none">
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <Heart className="h-4 w-4 text-red-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{formatNumber(getLikes())}</div>
                                <div className="text-xs text-muted-foreground">Likes</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <MessageCircle className="h-4 w-4 text-green-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{formatNumber(getComments())}</div>
                                <div className="text-xs text-muted-foreground">Comments</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <Share className="h-4 w-4 text-purple-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{formatNumber(getShares())}</div>
                                <div className="text-xs text-muted-foreground">Shares</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <Eye className="h-4 w-4 text-blue-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{formatNumber(getViews())}</div>
                                <div className="text-xs text-muted-foreground">Views</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <Bookmark className="h-4 w-4 text-amber-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{formatNumber(getSaves())}</div>
                                <div className="text-xs text-muted-foreground">Saves</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                              <div className="p-2 bg-background rounded-md">
                                <TrendingUp className="h-4 w-4 text-indigo-500" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{calculateEngagementRate().toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">Engagement Rate</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Caption - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Caption</CardTitle>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(getDescription(), "Caption");
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {copiedField === "Caption" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="border-t-0 rounded-t-none">
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {getDescription()}
                          </p>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Hashtags - Collapsible */}
                  {getHashtags().length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">Hashtags</CardTitle>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </CardHeader>
                        </Card>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Card className="border-t-0 rounded-t-none">
                          <CardContent className="pt-0">
                            <div className="flex flex-wrap gap-2">
                              {getHashtags().map((hashtag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {hashtag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6 mt-6">
                  {/* Script Components - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Script Components</CardTitle>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="border-t-0 rounded-t-none">
                        <CardContent className="pt-0 space-y-4">
                          {video.components?.bridge && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Bridge</div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {video.components.bridge}
                              </p>
                            </div>
                          )}
                          
                          {video.components?.nugget && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">Golden Nugget</div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {video.components.nugget}
                              </p>
                            </div>
                          )}
                          
                          {video.components?.wta && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-2">WTA (What To Action)</div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {video.components.wta}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Transcript - Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Transcript</CardTitle>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(video.transcript ?? '', "Transcript");
                                }}
                                className="h-8 w-8 p-0"
                              >
                                {copiedField === "Transcript" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="border-t-0 rounded-t-none">
                        <CardContent className="pt-0">
                          <div className="max-h-48 overflow-y-auto">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {video.transcript ?? 'No transcript available'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
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