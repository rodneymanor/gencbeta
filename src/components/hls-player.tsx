import React, { useEffect, useRef } from "react";
import Hls, { ErrorDetails, ErrorTypes } from "hls.js";

interface HlsPlayerProps {
  src: string; // m3u8 url
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

// Lightweight HLS player with tuned buffer thresholds and stall recovery
export function HlsPlayer({ src, poster, autoPlay = true, className }: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    // Native HLS support (Safari / iOS)
    if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = src;
      if (autoPlay) void videoRef.current.play();
      return () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.src = "";
        }
      };
    }

    // Tuned config – based on hls.js community recommendations
    const hls = new Hls({
      maxBufferHole: 0.1,
      maxBufferLength: 30,
      maxBufferSize: 60 * 1000 * 1000, // 60 MB
      lowBufferWatchdogPeriod: 0.5,
      highBufferWatchdogPeriod: 4,
      nudgeOffset: 0.1,
      nudgeMaxRetry: 5,
      enableWorker: true,
      backBufferLength: 30,
      progressive: true,
      lowLatencyMode: true,
    });

    hls.loadSource(src);
    hls.attachMedia(videoRef.current);

    if (autoPlay) {
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(() => {/* autoplay blocked */});
      });
    }

    // Stall recovery: bufferStalledError -> nudge will auto-seek
    hls.on(Hls.Events.ERROR, (_evt, data) => {
      if (data.details === ErrorDetails.BUFFER_STALLED_ERROR) {
        console.warn("Recovering small stall by nudging");
        // Let hls.js attempt internal nudge; if fatal escalate recovery
      }

      if (data.fatal) {
        switch (data.type) {
          case ErrorTypes.MEDIA_ERROR:
            console.error("Fatal media error – trying to recover");
            hls.recoverMediaError();
            break;
          case ErrorTypes.NETWORK_ERROR:
            console.error("Fatal network error – trying to recover");
            hls.startLoad();
            break;
          default:
            console.error("Unrecoverable error – destroying HLS instance");
            hls.destroy();
            break;
        }
      }
    });

    return () => {
      hls.destroy();
    };
  }, [src, autoPlay]);

  return (
    <video
      key={src}
      ref={videoRef}
      poster={poster}
      controls
      muted={!autoPlay}
      className={className}
      playsInline
    />
  );
} 