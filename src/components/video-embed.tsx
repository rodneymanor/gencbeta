"use client";

import React, { useState, useCallback, useEffect, memo, useTransition, useRef } from "react";

import { Play } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  className?: string;
  onPlay?: () => void;
  playing?: boolean;
}

// Custom hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Helper function to check if URL is a Bunny.net URL
const isBunnyUrl = (url: string): boolean => {
  return url && (url.includes("iframe.mediadelivery.net") || url.includes("bunnycdn.com") || url.includes("b-cdn.net"));
};

// Helper function to create iframe src with autoplay
const createIframeSrc = (url: string, autoplay: boolean): string => {
  return autoplay ? `${url}${url.includes("?") ? "&" : "?"}autoplay=true` : url;
};

// Fallback component for non-Bunny URLs
const NonBunnyFallback = ({ className }: { className: string }) => (
  <div className={`flex aspect-[9/16] items-center justify-center bg-gray-900 text-white ${className}`}>
    <div className="p-4 text-center">
      <div className="text-sm font-medium">Video Processing Required</div>
      <div className="mt-1 text-xs text-gray-400">Only Bunny.net CDN videos supported</div>
    </div>
  </div>
);

// BUNNY.NET ONLY VIDEO EMBED - Rejects all non-Bunny URLs
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, className = "", onPlay, playing = false }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [iframeKey, setIframeKey] = useState(0);
    const [isPending, startTransition] = useTransition();
    const prevPlaying = usePrevious(playing);

    const videoId = url;

    // Handle local play button click
    const handleLocalPlay = useCallback(() => {
      if (!playing && videoId) {
        console.log("🎬 [VideoEmbed] Starting Bunny video (via local click):", videoId.substring(0, 50) + "...");
        startTransition(() => {
          setIsLoading(true);
        });
        onPlay?.();
      }
    }, [playing, videoId, onPlay]);

    // Effect to handle pausing the video
    useEffect(() => {
      // When the `playing` prop changes from true to false, it means we need to stop the video.
      // We do this by changing the iframeKey, which forces the iframe to be completely re-rendered.
      if (prevPlaying === true && playing === false) {
        console.log("⏸️ [VideoEmbed] Pausing Bunny video (via prop change) by recreating iframe");
        setIframeKey((prev) => prev + 1);
        setIsLoading(false); // Ensure loading state is reset
      }
    }, [playing, prevPlaying]);

    // Check if URL is valid Bunny.net URL
    if (!isBunnyUrl(url)) {
      console.warn("🚫 [VideoEmbed] Rejected non-Bunny URL:", url);
      return <NonBunnyFallback className={className} />;
    }

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative aspect-[9/16] w-full">
          <iframe
            key={playing ? `playing-${iframeKey}` : `thumbnail-${iframeKey}`}
            src={createIframeSrc(url, playing)}
            className="absolute inset-0 h-full w-full"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />

          {!playing && (
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
              onClick={handleLocalPlay}
            >
              <div className="rounded-full bg-black/60 p-6 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          )}

          {(isLoading || isPending) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.url === nextProps.url && prevProps.playing === nextProps.playing,
);

VideoEmbed.displayName = "VideoEmbed";
