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

  // SIMPLIFIED: Basic pause all function using DOM selectors
  const pauseAllVideos = useCallback(() => {
    console.log("⏸️ [VideoPlayback] Pausing all videos");

    // Simple DOM-based pause for all video elements
    document.querySelectorAll("video").forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });

    // Simple postMessage for iframes
    document.querySelectorAll('iframe[src*="iframe.mediadelivery.net"]').forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage('{"command":"pause"}', "*");
      } catch (error) {
        // Ignore cross-origin errors
      }
    });
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
        pauseAllVideos();
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
