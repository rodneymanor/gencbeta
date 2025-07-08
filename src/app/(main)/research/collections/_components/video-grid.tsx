"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

import { useFirefoxVideoManager } from "@/hooks/use-firefox-video-manager";

import type { Collection, Video } from "@/lib/collections";
import type { VideoWithPlayer } from "./collections-helpers";

import { VideoCard } from "./video-card";

interface VideoGridProps {
  collectionId: string;
  collection?: Collection;
  videos?: Video[];
}

export const VideoGrid = ({ collectionId, collection, videos }: VideoGridProps) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isFirefox, setIsFirefox] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [visibleVideos, setVisibleVideos] = useState<Set<string>>(new Set());
  const lastPlayTime = useRef<number>(0);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Firefox video manager for handling Firefox-specific issues
  const { forceStopAllVideos } = useFirefoxVideoManager({
    videoId: currentlyPlayingId ?? "",
    isPlaying: !!currentlyPlayingId,
    onVideoStop: () => {
      console.log("🦊 [VideoGrid] Firefox video stop callback triggered");
      setCurrentlyPlayingId(null);
    }
  });

  // Detect Firefox browser
  useEffect(() => {
    setIsFirefox(navigator.userAgent.includes('Firefox'));
  }, []);

  // Enhanced video play handler with cooldown and Firefox support
  const handleVideoPlay = useCallback((videoId: string) => {
    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayTime.current;

    // Cooldown check (3.5 seconds)
    if (timeSinceLastPlay < 3500) {
      console.log("⏳ [VideoGrid] Cooldown active, ignoring video play request");
      return;
    }

    // Clear any existing cooldown
    if (cooldownRef.current) {
      clearTimeout(cooldownRef.current);
    }

    console.log("🎬 [VideoGrid] Playing video:", videoId);

    // For Firefox, force stop all other videos first
    if (isFirefox) {
      console.log("🦊 [VideoGrid] Firefox detected - forcing stop of all other videos");
      forceStopAllVideos();
    }

    // Set currently playing video
    setCurrentlyPlayingId(videoId);
    lastPlayTime.current = now;

    // Set cooldown
    cooldownRef.current = setTimeout(() => {
      console.log("✅ [VideoGrid] Cooldown expired");
    }, 3500);
  }, [isFirefox, forceStopAllVideos]);

  // Cleanup cooldown on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, []);

  // Convert videos to VideoWithPlayer format
  const videosWithPlayer: VideoWithPlayer[] = useMemo(() => {
    return (videos ?? []).map((video: Video) => ({
      ...video,
      id: video.id ?? "",
      title: video.title ?? "Untitled Video",
      platform: video.platform ?? "Unknown",
      thumbnailUrl: video.thumbnailUrl ?? "",
      metrics: video.metrics ?? { likes: 0, comments: 0, shares: 0, views: 0, saves: 0 },
      metadata: video.metadata ?? { originalUrl: "", platform: "", downloadedAt: "" },
      addedAt: video.addedAt ?? new Date().toISOString(),
    }));
  }, [videos]);

  // Lazy loading setup
  useEffect(() => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const videoId = entry.target.getAttribute('data-video-id');
            if (videoId) {
              if (entry.isIntersecting) {
                setVisibleVideos(prev => new Set([...prev, videoId]));
              } else {
                // Keep video visible once it's been loaded to prevent flickering
                // setVisibleVideos(prev => {
                //   const newSet = new Set(prev);
                //   newSet.delete(videoId);
                //   return newSet;
                // });
              }
            }
          });
        },
        {
          rootMargin: '100px', // Start loading when 100px away
          threshold: 0.1,
        }
      );
    }

    // Observe all video cards
    const videoCards = document.querySelectorAll('[data-video-id]');
    videoCards.forEach((card) => {
      observerRef.current?.observe(card);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [videosWithPlayer]);

  // Show first 6 videos immediately, then lazy load the rest
  const initialVisibleCount = isFirefox ? 3 : 6; // Show fewer videos initially for Firefox
  const visibleVideosList = videosWithPlayer.slice(0, initialVisibleCount);

  if (!videosWithPlayer || videosWithPlayer.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900">No videos in this collection</div>
          <div className="text-sm text-gray-500">Add some videos to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {videosWithPlayer.map((video, index) => (
        <div key={video.id} data-video-id={video.id}>
          <VideoCard
            video={video}
            isManageMode={isManageMode}
            isSelected={selectedVideos.has(video.id)}
            isDeleting={deletingVideos.has(video.id)}
            onToggleSelection={() => {
              const newSelected = new Set(selectedVideos);
              if (newSelected.has(video.id)) {
                newSelected.delete(video.id);
              } else {
                newSelected.add(video.id);
              }
              setSelectedVideos(newSelected);
            }}
            onDelete={() => {
              console.log("🗑️ [VideoGrid] Delete video:", video.id);
              // TODO: Implement actual deletion
            }}
            isPlaying={currentlyPlayingId === video.id}
            onPlay={handleVideoPlay}
          />
        </div>
      ))}
    </div>
  );
};
