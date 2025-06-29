"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

interface VideoPlaybackContextType {
  currentlyPlayingId: string | null;
  isGloballyPaused: boolean;
  setCurrentlyPlaying: (videoId: string | null) => void;
  pauseAll: () => void;
  pauseAllOtherVideos: (excludeVideoId?: string) => void;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | null>(null);

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isGloballyPaused, setIsGloballyPaused] = useState(false);

  // DOM-level video control as robust backup
  const pauseAllOtherVideosDOM = useCallback((excludeVideoId?: string) => {
    console.log("🛑 [VideoPlayback] DOM-level pause of all other videos");

    // Pause all HTML5 video elements
    const allVideos = document.querySelectorAll("video");
    let pausedCount = 0;

    allVideos.forEach((video) => {
      const videoSrc = video.src ?? video.currentSrc;
      if (videoSrc && videoSrc !== excludeVideoId && !video.paused) {
        console.log("🔇 [VideoPlayback] Force pausing HTML5 video:", videoSrc.substring(0, 50) + "...");
        video.pause();
        pausedCount++;
      }
    });

    // Handle CDN iframes with postMessage
    const allIframes = document.querySelectorAll('iframe[src*="iframe.mediadelivery.net"]');
    allIframes.forEach((iframe) => {
      const iframeSrc = iframe.src;
      if (iframeSrc && iframeSrc !== excludeVideoId) {
        try {
          console.log("📺 [VideoPlayback] Sending pause message to iframe:", iframeSrc.substring(0, 50) + "...");
          iframe.contentWindow?.postMessage('{"method":"pause"}', "*");
          pausedCount++;
        } catch (error) {
          console.warn("⚠️ [VideoPlayback] Could not pause iframe:", error);
        }
      }
    });

    if (pausedCount > 0) {
      console.log("✅ [VideoPlayback] Paused", pausedCount, "videos/iframes");
    }
  }, []);

  // Enhanced setCurrentlyPlaying with immediate DOM-level pause
  const setCurrentlyPlaying = useCallback(
    (videoId: string | null) => {
      console.log("🎬 [VideoPlayback] Setting currently playing video:", {
        previous: currentlyPlayingId ? currentlyPlayingId.substring(0, 50) + "..." : "null",
        new: videoId ? videoId.substring(0, 50) + "..." : "null",
        action: videoId ? "start" : "stop",
      });

      // If setting a new video, immediately pause all others
      if (videoId && videoId !== currentlyPlayingId) {
        pauseAllOtherVideosDOM(videoId);
      }

      setCurrentlyPlayingId(videoId);
      setIsGloballyPaused(false);
    },
    [currentlyPlayingId, pauseAllOtherVideosDOM],
  );

  // Public method for external pause control
  const pauseAllOtherVideos = useCallback(
    (excludeVideoId?: string) => {
      pauseAllOtherVideosDOM(excludeVideoId);
    },
    [pauseAllOtherVideosDOM],
  );

  // Global pause all function
  const pauseAll = useCallback(() => {
    console.log("⏸️ [VideoPlayback] Pausing all videos globally");
    setCurrentlyPlayingId(null);
    setIsGloballyPaused(true);
    pauseAllOtherVideosDOM();
  }, [pauseAllOtherVideosDOM]);

  // Monitor for multiple playing videos (production safeguard)
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const playingVideos = document.querySelectorAll("video:not([paused])");
      if (playingVideos.length > 1) {
        console.warn("⚠️ [VideoPlayback] Multiple videos detected playing! Auto-correcting...");
        playingVideos.forEach((video) => {
          const videoSrc = video.src ?? video.currentSrc;

          if (!currentlyPlayingId || !videoSrc.includes(currentlyPlayingId)) {
            console.log("🔧 [VideoPlayback] Auto-pausing unexpected video:", videoSrc.substring(0, 50) + "...");
            video.pause();
          }
        });
      }
    }, 3000);

    return () => clearInterval(monitorInterval);
  }, [currentlyPlayingId]);

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

  const value = useMemo(
    () => ({
      currentlyPlayingId,
      isGloballyPaused,
      setCurrentlyPlaying,
      pauseAll,
      pauseAllOtherVideos,
    }),
    [currentlyPlayingId, isGloballyPaused, setCurrentlyPlaying, pauseAll, pauseAllOtherVideos],
  );

  return <VideoPlaybackContext.Provider value={value}>{children}</VideoPlaybackContext.Provider>;
};

export const useVideoPlayback = () => {
  const context = useContext(VideoPlaybackContext);
  if (!context) {
    throw new Error("useVideoPlayback must be used within VideoPlaybackProvider");
  }
  return context;
};
