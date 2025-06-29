"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

interface VideoPlaybackContextType {
  currentlyPlayingId: string | null;
  setCurrentlyPlaying: (videoId: string | null) => void;
  isPlaying: (videoId: string) => boolean;
}

const VideoPlaybackContext = createContext<VideoPlaybackContextType | undefined>(undefined);

export const VideoPlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const setCurrentlyPlaying = useCallback(
    (videoId: string | null) => {
      console.log(`🎬 [VideoPlayback] Setting currently playing video:`, {
        previous: currentlyPlayingId,
        new: videoId,
        action: videoId ? "start" : "stop",
      });
      setCurrentlyPlayingId(videoId);
    },
    [currentlyPlayingId],
  );

  const isPlaying = useCallback(
    (videoId: string) => {
      return currentlyPlayingId === videoId;
    },
    [currentlyPlayingId],
  );

  const value = useMemo(
    () => ({
      currentlyPlayingId,
      setCurrentlyPlaying,
      isPlaying,
    }),
    [currentlyPlayingId, setCurrentlyPlaying, isPlaying],
  );

  return <VideoPlaybackContext.Provider value={value}>{children}</VideoPlaybackContext.Provider>;
};

export const useVideoPlayback = () => {
  const context = useContext(VideoPlaybackContext);
  if (context === undefined) {
    throw new Error("useVideoPlayback must be used within a VideoPlaybackProvider");
  }
  return context;
};
