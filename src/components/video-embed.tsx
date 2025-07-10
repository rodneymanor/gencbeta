"use client";

import React, { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";

import { Play, AlertTriangle, RefreshCw } from "lucide-react";

import { useVideoPlaybackData, useVideoPlaybackAPI } from "@/contexts/video-playback-context";
import { useFirefoxVideoManager } from "@/hooks/use-firefox-video-manager";
import { useHLSBufferMonitor } from "@/hooks/use-hls-buffer-monitor";
import { useHLSRecovery } from "@/hooks/use-hls-recovery";
import { usePreemptiveBufferManagement } from "@/hooks/use-preemptive-buffer-management";

import BunnyIframe from "./bunny-iframe";

interface VideoEmbedProps {
  url: string;
  className?: string;
  videoId?: string; // Add videoId prop for better control
  isPlaying?: boolean; // Add isPlaying prop for external control
  onPlay?: () => void; // Add onPlay callback for external control
  preload?: boolean; // Add preload prop for better performance
  thumbnailUrl?: string; // Bunny thumbnail URL
}

// Helper function to build iframe src URL
const buildIframeSrc = (baseUrl: string, params: Record<string, string>) => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${baseUrl}${separator}${paramString}`;
};

// Helper function to check if URL is from Bunny
const isBunnyUrl = (url: string) => {
  return url && (url.includes("iframe.mediadelivery.net") || url.includes("bunnycdn.com") || url.includes("b-cdn.net"));
};

// Helper function to create preload iframe (disabled for Firefox)
const createPreloadIframe = (url: string, videoId: string, isFirefox: boolean) => {
  if (isFirefox) {
    console.log("🦊 [VideoEmbed] Skipping preload for Firefox");
    return null;
  }

  const preloadFrame = document.createElement("iframe");
  preloadFrame.src = buildIframeSrc(url, { metrics: 'false', preload: 'true', autoplay: 'false' });
  preloadFrame.style.display = "none";
  preloadFrame.setAttribute("data-preload", "true");
  preloadFrame.setAttribute("data-video-id", videoId);
  return preloadFrame;
};

// Helper function to render error overlay
const renderErrorOverlay = (isRecovering: boolean, onRetry: () => void) => (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
    <div className="text-center text-white">
      <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
      <div className="text-sm mb-3">Video playback error</div>
      <button
        onClick={onRetry}
        disabled={isRecovering}
        className="flex items-center gap-2 mx-auto px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
      >
        {isRecovering ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isRecovering ? "Recovering..." : "Retry"}
      </button>
    </div>
  </div>
);

// Helper function to render Firefox indicator
const renderFirefoxIndicator = (isFirefox: boolean) => {
  if (!isFirefox) return null;

  return (
    <div className="absolute bottom-2 right-2 z-10">
      <div className="rounded-full bg-blue-500/80 px-2 py-1 text-xs text-white">
        Firefox Mode
      </div>
    </div>
  );
};

// Helper function to handle video play logic
const handleVideoPlayLogic = async (
  videoId: string,
  setCurrentlyPlaying: (id: string) => void,
  onPlay?: () => void,
  isFirefox?: boolean,
  forceStopAllVideos?: () => void
) => {
  console.log("🎬 [VideoEmbed] Starting video:", videoId.substring(0, 50) + "...");
  
  // Direct callback execution
  if (onPlay) {
    onPlay();
  } else {
    setCurrentlyPlaying(videoId);
  }
  
  // Firefox handling - run after play, not during
  if (isFirefox && forceStopAllVideos) {
    console.log("🦊 [VideoEmbed] Firefox - cleaning up other videos");
    setTimeout(() => forceStopAllVideos(), 200);
  }
};

// BUNNY.NET ONLY VIDEO EMBED - Rejects all non-Bunny URLs
export const VideoEmbed = memo<VideoEmbedProps>(
  ({ url, className = "", videoId: externalVideoId, isPlaying: externalIsPlaying, onPlay, preload = false, thumbnailUrl }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [iframeKey, setIframeKey] = useState(0); // Make key mutable for recovery
    const [isPreloaded, setIsPreloaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const { currentlyPlayingId } = useVideoPlaybackData();
    const { setCurrentlyPlaying } = useVideoPlaybackAPI();

    // Use external videoId if provided, otherwise use URL
    const videoId = externalVideoId ?? url;

    // Use external isPlaying state if provided, otherwise use internal state
    const isCurrentlyPlaying = externalIsPlaying ?? isPlaying;

    // Firefox detection - disable preloading for Firefox
    const isFirefox = useMemo(() => navigator.userAgent.includes('Firefox'), []);
    const effectivePreload = isFirefox ? false : preload;

    // Enhanced HLS monitoring and recovery
    const { attemptRecovery, recoveryAttempts, maxAttempts } = useHLSRecovery({
      videoRef: iframeRef,
      videoId,
      url
    });

    const { bufferHealth } = usePreemptiveBufferManagement({
      videoRef: iframeRef,
      isPlaying: isCurrentlyPlaying
    });

    // Firefox video manager for handling Firefox-specific issues
    const { forceStopAllVideos } = useFirefoxVideoManager({
      videoId,
      isPlaying: isCurrentlyPlaying,
      onVideoStop: () => {
        console.log("🦊 [VideoEmbed] Firefox video stop callback triggered");
        setIsPlaying(false);
      }
    });

    // Handle HLS recovery by recreating iframe
    const handleHLSRecovery = useCallback(() => {
      console.log("🔄 [VideoEmbed] Force recreating iframe for HLS recovery");
      setIframeKey(prev => prev + 1);
      setHasError(false);
      setIsRecovering(false);
    }, []);

    // Enhanced buffer issue handler
    const handleBufferIssue = useCallback((issueType: string) => {
      console.warn(`🚨 [VideoEmbed] Buffer issue detected: ${issueType}`);
      setHasError(true);

      if (recoveryAttempts >= maxAttempts) {
        console.error("❌ [VideoEmbed] Max recovery attempts reached");
        return;
      }

      setIsRecovering(true);
      attemptRecovery(issueType).then(result => {
        if (result === 'recreate_iframe') {
          handleHLSRecovery();
        }
        setIsRecovering(false);
      });
    }, [recoveryAttempts, maxAttempts, attemptRecovery, handleHLSRecovery]);

    // Use the enhanced monitoring hook
    useHLSBufferMonitor({
      videoRef: iframeRef,
      isPlaying: isCurrentlyPlaying,
      onBufferIssue: handleBufferIssue
    });

    // Firefox-aware iframe parameters
    const getIframeParams = useCallback((playing: boolean): Record<string, string> => {
      if (playing) {
        return { metrics: 'false', autoplay: 'true', muted: 'true', preload: 'true' };
      }
      // For non-playing videos, explicitly set autoplay=false and preload=none for Firefox
      return isFirefox 
        ? { metrics: 'false', autoplay: 'false', preload: 'none' }
        : { metrics: 'false', autoplay: 'false', preload: 'true' };
    }, [isFirefox]);

    // Dynamic iframe src based on playing state
    const iframeSrc = useMemo(() => {
      return buildIframeSrc(url, getIframeParams(isCurrentlyPlaying));
    }, [url, isCurrentlyPlaying, getIframeParams]);

    // Helper function to handle preload logic
    const handlePreloadLogic = useCallback(() => {
      if (!effectivePreload || isPreloaded || !videoId) return;

      console.log("🔄 [VideoEmbed] Preloading iframe for:", videoId.substring(0, 50) + "...");

      // Create a hidden iframe for preloading (skip for Firefox)
      const preloadFrame = createPreloadIframe(url, videoId, isFirefox);
      if (!preloadFrame) {
        setIsPreloaded(true);
        return;
      }

      document.body.appendChild(preloadFrame);

      // Set a timeout to remove the preload iframe after a delay
      preloadTimeoutRef.current = setTimeout(() => {
        if (preloadFrame.parentElement) {
          preloadFrame.parentElement.removeChild(preloadFrame);
        }
        setIsPreloaded(true);
        console.log("✅ [VideoEmbed] Preload completed for:", videoId.substring(0, 50) + "...");
      }, 10000); // Remove after 10 seconds

      return () => {
        if (preloadTimeoutRef.current) {
          clearTimeout(preloadTimeoutRef.current);
        }
        if (preloadFrame.parentElement) {
          preloadFrame.parentElement.removeChild(preloadFrame);
        }
      };
    }, [effectivePreload, isPreloaded, videoId, url, isFirefox]);

    // Preload iframe for better performance (disabled for Firefox)
    useEffect(() => {
      return handlePreloadLogic();
    }, [handlePreloadLogic]);

    // Simplified video play handler - no delays, immediate response
    const handlePlay = useCallback(async () => {
      if (!isCurrentlyPlaying && videoId) {
        console.log("🎬 [VideoEmbed] Starting video play:", videoId);
        
        // Set loading state immediately
        setIsLoading(true);
        setHasError(false);
        
        try {
          // Direct state update - no complex logic
          if (onPlay) {
            onPlay();
          } else {
            setCurrentlyPlaying(videoId);
          }
          
          // Firefox handling - but don't let it block play
          if (isFirefox && forceStopAllVideos) {
            console.log("🦊 [VideoEmbed] Firefox - stopping other videos");
            // Run this after our video starts, not before
            setTimeout(() => forceStopAllVideos(), 100);
          }
          
          // Immediate state update - no 800ms delay
          setIsPlaying(true);
          setIsLoading(false);
          
        } catch (error) {
          console.error("❌ [VideoEmbed] Play failed:", error);
          setHasError(true);
          setIsLoading(false);
        }
      }
    }, [isCurrentlyPlaying, videoId, setCurrentlyPlaying, onPlay, isFirefox, forceStopAllVideos]);

    // Improved state management - immediate updates
    useEffect(() => {
      if (externalIsPlaying !== undefined) {
        // External control mode - immediate update
        setIsPlaying(externalIsPlaying);
        setIsLoading(false);
      } else if (currentlyPlayingId !== videoId && isPlaying) {
        // Context control mode - immediate stop
        console.log("⏸️ [VideoEmbed] Stopping video immediately");
        setIsPlaying(false);
        setIsLoading(false);
        // No iframe recreation needed - just stop
      }
    }, [currentlyPlayingId, videoId, isPlaying, externalIsPlaying]);

    // CRITICAL: Only allow Bunny.net iframe URLs - REJECT EVERYTHING ELSE
    if (!isBunnyUrl(url)) {
      console.warn("🚫 [VideoEmbed] Rejected non-Bunny URL:", url);
      return (
        <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
          <div className="p-4 text-center">
            <div className="text-sm font-medium">Video Processing Required</div>
            <div className="mt-1 text-xs text-gray-400">Only Bunny.net CDN videos supported</div>
          </div>
        </div>
      );
    }

    return (
      <div className={`group relative w-full overflow-hidden rounded-lg bg-black ${className}`}>
        <div className="relative h-0 w-full pb-[177.78%]">
          {/* Render thumbnail image when not playing, iframe when playing */}
          {isCurrentlyPlaying ? (
            <iframe
              key={`video-${iframeKey}`}
              ref={iframeRef}
              src={iframeSrc}
              data-video-id={videoId}
              className="absolute inset-0 h-full w-full"
              frameBorder="0"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <img
              src={thumbnailUrl ?? ''}
              alt="Video thumbnail"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Click overlay for play button */}
          {!isCurrentlyPlaying && !hasError && (
            <div
              className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
              onClick={handlePlay}
            >
              <div className="rounded-full bg-black/60 p-6 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}

          {/* Error overlay with recovery option */}
          {hasError && renderErrorOverlay(isRecovering, handleHLSRecovery)}

          {/* Preload indicator removed per user request */}

          {/* Buffer health indicator */}
          {isCurrentlyPlaying && bufferHealth !== 'healthy' && (
            <div className="absolute top-2 left-2 z-10">
              <div className={`rounded-full px-2 py-1 text-xs text-white ${
                bufferHealth === 'critical' ? 'bg-red-500/80' : 'bg-yellow-500/80'
              }`}>
                {bufferHealth === 'critical' ? 'Low Buffer' : 'Buffer Low'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.url === nextProps.url &&
    prevProps.videoId === nextProps.videoId &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.preload === nextProps.preload,
);

VideoEmbed.displayName = "VideoEmbed";
