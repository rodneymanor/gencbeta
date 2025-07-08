"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

interface BunnyIframeProps {
  src: string;
  className?: string;
  iframeKey?: string | number;
}

// Lightweight wrapper around Bunny Stream iframe that listens for buffer stalls and nudges playback forward.
export default function BunnyIframe({ src, className = "", iframeKey }: BunnyIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    // Guard: wait until PlayerJS is loaded
    if (!iframeRef.current) return;

    function handleScriptLoad() {
      // PlayerJS is a UMD lib that attaches to window.Player
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Player = (window as any).Player;
      if (!Player || !iframeRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const p = new Player.Player(iframeRef.current);

      // Autoplay flows better on desktop; mute first to satisfy mobile policies
      p.on("ready", () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          p.mute();
        } catch {
          /* ignored */
        }
      });

      // Handle buffer stalls by nudging 0.25s forward
      p.on("bufferstalled", () => {
        console.warn("🐇 [BunnyIframe] stall detected – skipping 0.25 s");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        p.getCurrentTime((t: number) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          p.setCurrentTime(t + 0.25);
        });
      });
    }

    if (typeof window !== "undefined" && !(window as any).Player) {
      // Load PlayerJS once
      const script = document.createElement("script");
      script.src = "//assets.mediadelivery.net/playerjs/player-0.1.0.min.js";
      script.async = true;
      script.onload = handleScriptLoad;
      document.body.appendChild(script);
    } else {
      handleScriptLoad();
    }
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
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </>
  );
} 