"use client";

import React, { useEffect, useRef, memo } from "react";

// Note: The Player.js script is loaded in the root layout (src/app/layout.tsx)
// This makes the `playerjs` object available globally in the browser.
declare const playerjs: any;

interface VideoEmbedProps {
  url: string;
  className?: string;
  onPlay?: () => void;
  playing?: boolean;
}

// Helper function to check if URL is a Bunny.net URL
const isBunnyUrl = (url: string): boolean => {
  return url && (url.includes("iframe.mediadelivery.net") || url.includes("bunnycdn.com") || url.includes("b-cdn.net"));
};

// Fallback component for non-Bunny URLs
const NonBunnyFallback = ({ className }: { className?: string }) => (
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
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);

    // Initialize the player and set up event listeners
    useEffect(() => {
      if (iframeRef.current) {
        const player = new playerjs.Player(iframeRef.current);
        playerRef.current = player;

        player.on("ready", () => {
          console.log(`🎬 [Player.js] Player ready for: ${url.substring(0, 50)}...`);
        });

        player.on("play", () => {
          console.log(`▶️ [Player.js] Play event for: ${url.substring(0, 50)}...`);
          onPlay?.();
        });

        player.on("error", (error: any) => {
          console.error(`❌ [Player.js] Error for: ${url.substring(0, 50)}...`, error);
        });

        // Cleanup on component unmount
        return () => {
          try {
            player.off("ready");
            player.off("play");
            player.off("error");
          } catch (e) {
            console.warn(`[Player.js] Cleanup failed for ${url.substring(0, 50)}...`, e);
          }
        };
      }
    }, [url, onPlay]);

    // Control playback based on the `playing` prop
    useEffect(() => {
      const player = playerRef.current;
      if (player) {
        if (playing) {
          player.play();
        } else {
          player.pause();
          player.setCurrentTime(0); // Optional: rewind to start
        }
      }
    }, [playing]);

    // Check if URL is valid Bunny.net URL
    if (!isBunnyUrl(url)) {
      console.warn("🚫 [VideoEmbed] Rejected non-Bunny URL:", url);
      return <NonBunnyFallback className={className} />;
    }

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative aspect-[9/16] w-full">
          <iframe
            ref={iframeRef}
            src={`${url}?autoplay=false`} // Autoplay is now controlled via JS
            className="absolute inset-0 h-full w-full"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.url === nextProps.url && prevProps.playing === nextProps.playing,
);

VideoEmbed.displayName = "VideoEmbed";
