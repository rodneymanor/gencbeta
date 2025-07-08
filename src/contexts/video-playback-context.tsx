"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

// Simplified contexts for better performance
interface VideoPlaybackData {
  currentlyPlayingId: string | null;
}

interface VideoPlaybackAPI {
  setCurrentlyPlaying: (videoId: string | null) => void;
  pauseAll: () => void;
}

const VideoPlaybackDataContext = createContext<VideoPlaybackData | null>(null);
const VideoPlaybackAPIContext = createContext<VideoPlaybackAPI | null>(null);

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  // PRODUCTION SOLUTION: Enhanced pause all function
  const pauseAllVideos = useCallback((excludeId?: string) => {
    console.log("⏸️ [VideoPlayback] Pausing all videos", excludeId ? `(excluding ${excludeId})` : "");

    // Pause all HTML5 video elements except the one we are about to play
    document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
      const vidId = video.dataset.videoId;
      if (!video.paused && (!excludeId || vidId !== excludeId)) {
        video.pause();
      }
    });

    // Bunny.net iframes are handled by VideoEmbed recreating the iframe when currentlyPlayingId changes
  }, []);

  // OPTIMIZED: Simple setCurrentlyPlaying without complex async operations
  const setCurrentlyPlaying = useCallback(
    (videoId: string | null) => {
      console.log("🎬 [VideoPlayback] Setting currently playing:", {
        previous: currentlyPlayingId ? currentlyPlayingId.substring(0, 50) + "..." : "null",
        new: videoId ? videoId.substring(0, 50) + "..." : "null",
      });

      // Pause other videos when starting a new one
      if (videoId && videoId !== currentlyPlayingId) {
        pauseAllVideos(videoId);
      }

      setCurrentlyPlayingId(videoId);
    },
    [currentlyPlayingId, pauseAllVideos],
  );

  // SIMPLIFIED: Basic pause all function
  const pauseAll = useCallback(() => {
    pauseAllVideos();
    setCurrentlyPlayingId(null);
  }, [pauseAllVideos]);

  // Memoize data and API separately to minimize re-renders
  const data = useMemo(
    () => ({
      currentlyPlayingId,
    }),
    [currentlyPlayingId],
  );

  const api = useMemo(
    () => ({
      setCurrentlyPlaying,
      pauseAll,
    }),
    [setCurrentlyPlaying, pauseAll],
  );

  return (
    <VideoPlaybackDataContext.Provider value={data}>
      <VideoPlaybackAPIContext.Provider value={api}>{children}</VideoPlaybackAPIContext.Provider>
    </VideoPlaybackDataContext.Provider>
  );
};

// Custom hooks for accessing the contexts
export const useVideoPlaybackData = (): VideoPlaybackData => {
  const context = useContext(VideoPlaybackDataContext);
  if (!context) {
    throw new Error("useVideoPlaybackData must be used within VideoPlaybackProvider");
  }
  return context;
};

export const useVideoPlaybackAPI = (): VideoPlaybackAPI => {
  const context = useContext(VideoPlaybackAPIContext);
  if (!context) {
    throw new Error("useVideoPlaybackAPI must be used within VideoPlaybackProvider");
  }
  return context;
};
