'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Play, Heart, Eye, Bookmark } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Component to handle thumbnail with iframe fallback
 */
function VideoThumbnail({ 
  video, 
  alt = "Video thumbnail" 
}: { 
  video: GridVideo; 
  alt?: string; 
}) {
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Get fallback iframe URL
  const fallbackIframeUrl = video.bunnyIframeUrl || video.iframeUrl;
  
  // If thumbnail failed and we have iframe fallback, use iframe
  if (thumbnailError && fallbackIframeUrl) {
    return (
      <iframe
        src={fallbackIframeUrl}
        title={alt}
        className="h-full w-full object-cover"
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
      />
    );
  }
  
  return (
    <Image
      src={video.thumbnailUrl}
      alt={alt}
      fill
      sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
      className="object-cover transition-transform duration-200 group-hover:scale-105"
      onError={() => setThumbnailError(true)}
    />
  );
}

/**
 * Generic shape expected from CollectionsPage helpers.
 * Using a minimal subset keeps this component decoupled.
 */
export interface GridVideo {
  id?: string;
  thumbnailUrl: string;
  duration?: number; // seconds
  likes?: number;
  views?: number;
  favorite?: boolean;
  bunnyIframeUrl?: string; // Fallback iframe URL for when thumbnail fails
  iframeUrl?: string; // Alternative iframe URL field
}

interface InstagramVideoGridProps {
  videos: GridVideo[];
  onVideoClick?: (video: GridVideo, index: number) => void;
  onFavorite?: (video: GridVideo, index: number) => void;
  className?: string;
  renderBadge?: (video: GridVideo, idx: number) => React.ReactNode;
}

/**
 * Responsive 1:1 aspect-ratio grid inspired by Instagram.
 * Falls back gracefully if no videos are provided.
 */
export function InstagramVideoGrid({
  videos,
  onVideoClick,
  onFavorite,
  className,
  renderBadge,
}: InstagramVideoGridProps) {
  if (!videos || videos.length === 0) {
    return (
      <div className={cn('text-muted-foreground flex w-full items-center justify-center py-12', className)}>
        No videos to display.
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2',
        className,
      )}
    >
      {videos.map((video, idx) => {
        const views = (video as any).views ?? (video as any).metrics?.views;
        const likes = (video as any).likes ?? (video as any).metrics?.likes;
        return (
          <button
            key={(video.id ?? 'vid') + '-' + idx}
            type="button"
            onClick={() => onVideoClick?.(video, idx)}
            className="group relative aspect-[9/16] w-full overflow-hidden rounded-sm bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* Thumbnail with iframe fallback */}
            <VideoThumbnail video={video} alt="Video thumbnail" />

            {/* Overlay darken */}
            <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/50" />

            {/* Metrics / Play icon */}
            <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {views !== undefined && (
                <span className="flex items-center gap-1 text-white text-lg font-semibold drop-shadow">
                  <Eye className="h-5 w-5" />
                  {formatNumber(views)}
                </span>
              )}
              {likes !== undefined && (
                <span className="flex items-center gap-1 text-white text-lg font-semibold drop-shadow">
                  <Heart className="h-5 w-5" />
                  {formatNumber(likes)}
                </span>
              )}
              {views === undefined && likes === undefined && (
                <Play className="h-6 w-6 text-white" />
              )}
            </div>

            {/* Favorite Button */}
            {onFavorite && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavorite(video, idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onFavorite(video, idx);
                  }
                }}
                className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-1.5 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 cursor-pointer"
                aria-label={video.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Bookmark
                  className={`h-4 w-4 transition-colors ${
                    video.favorite
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white hover:text-yellow-400'
                  }`}
                />
              </div>
            )}

            {/* Duration label */}
            {video.duration ? (
              <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white shadow">
                {formatDuration(video.duration)}
              </span>
            ) : null}

            {/* Custom Badge (e.g. New) */}
            {renderBadge && (
              <div className="absolute top-2 left-2 z-10">
                {renderBadge(video, idx)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatNumber(num: number) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
} 