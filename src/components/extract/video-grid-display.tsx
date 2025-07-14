"use client";

import React, { useState, useCallback, useMemo } from "react";

import Image from "next/image";

import { Play, Heart, Eye, Bookmark, Loader2, Trash2, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VideoGridVideo {
  id?: string;
  thumbnailUrl: string;
  duration?: number; // seconds
  likes?: number;
  views?: number;
  favorite?: boolean;
  title?: string;
  description?: string;
  collectionId?: string;
  addedAt?: string;
  // Video playback URLs
  bunnyIframeUrl?: string; // Bunny.net iframe for optimized playback
  originalVideoUrl?: string; // Original video URL as fallback
  // Additional properties for management mode
  isSelected?: boolean;
  isDeleting?: boolean;
}

export interface VideoGridDisplayProps {
  videos: VideoGridVideo[];
  mode?: "instagram" | "traditional";
  manageMode?: boolean;
  selectedVideos?: Set<string>;
  deletingVideos?: Set<string>;
  hasMoreVideos?: boolean;
  isLoadingMore?: boolean;
  onVideoClick?: (video: VideoGridVideo, index: number) => void;
  onFavorite?: (video: VideoGridVideo, index: number) => void;
  onToggleSelection?: (videoId: string) => void;
  onDeleteVideo?: (videoId: string) => void;
  onLoadMore?: () => Promise<void>;
  renderBadge?: (video: VideoGridVideo, idx: number) => React.ReactNode;
  className?: string;
  emptyStateMessage?: string;
}

export function VideoGridDisplay({
  videos = [],
  mode = "instagram",
  manageMode = false,
  selectedVideos = new Set(),
  deletingVideos = new Set(),
  hasMoreVideos = false,
  isLoadingMore = false,
  onVideoClick,
  onFavorite,
  onToggleSelection,
  onDeleteVideo,
  onLoadMore,
  renderBadge,
  className,
  emptyStateMessage = "No videos to display.",
}: VideoGridDisplayProps) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const handleVideoPlay = useCallback((videoId: string) => {
    setCurrentlyPlayingId(videoId);
  }, []);

  const handleVideoClick = useCallback(
    (video: VideoGridVideo, index: number) => {
      if (manageMode && onToggleSelection && video.id) {
        onToggleSelection(video.id);
      } else if (onVideoClick) {
        onVideoClick(video, index);
      }
    },
    [manageMode, onToggleSelection, onVideoClick],
  );

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent, video: VideoGridVideo, index: number) => {
      e.stopPropagation();
      onFavorite?.(video, index);
    },
    [onFavorite],
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent, videoId: string) => {
      e.stopPropagation();
      onDeleteVideo?.(videoId);
    },
    [onDeleteVideo],
  );

  // Check for duplicate video IDs
  const duplicateCheck = useMemo(() => {
    const videoIds = videos.map((v) => v.id).filter(Boolean);
    const uniqueVideoIds = new Set(videoIds);
    if (videoIds.length !== uniqueVideoIds.size) {
      console.warn("🚨 [VideoGridDisplay] Duplicate video IDs detected:", {
        totalVideos: videoIds.length,
        uniqueVideos: uniqueVideoIds.size,
        duplicates: videoIds.filter((id, index) => videoIds.indexOf(id) !== index),
      });
    }
  }, [videos]);

  // Empty state
  if (!videos || videos.length === 0) {
    return (
      <div className={cn("text-muted-foreground flex w-full items-center justify-center py-12", className)}>
        {emptyStateMessage}
      </div>
    );
  }

  if (mode === "instagram") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video, idx) => {
            const videoId = video.id;
            if (!videoId) return null;

            const views = video.views ?? (video as any).metrics?.views;
            const likes = video.likes ?? (video as any).metrics?.likes;
            const isSelected = selectedVideos.has(videoId);
            const isDeleting = deletingVideos.has(videoId);
            const uniqueKey = `${videoId}-${video.collectionId ?? "no-collection"}-${idx}`;

            return (
              <div key={uniqueKey} className="group relative">
                <button
                  type="button"
                  onClick={() => handleVideoClick(video, idx)}
                  disabled={isDeleting}
                  className={cn(
                    "bg-secondary focus-visible:ring-ring relative aspect-[9/16] w-full overflow-hidden rounded-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                    manageMode && isSelected && "ring-primary ring-2 ring-offset-2",
                    isDeleting && "cursor-not-allowed opacity-50",
                    !isDeleting && "hover:scale-[1.02]",
                  )}
                >
                  {/* Thumbnail */}
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title || "Video thumbnail"}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Overlay darken */}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/50" />

                  {/* Selection indicator */}
                  {manageMode && isSelected && (
                    <div className="bg-primary/20 absolute inset-0 flex items-center justify-center">
                      <div className="bg-primary rounded-full p-2">
                        <Check className="text-primary-foreground h-4 w-4" />
                      </div>
                    </div>
                  )}

                  {/* Loading overlay for deleting */}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}

                  {/* Metrics / Play icon */}
                  <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {views !== undefined && (
                      <span className="flex items-center gap-1 text-lg font-semibold text-white drop-shadow">
                        <Eye className="h-5 w-5" />
                        {formatNumber(views)}
                      </span>
                    )}
                    {likes !== undefined && (
                      <span className="flex items-center gap-1 text-lg font-semibold text-white drop-shadow">
                        <Heart className="h-5 w-5" />
                        {formatNumber(likes)}
                      </span>
                    )}
                    {views === undefined && likes === undefined && !manageMode && (
                      <Play className="h-6 w-6 text-white" />
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {/* Favorite Button */}
                    {onFavorite && !manageMode && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleFavoriteClick(e, video, idx)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleFavoriteClick(e as any, video, idx);
                          }
                        }}
                        className="cursor-pointer rounded-full bg-black/60 p-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/80 focus:ring-2 focus:ring-white focus:ring-offset-1 focus:outline-none"
                        aria-label={video.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Bookmark
                          className={cn(
                            "h-4 w-4 transition-colors",
                            video.favorite ? "fill-yellow-400 text-yellow-400" : "text-white hover:text-yellow-400",
                          )}
                        />
                      </div>
                    )}

                    {/* Delete Button */}
                    {manageMode && onDeleteVideo && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDeleteClick(e, videoId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleDeleteClick(e as any, videoId);
                          }
                        }}
                        className="cursor-pointer rounded-full bg-red-600/80 p-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-red-600 focus:ring-2 focus:ring-white focus:ring-offset-1 focus:outline-none"
                        aria-label="Delete video"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Duration label */}
                  {video.duration && (
                    <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] leading-none font-medium text-white shadow">
                      {formatDuration(video.duration)}
                    </span>
                  )}

                  {/* Custom Badge (e.g. New) */}
                  {renderBadge && <div className="absolute top-2 left-2 z-10">{renderBadge(video, idx)}</div>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Load More Button */}
        {hasMoreVideos && onLoadMore && (
          <div className="flex justify-center pt-6">
            <Button onClick={onLoadMore} disabled={isLoadingMore} variant="outline" className="min-w-[120px]">
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Traditional grid mode
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {videos.map((video, idx) => {
          const videoId = video.id;
          if (!videoId) return null;

          const isSelected = selectedVideos.has(videoId);
          const isDeleting = deletingVideos.has(videoId);
          const uniqueKey = `${videoId}-${video.collectionId ?? "no-collection"}-${idx}`;

          return (
            <div key={uniqueKey} className="group relative">
              <div
                className={cn(
                  "bg-card relative overflow-hidden rounded-lg border transition-all duration-200",
                  manageMode && isSelected && "ring-primary ring-2 ring-offset-2",
                  isDeleting && "opacity-50",
                  !isDeleting && "hover:shadow-md",
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video">
                  <Image
                    src={video.thumbnailUrl || "/images/placeholder.svg"}
                    alt={video.title || "Video thumbnail"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={idx < 6}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/images/placeholder.svg";
                    }}
                  />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="rounded-full bg-black/60 p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {manageMode && isSelected && (
                    <div className="bg-primary absolute top-2 left-2 rounded-full p-1">
                      <Check className="text-primary-foreground h-4 w-4" />
                    </div>
                  )}

                  {/* Loading overlay for deleting */}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}

                  {/* Duration label */}
                  {video.duration && (
                    <span className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                      {formatDuration(video.duration)}
                    </span>
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    {/* Favorite Button */}
                    {onFavorite && !manageMode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleFavoriteClick(e, video, idx)}
                        className="h-8 w-8 bg-black/60 text-white hover:bg-black/80"
                        aria-label={video.favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Bookmark className={cn("h-4 w-4", video.favorite && "fill-yellow-400 text-yellow-400")} />
                      </Button>
                    )}

                    {/* Delete Button */}
                    {manageMode && onDeleteVideo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteClick(e, videoId)}
                        className="h-8 w-8 bg-red-600/80 text-white hover:bg-red-600"
                        aria-label="Delete video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="space-y-2">
                    <h3 className="line-clamp-2 font-medium">{video.title || "Untitled Video"}</h3>
                    {video.description && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">{video.description}</p>
                    )}

                    {/* Metrics */}
                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {video.views !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {formatNumber(video.views)}
                          </span>
                        )}
                        {video.likes !== undefined && (
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {formatNumber(video.likes)}
                          </span>
                        )}
                      </div>

                      {/* Custom Badge */}
                      {renderBadge && renderBadge(video, idx)}
                    </div>
                  </div>
                </div>

                {/* Click handler */}
                <button
                  type="button"
                  onClick={() => handleVideoClick(video, idx)}
                  disabled={isDeleting}
                  className="absolute inset-0 z-10"
                  aria-label={`View ${video.title || "video"}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMoreVideos && onLoadMore && (
        <div className="flex justify-center pt-6">
          <Button onClick={onLoadMore} disabled={isLoadingMore} variant="outline" className="min-w-[120px]">
            {isLoadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatNumber(num: number) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}
