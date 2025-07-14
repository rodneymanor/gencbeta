"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

import Link from "next/link";

import { useAuth } from "@/contexts/auth-context";
import { CollectionsRBACService, type Video } from "@/lib/collections-rbac";

// Advanced Video Grid Component with Player.js integration
const AdvancedVideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayingVideo, setCurrentPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});
  const playerInstances = useRef<{ [key: string]: any }>({});
  const { user } = useAuth();

  // Function to stop all videos
  const stopAllVideos = useCallback(() => {
    console.log("⏸️ [ADVANCED] Stopping all videos");

    Object.values(playerInstances.current).forEach((player) => {
      if (player && typeof player.pause === "function") {
        try {
          player.pause();
        } catch (error) {
          console.warn("⚠️ [ADVANCED] Error pausing player:", error);
        }
      }
    });

    // Also use postMessage for iframe communication
    Object.values(videoRefs.current).forEach((iframe) => {
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage({ command: "pause" }, "*");
        } catch (error) {
          console.warn("⚠️ [ADVANCED] Error sending postMessage:", error);
        }
      }
    });
  }, []);

  // Function to handle video play
  const handleVideoPlay = useCallback(
    (videoId: string) => {
      console.log("🎬 [ADVANCED] Playing video:", videoId);

      // Stop all other videos first
      stopAllVideos();

      // Set current playing video
      setCurrentPlayingVideo(videoId);

      // Play the selected video
      const targetIframe = videoRefs.current[videoId];
      if (targetIframe && targetIframe.contentWindow) {
        try {
          targetIframe.contentWindow.postMessage({ command: "play" }, "*");
        } catch (error) {
          console.warn("⚠️ [ADVANCED] Error sending play command:", error);
        }
      }
    },
    [stopAllVideos],
  );

  // Load videos
  useEffect(() => {
    const loadVideos = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log("🔍 [ADVANCED] Loading all videos for user:", user.uid);

        const allVideos = await CollectionsRBACService.getCollectionVideos(user.uid);
        console.log("✅ [ADVANCED] Loaded videos:", allVideos.length);
        setVideos(allVideos);
      } catch (err) {
        console.error("❌ [ADVANCED] Error loading videos:", err);
        setError(err instanceof Error ? err.message : "Failed to load videos");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, [user]);

  // Initialize Player.js for each video
  useEffect(() => {
    const initializePlayers = () => {
      videos.forEach((video) => {
        const iframe = videoRefs.current[video.id!];
        if (iframe && !playerInstances.current[video.id!]) {
          // Wait for iframe to load
          iframe.onload = () => {
            try {
              // Check if Player.js is available
              if (window.playerjs) {
                console.log(`🎬 [ADVANCED] Initializing Player.js for video ${video.id}`);

                // Initialize player.js for this iframe
                const player = new window.playerjs.Player(iframe);

                player.on("ready", () => {
                  console.log(`✅ [ADVANCED] Player ${video.id} is ready`);
                });

                player.on("play", () => {
                  console.log(`▶️ [ADVANCED] Video ${video.id} started playing`);
                  // Stop all other videos when this one starts
                  if (currentPlayingVideo !== video.id) {
                    stopAllVideos();
                    setCurrentPlayingVideo(video.id);
                  }
                });

                player.on("pause", () => {
                  console.log(`⏸️ [ADVANCED] Video ${video.id} paused`);
                  if (currentPlayingVideo === video.id) {
                    setCurrentPlayingVideo(null);
                  }
                });

                player.on("ended", () => {
                  console.log(`🔚 [ADVANCED] Video ${video.id} ended`);
                  setCurrentPlayingVideo(null);
                });

                playerInstances.current[video.id!] = player;
              } else {
                console.warn("⚠️ [ADVANCED] Player.js not available, using postMessage fallback");
              }
            } catch (error) {
              console.error(`❌ [ADVANCED] Error initializing player for video ${video.id}:`, error);
            }
          };
        }
      });
    };

    // Load Player.js if not already loaded
    if (!window.playerjs) {
      console.log("📦 [ADVANCED] Loading Player.js...");
      const script = document.createElement("script");
      script.src = "https://cdn.embed.ly/player-0.1.0.min.js";
      script.onload = () => {
        console.log("✅ [ADVANCED] Player.js loaded successfully");
        initializePlayers();
      };
      script.onerror = () => {
        console.warn("⚠️ [ADVANCED] Failed to load Player.js, using postMessage fallback");
        initializePlayers();
      };
      document.head.appendChild(script);
    } else {
      initializePlayers();
    }

    // Cleanup function
    return () => {
      Object.values(playerInstances.current).forEach((player) => {
        if (player && typeof player.destroy === "function") {
          try {
            player.destroy();
          } catch (error) {
            console.warn("⚠️ [ADVANCED] Error destroying player:", error);
          }
        }
      });
      playerInstances.current = {};
    };
  }, [videos, currentPlayingVideo, stopAllVideos]);

  // Listen for messages from iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.event === "video-play") {
        console.log("📡 [ADVANCED] Received video-play event:", event.data.videoId);
        // A video started playing, stop all others
        const playingVideoId = event.data.videoId;
        if (currentPlayingVideo !== playingVideoId) {
          stopAllVideos();
          setCurrentPlayingVideo(playingVideoId);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentPlayingVideo, stopAllVideos]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-500">❌</div>
          <h2 className="mb-2 text-xl font-semibold">Error Loading Videos</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">📹</div>
          <h2 className="mb-2 text-xl font-semibold">No Videos Found</h2>
          <p className="text-muted-foreground">No videos are available in your collections.</p>
        </div>
      </div>
    );
  }

  // Limit to 9 videos (3x3 grid)
  const displayVideos = videos.slice(0, 9);

  return (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Advanced Video Grid Test</h1>
          <p className="text-muted-foreground">
            Testing Player.js integration with {displayVideos.length} videos from "All Videos" collection
          </p>
          <div className="text-muted-foreground mt-4 text-sm">
            Only one video can play at a time. Uses Player.js API for enhanced control.
          </div>
          {currentPlayingVideo && (
            <div className="text-primary mt-2 text-sm">
              Currently playing: {currentPlayingVideo.substring(0, 20)}...
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/video-grid-test"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Basic Test
            </Link>
            <Link
              href="/research/collections"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Back to Collections
            </Link>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayVideos.map((video, index) => (
            <div
              key={video.id}
              className="bg-card border-border overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Video Container */}
              <div className="relative aspect-[9/16] bg-black">
                <iframe
                  ref={(el) => (videoRefs.current[video.id!] = el)}
                  src={video.iframeUrl || video.directUrl || ""}
                  title={video.title || `Video ${index + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />

                {/* Play Button Overlay */}
                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100"
                  onClick={() => handleVideoPlay(video.id)}
                >
                  <div className="rounded-full bg-black/60 p-4 backdrop-blur-sm transition-all hover:scale-110 hover:bg-black/80">
                    <span className="text-2xl text-white">{currentPlayingVideo === video.id ? "⏸️" : "▶️"}</span>
                  </div>
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="mb-2 line-clamp-2 text-sm font-semibold">{video.title || `Video ${index + 1}`}</h3>

                <div className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="capitalize">{video.platform}</span>
                  {video.metrics && (
                    <div className="flex items-center gap-2">
                      <span>❤️ {video.metrics.likes || 0}</span>
                      <span>👁️ {video.metrics.views || 0}</span>
                    </div>
                  )}
                </div>

                {video.metadata?.author && (
                  <p className="text-muted-foreground mt-1 text-xs">by @{video.metadata.author}</p>
                )}

                {/* Play Button */}
                <button
                  onClick={() => handleVideoPlay(video.id)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  {currentPlayingVideo === video.id ? "Pause" : "Play"} Video
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="text-muted-foreground mt-8 text-center text-sm">
          <p>
            Showing {displayVideos.length} of {videos.length} total videos
          </p>
          {videos.length > 9 && <p className="mt-1">Only first 9 videos displayed for testing</p>}
        </div>
      </div>
    </div>
  );
};

// Main Advanced Test Page
export default function AdvancedVideoGridTestPage() {
  return <AdvancedVideoGrid />;
}

// TypeScript declaration for Player.js
declare global {
  interface Window {
    playerjs: any;
  }
}
