"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";

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

  // Add logging to track state changes
  useEffect(() => {
    console.log("🎬 [VideoPlayback] State changed:", {
      currentlyPlayingId,
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
  }, [currentlyPlayingId]);

  // PRODUCTION SOLUTION: Enhanced pause all function
  const pauseAllVideos = useCallback(() => {
    console.log("⏸️ [VideoPlayback] Pausing all videos", {
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });

    // Pause all HTML5 video elements
    document.querySelectorAll("video").forEach((video) => {
      if (!video.paused) {
        video.pause();
      }
    });

    // For Bunny.net iframes: The VideoEmbed components will handle iframe recreation
    // via their useEffect when currentlyPlayingId changes
    // This is more reliable than postMessage to iframes with different origins
  }, []);

  // OPTIMIZED: Simple setCurrentlyPlaying without complex async operations
  const setCurrentlyPlaying = useCallback(
    (videoId: string | null) => {
      console.log("🎬 [VideoPlayback] setCurrentlyPlaying called:", {
        previous: currentlyPlayingId ? currentlyPlayingId.substring(0, 50) + "..." : "null",
        new: videoId ? videoId.substring(0, 50) + "..." : "null",
        timestamp: new Date().toISOString(),
        stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
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
    console.log("⏸️ [VideoPlayback] pauseAll called", {
      timestamp: new Date().toISOString(),
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });

    pauseAllVideos();
    setCurrentlyPlayingId(null);
  }, [pauseAllVideos]);

  // Memoize data and API separately to minimize re-renders
  const data = useMemo(
    () => {
      console.log("🎬 [VideoPlayback] Data memoized", {
        currentlyPlayingId,
        timestamp: new Date().toISOString()
      });
      return {
        currentlyPlayingId,
      };
    },
    [currentlyPlayingId],
  );

  const api = useMemo(
    () => {
      console.log("🎬 [VideoPlayback] API memoized", {
        timestamp: new Date().toISOString()
      });
      return {
        setCurrentlyPlaying,
        pauseAll,
      };
    },
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
