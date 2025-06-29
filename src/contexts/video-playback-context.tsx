"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react";

// Split contexts to minimize re-renders
interface VideoPlaybackData {
  currentlyPlayingId: string | null;
  isGloballyPaused: boolean;
}

interface VideoPlaybackAPI {
  setCurrentlyPlaying: (videoId: string | null) => Promise<void>;
  pauseAll: () => Promise<void>;
  pauseAllOtherVideos: (excludeVideoId?: string) => Promise<void>;
}

const VideoPlaybackDataContext = createContext<VideoPlaybackData | null>(null);
const VideoPlaybackAPIContext = createContext<VideoPlaybackAPI | null>(null);

// Debounce utility
function debounce<T extends(...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isGloballyPaused, setIsGloballyPaused] = useState(false);

  // Track operations in progress to prevent race conditions
  const pauseOperationsRef = useRef(new Set<string>());
  const isSettingVideoRef = useRef(false);

  // Enhanced DOM-level video control with proper async handling
  const pauseAllOtherVideosDOM = useCallback(async (excludeVideoId?: string): Promise<void> => {
    console.log("🛑 [VideoPlayback] DOM-level pause of all other videos");

    const pausePromises: Promise<void>[] = [];

    // Pause all HTML5 video elements
    const allVideos = document.querySelectorAll("video");
    allVideos.forEach((video) => {
      const videoSrc = video.src ?? video.currentSrc;
      if (videoSrc && videoSrc !== excludeVideoId && !video.paused) {
        console.log("🔇 [VideoPlayback] Force pausing HTML5 video:", videoSrc.substring(0, 50) + "...");

        pausePromises.push(
          new Promise<void>((resolve) => {
            const handlePause = () => {
              video.removeEventListener("pause", handlePause);
              resolve();
            };
            video.addEventListener("pause", handlePause);
            video.pause();

            // Fallback timeout in case pause event doesn't fire
            setTimeout(() => {
              video.removeEventListener("pause", handlePause);
              resolve();
            }, 200);
          }),
        );
      }
    });

    // Handle CDN iframes with postMessage and wait for acknowledgment
    const allIframes = document.querySelectorAll('iframe[src*="iframe.mediadelivery.net"]');
    allIframes.forEach((iframe) => {
      const iframeElement = iframe as HTMLIFrameElement;
      const iframeSrc = iframeElement.src;
      if (iframeSrc && iframeSrc !== excludeVideoId) {
        console.log("📺 [VideoPlayback] Sending pause message to iframe:", iframeSrc.substring(0, 50) + "...");

        pausePromises.push(
          new Promise<void>((resolve) => {
            try {
              iframeElement.contentWindow?.postMessage('{"method":"pause"}', "*");
              // Give iframe time to process the pause command
              setTimeout(resolve, 150);
            } catch (error) {
              console.warn("⚠️ [VideoPlayback] Could not pause iframe:", error);
              resolve();
            }
          }),
        );
      }
    });

    // Wait for all pause operations to complete
    await Promise.all(pausePromises);
    console.log("✅ [VideoPlayback] All videos paused successfully");
  }, []);

  // Debounced version to prevent rapid-fire operations
  const debouncedPauseAll = useMemo(() => debounce(pauseAllOtherVideosDOM, 100), [pauseAllOtherVideosDOM]);

  // Enhanced setCurrentlyPlaying with proper async control
  const setCurrentlyPlaying = useCallback(
    async (videoId: string | null): Promise<void> => {
      // Prevent concurrent video setting operations
      if (isSettingVideoRef.current) {
        console.log("⏸️ [VideoPlayback] Video setting in progress, skipping...");
        return;
      }

      isSettingVideoRef.current = true;

      try {
        console.log("🎬 [VideoPlayback] Setting currently playing video:", {
          previous: currentlyPlayingId ? currentlyPlayingId.substring(0, 50) + "..." : "null",
          new: videoId ? videoId.substring(0, 50) + "..." : "null",
          action: videoId ? "start" : "stop",
        });

        // First, pause all other videos and wait for completion
        if (videoId) {
          await pauseAllOtherVideosDOM(videoId);
        }

        // Then update the state
        setCurrentlyPlayingId(videoId);
        setIsGloballyPaused(false);

        console.log("✅ [VideoPlayback] Video state updated successfully");
      } catch (error) {
        console.error("❌ [VideoPlayback] Error setting video:", error);
      } finally {
        isSettingVideoRef.current = false;
      }
    },
    [currentlyPlayingId, pauseAllOtherVideosDOM],
  );

  // Public method for external pause control
  const pauseAllOtherVideos = useCallback(
    async (excludeVideoId?: string): Promise<void> => {
      const operationId = excludeVideoId ?? "global";

      if (pauseOperationsRef.current.has(operationId)) {
        console.log("⏸️ [VideoPlayback] Pause operation already in progress for:", operationId);
        return;
      }

      pauseOperationsRef.current.add(operationId);

      try {
        await pauseAllOtherVideosDOM(excludeVideoId);
      } finally {
        pauseOperationsRef.current.delete(operationId);
      }
    },
    [pauseAllOtherVideosDOM],
  );

  // Global pause all function
  const pauseAll = useCallback(async (): Promise<void> => {
    console.log("⏸️ [VideoPlayback] Pausing all videos globally");

    setCurrentlyPlayingId(null);
    setIsGloballyPaused(true);

    await pauseAllOtherVideosDOM();
  }, [pauseAllOtherVideosDOM]);

  // Monitor for multiple videos playing (reduced frequency)
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const playingVideos = document.querySelectorAll("video:not([paused])");
      if (playingVideos.length > 1) {
        console.warn("⚠️ [VideoPlayback] Multiple videos detected playing! Auto-correcting...");
        playingVideos.forEach((video) => {
          const videoElement = video as HTMLVideoElement;
          const videoSrc = videoElement.src ?? videoElement.currentSrc;

          if (!currentlyPlayingId || !videoSrc.includes(currentlyPlayingId)) {
            console.log("🔧 [VideoPlayback] Auto-pausing unexpected video:", videoSrc.substring(0, 50) + "...");
            videoElement.pause();
          }
        });
      }
    }, 5000); // Reduced from 3000 to 5000ms to prevent interference

    return () => clearInterval(monitorInterval);
  }, [currentlyPlayingId]);

  // Lifecycle management
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("📱 [VideoPlayback] Tab hidden - pausing all videos");
        pauseAll();
      }
    };

    const handleBeforeUnload = () => {
      console.log("🚪 [VideoPlayback] Page unloading - cleaning up videos");
      pauseAll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pauseAll]);

  useEffect(() => {
    const handleBlur = () => {
      console.log("👁️ [VideoPlayback] Window lost focus - pausing videos");
      pauseAll();
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, [pauseAll]);

  // Memoize data and API separately to minimize re-renders
  const data = useMemo(
    () => ({
      currentlyPlayingId,
      isGloballyPaused,
    }),
    [currentlyPlayingId, isGloballyPaused],
  );

  const api = useMemo(
    () => ({
      setCurrentlyPlaying,
      pauseAll,
      pauseAllOtherVideos,
    }),
    [setCurrentlyPlaying, pauseAll, pauseAllOtherVideos],
  );

  return (
    <VideoPlaybackDataContext.Provider value={data}>
      <VideoPlaybackAPIContext.Provider value={api}>{children}</VideoPlaybackAPIContext.Provider>
    </VideoPlaybackDataContext.Provider>
  );
};

// Custom hooks for accessing the split contexts
export const useVideoPlaybackData = () => {
  const context = useContext(VideoPlaybackDataContext);
  if (!context) {
    throw new Error("useVideoPlaybackData must be used within VideoPlaybackProvider");
  }
  return context;
};

export const useVideoPlaybackAPI = () => {
  const context = useContext(VideoPlaybackAPIContext);
  if (!context) {
    throw new Error("useVideoPlaybackAPI must be used within VideoPlaybackProvider");
  }
  return context;
};

// Legacy hook for backward compatibility
export const useVideoPlayback = () => {
  const data = useVideoPlaybackData();
  const api = useVideoPlaybackAPI();

  return {
    ...data,
    ...api,
  };
};
