'use client';

import { useEffect, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VideoWithPlayer } from '@/app/(main)/research/collections/_components/collections-helpers';
import { toast } from 'sonner';

// Lazy load lightweight insights tabs component for in-panel display
const VideoInsightsTabs = dynamic(
  () => import('@/app/(main)/research/collections/_components/video-insights-tabs').then((m) => m.VideoInsightsTabs),
  {
    ssr: false,
    loading: () => <div className="p-6 text-sm text-muted-foreground">Loading insights…</div>,
  },
);

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

  // Adapt insights shape expected by VideoInsightsTabs
  const enrichedVideo: any = {
    ...video,
    insights: video.metrics
      ? {
          likes: video.metrics.likes ?? 0,
          comments: video.metrics.comments ?? 0,
          shares: video.metrics.shares ?? 0,
          views: video.metrics.views ?? 0,
          saves: video.metrics.saves ?? 0,
          engagementRate: ((video.metrics.likes ?? 0) / Math.max(video.metrics.views ?? 1, 1)) * 100,
        }
      : undefined,
    contentMetadata: {
      platform: video.metadata?.platform ?? video.platform ?? '',
      author: video.metadata?.author ?? '',
      description: video.metadata?.description ?? '',
      source: video.metadata?.source ?? '',
      hashtags: video.metadata?.hashtags ?? [],
    },
    components: video.components ?? { hook: '', bridge: '', nugget: '', wta: '' },
    transcript: video.transcript ?? '',
    visualContext: video.visualContext ?? '',
  };

  // Clipboard copy state for insights tabs
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < videos.length - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowLeft' && canPrev) {
        onChangeIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && canNext) {
        onChangeIndex(currentIndex + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [open, currentIndex, canPrev, canNext, onChangeIndex, onClose],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex h-[90vh] w-[95vw] max-w-none flex-col overflow-hidden p-0 sm:flex-row sm:max-w-[90vw] md:max-w-[1100px]',
          className,
        )}
      >
        {/* Hidden title for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{video.title ?? 'Video playback'}</DialogTitle>
        </DialogHeader>
        {/* Close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute right-3 top-3 z-20 text-white/90 hover:bg-white/10 hover:text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Left navigation */}
        {canPrev && (
          <button
            onClick={() => onChangeIndex(currentIndex - 1)}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right navigation */}
        {canNext && (
          <button
            onClick={() => onChangeIndex(currentIndex + 1)}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Main content grid */}
        <div className="flex flex-1 flex-col sm:h-full sm:flex-row">
          {/* Video area */}
          <div className="relative flex items-center justify-center bg-black sm:basis-[40%] sm:flex-shrink-0">
            {/* Use existing VideoPlayer for now */}
            {/**
             * The VideoPlayer component is relatively heavy; we can lazy-load if needed in future.
             * For now embed directly.
             */}
            {video && (
              <iframe
                src={playbackUrl}
                title={video.title ?? 'video'}
                allowFullScreen
                className="h-full w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Insights sidebar */}
          <div className="relative hidden h-full overflow-y-auto border-l border-border bg-background sm:block sm:basis-[60%]">
            {enrichedVideo && enrichedVideo.insights ? (
              <div className="p-4">
                <VideoInsightsTabs video={enrichedVideo} copiedField={copiedField} onCopyToClipboard={handleCopy} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                No insights available for this video.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 