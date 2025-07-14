"use client";

import React, { useState } from "react";

import { ChevronDown, HelpCircle } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedCreatorProfile, getOptimizedProfileImageUrl } from "@/lib/creator-spotlight-utils";
import { cn } from "@/lib/utils";

interface CreatorGridProps {
  creators: EnhancedCreatorProfile[];
  loading: boolean;
  onCreatorClick: (creator: EnhancedCreatorProfile) => void;
}

interface ExpandableBioProps {
  bio: string;
  maxLength?: number;
}

function ExpandableBio({ bio, maxLength = 80 }: ExpandableBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (bio.length <= maxLength) {
    return <p className="text-foreground text-sm leading-normal font-normal">{bio}</p>;
  }

  const truncated = bio.slice(0, maxLength) + "...";

  return (
    <div className="space-y-[var(--space-1)]">
      <p className="text-foreground text-sm leading-normal font-normal">{isExpanded ? bio : truncated}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="text-primary md:hover:text-primary/90 flex items-center gap-[var(--space-1)] text-sm font-normal transition-colors duration-200"
      >
        <span>{isExpanded ? "Show less" : "Show more"}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isExpanded && "rotate-180")} />
      </button>
    </div>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="text-primary-foreground bg-card invisible absolute bottom-full left-1/2 z-10 mb-2 max-w-[200px] -translate-x-1/2 rounded-lg px-3 py-2 text-sm font-normal whitespace-nowrap opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        {content}
        <div className="border-t-card absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-t-4 border-r-4 border-l-4 border-transparent"></div>
      </div>
    </div>
  );
}

export function CreatorGrid({ creators, loading, onCreatorClick }: CreatorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="bg-muted space-y-[var(--space-1)] rounded-xl p-[var(--space-3)]">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator, index) => (
        <div
          key={creator.id}
          className="bg-muted focus:ring-ring cursor-pointer space-y-[var(--space-1)] rounded-xl p-[var(--space-3)] focus:ring-2 focus:ring-offset-2 focus:outline-none"
          onClick={() => onCreatorClick(creator)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCreatorClick(creator);
            }
          }}
        >
          {/* Header with Avatar */}
          <div className="flex items-center space-x-[var(--space-2)]">
            <SafeImage
              src={getOptimizedProfileImageUrl(creator)}
              alt={creator.displayName ?? creator.username}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full"
              fallbackUsername={creator.username}
              fallbackPlatform={creator.platform}
              priority={index < 6}
            />
            <div>
              <h3 className="text-foreground flex items-center gap-[var(--space-1)] text-base font-medium">
                {creator.displayName ?? creator.username}
                {creator.isVerified && <span className="text-primary text-sm font-normal">✓</span>}
              </h3>
              <p className="text-muted-foreground text-sm font-normal">@{creator.username}</p>
            </div>
          </div>

          {/* Body */}
          {creator.bio && <ExpandableBio bio={creator.bio} />}

          {/* Metadata */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-[var(--space-1)] text-sm font-normal">
            <span>
              {creator.followersCount >= 1000000
                ? `${(creator.followersCount / 1000000).toFixed(1)}M`
                : creator.followersCount >= 1000
                  ? `${(creator.followersCount / 1000).toFixed(1)}K`
                  : creator.followersCount}{" "}
              followers
            </span>
            <span>•</span>
            <span>{creator.videoCount ?? 0} videos</span>
            {creator.hasOptimizedMedia && (
              <>
                <span>•</span>
                <Tooltip content="Content optimized for faster loading and better performance">
                  <span className="flex cursor-help items-center gap-[var(--space-1)]">
                    ⚡ Fast
                    <HelpCircle className="h-3 w-3" />
                  </span>
                </Tooltip>
              </>
            )}
            <span>•</span>
            <span className="capitalize">{creator.platform}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
