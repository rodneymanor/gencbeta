'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoWithPlayer } from '@/app/(main)/research/collections/_components/collections-helpers';
import { VideoInsightsModalRedesigned } from '@/app/(main)/research/collections/_components/video-insights-modal-redesigned';

interface VideoLightboxProps {
  videos: VideoWithPlayer[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onChangeIndex: (newIndex: number) => void;
  className?: string;
}

export function VideoLightbox({
  videos,
  currentIndex,
  open,
  onClose,
  onChangeIndex,
  className,
}: VideoLightboxProps) {
  const video = videos[currentIndex];

  if (!video) return null;

  // Derive playback URL preference order: iframeUrl > directUrl > originalUrl
  const playbackUrl =
    (video as any).iframeUrl || (video as any).directUrl || video.originalUrl || '';

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < videos.length - 1;

  return (
    <VideoInsightsModalRedesigned 
      video={video}
      onNavigatePrevious={canPrev ? () => onChangeIndex(currentIndex - 1) : undefined}
      onNavigateNext={canNext ? () => onChangeIndex(currentIndex + 1) : undefined}
      hasPrevious={canPrev}
      hasNext={canNext}
    >
      <div className="relative">
        {/* Video thumbnail/trigger */}
        <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black">
          <iframe
            src={playbackUrl}
            title={video.title ?? 'video'}
            allowFullScreen
            className="h-full w-full object-contain"
          />
          
          {/* Navigation arrows for mobile */}
          <div className="absolute inset-0 flex items-center justify-between p-2 sm:hidden">
            {canPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeIndex(currentIndex - 1);
                }}
                className="rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeIndex(currentIndex + 1);
                }}
                className="rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </VideoInsightsModalRedesigned>
  );
} 