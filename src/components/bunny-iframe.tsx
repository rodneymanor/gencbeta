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

      // Enhanced buffer stall recovery
      playerInstance.on("bufferstalled", () => {
        console.warn("🐇 [BunnyIframe] Enhanced stall recovery initiated");

        playerInstance.getCurrentTime((currentTime: number) => {
          const strategies = [
            () => playerInstance.setCurrentTime(currentTime + 0.1),
            () => playerInstance.setCurrentTime(currentTime + 0.5),
            () => playerInstance.setCurrentTime(Math.max(0, currentTime - 0.2)),
            () => {
              const iframe = iframeRef.current;
              if (iframe?.src) {
                iframe.src = iframe.src + (iframe.src.includes("?") ? "&" : "?") + "_refresh=" + Date.now();
              }
            },
          ];

          strategies.forEach((fn, idx) => {
            setTimeout(() => {
              try {
                fn();
                void playerInstance.play().catch(() => {});
              } catch {/* ignore */}
            }, idx * 500);
          });
        });
      });

      // Robust error listener
      playerInstance.on("error", (error: any) => {
        console.error("🚨 [BunnyIframe] Player error:", error);

        if (error?.name === "MediaError" || error?.message?.includes("buffer")) {
          setTimeout(() => {
            try {
              playerInstance.getCurrentTime((currentTime: number) => {
                if (error?.message?.includes("hole")) {
                  playerInstance.setCurrentTime(currentTime + 1.0);
                } else {
                  playerInstance.setCurrentTime(Math.max(0, currentTime - 0.5));
                }
                void playerInstance.play();
              });
            } catch {
              const iframe = iframeRef.current;
              if (iframe?.src) {
                iframe.src = iframe.src.replace(/[?&]_retry=\d+/, "") + (iframe.src.includes("?") ? "&" : "?") + "_retry=" + Date.now();
              }
            }
          }, 500);
        }
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