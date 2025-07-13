/* -------------------------------------------------------------------------- */
/*  VideoInsightsTabs – Improved Spacing & Best Practices                     */
/*  Optimized for touch targets, visual hierarchy, and responsive design      */
/* -------------------------------------------------------------------------- */

import React, { useState, useLayoutEffect, useRef } from "react";

import {
  Eye,
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  TrendingUp,
  Film,
  Images,
  FileText,
  NotebookPen,
  Copy,
  Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// [Interfaces remain the same...]
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

/* ---------- 1. Icon Map --------------------------------------------------- */
const TAB_ICONS = {
  overview: <NotebookPen className="size-[18px]" />,
  components: <FileText className="size-[18px]" />,
  transcript: <Images className="size-[18px]" />,
  metadata: <Film className="size-[18px]" />,
} as const;

/* ---------- 1.5. Custom Script Component Icons --------------------------- */
const HookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.8 22a8 8 0 0 0 8-8V8a8 8 0 0 0-16 0v6a8 8 0 0 0 8 8Z"/>
    <path d="M11.8 22V12"/>
  </svg>
);

const BridgeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3c-2.5 0-4.5 2-4.5 4.5v10.5"/>
    <path d="M16 3c2.5 0 4.5 2 4.5 4.5v10.5"/>
    <path d="M4 11h16"/>
  </svg>
);

const GoldenNuggetIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/>
  </svg>
);

const WtaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

/* ---------- 2. Improved Trigger Button ----------------------------------- */
interface TriggerProps {
  value: keyof typeof TAB_ICONS;
  label: string;
  isActive: boolean;
  onSelect: (v: string) => void;
}

const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ value, label, isActive, onSelect }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      data-testid={`video-insights-tab-${value}`}
      aria-pressed={isActive}
      onClick={() => onSelect(value)}
      className={cn(
        // Improved spacing: larger touch targets, better padding
        "group relative flex items-center gap-2 px-4 py-3 rounded-lg select-none outline-none",
        "transition-all duration-200 ease-out", // Smoother transitions
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      {/* Icon with improved spacing */}
      <span
        className={cn(
          "transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"
        )}
      >
        {TAB_ICONS[value]}
      </span>
      {/* Label with better typography spacing */}
      <span
        className={cn(
          "text-sm font-medium whitespace-nowrap transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-85 group-hover:opacity-100"
        )}
      >
        {label}
      </span>
    </button>
  )
);

Trigger.displayName = "Trigger";

/* ---------- 3. Enhanced Indicator Bar ------------------------------------ */
const Indicator = ({ activeRef }: { activeRef: React.RefObject<HTMLButtonElement> }) => {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!activeRef.current || !ref.current) return;
    const { offsetLeft, clientWidth } = activeRef.current;
    ref.current.style.transform = `translateX(${offsetLeft}px)`;
    ref.current.style.width = `${clientWidth}px`;
  }, [activeRef]);

  return (
    <div
      ref={ref}
      className="bg-black absolute bottom-0 h-[3px] rounded-full transition-all duration-200 ease-out"
    />
  );
};

/* ---------- 4. Improved Metric Card -------------------------------------- */
const SocialMediaMetricCard = ({
  icon,
  metric,
  label,
}: {
  icon: React.ReactNode;
  metric: string;
  label: string;
}) => {
  return (
    <div className="border border-borderMain/50 ring-borderMain/50 rounded-lg px-3 py-3 hover:shadow-subtle hover:scale-[1.02] transition-all duration-200">
      {/* Improved spacing: better gap, consistent padding */}
      <div className="flex items-center gap-4">
        {/* Icon container with better spacing */}
        <div className="bg-muted/60 rounded-lg p-2.5 flex-shrink-0">
          {icon}
        </div>
        {/* Metrics with improved hierarchy */}
        <div className="space-y-1">
          <p className="text-foreground text-2xl font-bold leading-tight">{metric}</p>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
        </div>
      </div>
    </div>
  );
};

/* ---------- 4.5. Horizontal Insight Card --------------------------------- */
const InsightCard = ({
  title,
  description,
  impactLabel,
  impactIcon,
  className = "",
}: {
  title: string;
  description: string;
  impactLabel?: string;
  impactIcon?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`relative border border-borderMain/50 ring-borderMain/50 rounded-lg flex flex-row items-center justify-between p-4 transition-all duration-200 hover:shadow-subtle hover:scale-[1.02] w-full ${className}`}
  >
    {/* Left side content: Title and Description */}
    <div className="flex flex-col gap-1">
      <div className="font-sans text-base font-semibold text-foreground">
        {title}
      </div>
      <div className="font-sans text-sm text-muted-foreground max-w-md">
        {description}
      </div>
    </div>

    {/* Right side content: Impact Label and Icon */}
    {(impactLabel ?? impactIcon) && (
      <div className="flex-shrink-0 ml-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-md py-1 px-2 bg-blue-100 dark:bg-blue-900/50">
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
              {impactIcon}
              {impactLabel}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ---------- 5. Improved Sub-Panels --------------------------------------- */
const ComponentsPanel = ({
  components,
  copiedField,
  onCopyToClipboard,
}: {
  components: VideoComponents;
  copiedField: string | null;
  onCopyToClipboard: (text: string, fieldName: string) => void;
}) => {
  const scriptComponents = [
    {
      key: "hook",
      title: "Hook",
      description: components.hook,
      impactLabel: "Opener",
      impactIcon: <HookIcon className="h-4 w-4" />,
    },
    {
      key: "bridge",
      title: "Bridge",
      description: components.bridge,
      impactLabel: "Transition",
      impactIcon: <BridgeIcon className="h-4 w-4" />,
    },
    {
      key: "nugget",
      title: "Golden Nugget",
      description: components.nugget,
      impactLabel: "Value Prop",
      impactIcon: <GoldenNuggetIcon className="h-4 w-4" />,
    },
    {
      key: "wta",
      title: "WTA (What To Action)",
      description: components.wta,
      impactLabel: "Call to Action",
      impactIcon: <WtaIcon className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      {scriptComponents.map((component) => (
        <div key={component.key} className="relative group">
          <InsightCard
            title={component.title}
            description={component.description}
            impactLabel={component.impactLabel}
            impactIcon={component.impactIcon}
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={() => onCopyToClipboard(component.description, component.title)}
          >
            {copiedField === component.title ?
              <Check className="h-4 w-4" /> :
              <Copy className="h-4 w-4" />
            }
          </Button>
        </div>
      ))}
    </div>
  );
};

const TranscriptPanel = ({
  transcript,
  visualContext,
  copiedField,
  onCopyToClipboard,
}: {
  transcript: string;
  visualContext: string;
  copiedField: string | null;
  onCopyToClipboard: (text: string, fieldName: string) => void;
}) => (
  <div className="space-y-5"> {/* Consistent spacing */}
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Full Transcript</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyToClipboard(transcript, "Transcript")}
          >
            {copiedField === "Transcript" ?
              <Check className="h-4 w-4" /> :
              <Copy className="h-4 w-4" />
            }
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </ScrollArea>
      </CardContent>
    </Card>

    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Visual Context</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {visualContext}
        </p>
      </CardContent>
    </Card>
  </div>
);

const MetadataPanel = ({ video }: { video: VideoData }) => (
  <div className="space-y-5"> {/* Consistent spacing */}
    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Content Information</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm"> {/* Better responsive grid */}
          <div className="space-y-2">
            <span className="text-muted-foreground font-medium block">Platform:</span>
            <p className="text-foreground">{video.contentMetadata.platform}</p>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground font-medium block">Author:</span>
            <p className="text-foreground">{video.contentMetadata.author}</p>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground font-medium block">Content Type:</span>
            <p className="text-foreground capitalize">{video.contentMetadata.source}</p>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground font-medium block">Original URL:</span>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline break-all transition-colors"
            >
              View Original
            </a>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="border-border/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Description</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {video.contentMetadata.description}
        </p>
      </CardContent>
    </Card>

    {video.contentMetadata.hashtags.length > 0 && (
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Hashtags</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2.5"> {/* Better tag spacing */}
            {video.contentMetadata.hashtags.map((hashtag, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1">
                #{hashtag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

/* ---------- 6. Main Component with Improved Spacing --------------------- */
export function VideoInsightsTabs({ video, copiedField, onCopyToClipboard }: VideoInsightsTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "components" | "transcript" | "metadata">("overview");
  const triggerRefs = {
    overview: useRef<HTMLButtonElement>(null),
    components: useRef<HTMLButtonElement>(null),
    transcript: useRef<HTMLButtonElement>(null),
    metadata: useRef<HTMLButtonElement>(null),
  };

  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  };

  return (
    <div className="w-full space-y-6"> {/* Container spacing */}
      {/* Enhanced Tab Navigation */}
      <div className="relative">
        <div className="flex gap-1 border-b border-border/50 px-1"> {/* Better tab container */}
          {(
            [
              { value: "overview", label: "Overview" },
              { value: "components", label: "Script Components" },
              { value: "transcript", label: "Transcript" },
              { value: "metadata", label: "Metadata" },
            ] as const
          ).map((tab) => (
            <Trigger
              key={tab.value}
              ref={triggerRefs[tab.value]}
              value={tab.value}
              label={tab.label}
              isActive={activeTab === tab.value}
              onSelect={(v) => setActiveTab(v as any)}
            />
          ))}
          
          {/* Enhanced Moving Indicator */}
          <Indicator activeRef={triggerRefs[activeTab]} />
        </div>
      </div>

      {/* Content Panels with Better Spacing */}
      <section className="space-y-6">
        {activeTab === "overview" && (
          <div className="space-y-8"> {/* Better section spacing */}
                         {/* Metrics Grid with Improved Spacing */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
               {[
                 {
                   type: "views",
                   value: video.insights.views,
                   label: "Views",
                   icon: <Eye className="h-6 w-6 text-blue-500" />,
                 },
                 {
                   type: "likes",
                   value: video.insights.likes,
                   label: "Likes",
                   icon: <Heart className="h-6 w-6 text-red-500" />,
                 },
                 {
                   type: "comments",
                   value: video.insights.comments,
                   label: "Comments",
                   icon: <MessageCircle className="h-6 w-6 text-green-500" />,
                 },
                 {
                   type: "shares",
                   value: video.insights.shares,
                   label: "Shares",
                   icon: <Share className="h-6 w-6 text-purple-500" />,
                 },
                 {
                   type: "saves",
                   value: video.insights.saves,
                   label: "Saves",
                   icon: <Bookmark className="h-6 w-6 text-[#2d93ad]" />,
                 },
                 {
                   type: "engagement",
                   value: video.insights.engagementRate,
                   label: "Engagement Rate",
                   icon: <TrendingUp className="h-6 w-6 text-indigo-500" />,
                 },
               ].map((metric) => (
                 <SocialMediaMetricCard
                   key={metric.type}
                   icon={metric.icon}
                   metric={metric.type === "engagement" ? `${metric.value.toFixed(1)}%` : formatNumber(metric.value)}
                   label={metric.label}
                 />
               ))}
            </div>

            <Separator className="my-8" />

            {/* Hook Section with Text Area */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Hook</h3>
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[120px] p-4 border border-borderMain/50 ring-borderMain/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  value={video.components.hook}
                  readOnly
                  placeholder="Hook content will appear here..."
                />
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    // TODO: Implement hook rewrite functionality
                    console.log("Rewrite hook clicked");
                  }}
                >
                  Rewrite Hook
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "components" && (
          <ComponentsPanel
            components={video.components}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />
        )}

        {activeTab === "transcript" && (
          <TranscriptPanel
            transcript={video.transcript}
            visualContext={video.visualContext}
            copiedField={copiedField}
            onCopyToClipboard={onCopyToClipboard}
          />
        )}

        {activeTab === "metadata" && <MetadataPanel video={video} />}
      </section>
    </div>
  );
}
