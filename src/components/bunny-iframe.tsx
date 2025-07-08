"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface BunnyIframeProps {
  src: string;
  className?: string;
  iframeKey?: string | number;
  videoId?: string;
}

// Lightweight wrapper around Bunny Stream iframe that listens for buffer stalls and nudges playback forward.
export default function BunnyIframe({ src, className = "", iframeKey, videoId }: BunnyIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    let playerInstance: any;
    const handleScriptLoad = () => {
      // PlayerJS is a UMD lib that attaches to window.Player
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Player = (window as any).Player;
      if (!Player || !iframeRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      playerInstance = new Player.Player(iframeRef.current);

      // Autoplay flows better on desktop; mute first to satisfy mobile policies
      playerInstance.on("ready", () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          playerInstance.mute();
        } catch {
          /* ignored */
        }
      });

      // Handle buffer stalls by nudging 0.25s forward
      playerInstance.on("bufferstalled", () => {
        console.warn("🐇 [BunnyIframe] stall detected – skipping 0.25 s");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        playerInstance.getCurrentTime((t: number) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          playerInstance.setCurrentTime(t + 0.25);
          // ensure still playing
          try {
            playerInstance.play();
          } catch {
            /* ignored */
          }
        });
      });
    }

    if ((window as any).Player) {
      handleScriptLoad();
    }

    return () => {
      try {
        if (playerInstance) {
          playerInstance.destroy && playerInstance.destroy();
        }
      } catch {
        /* ignored */
      }
    };
  }, [src]);

  return (
    <>
      {/* Ensure PlayerJS script is loaded for React strict mode double mounting */}
      <Script src="//assets.mediadelivery.net/playerjs/player-0.1.0.min.js" strategy="lazyOnload" />
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={src}
        className={className}
        data-video-id={videoId}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </>
  );
} 