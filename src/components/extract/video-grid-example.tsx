"use client";

import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { VideoGridDisplay, type VideoGridVideo } from "./video-grid-display";

// Example usage of the VideoGridDisplay component
export function VideoGridExample() {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [manageMode, setManageMode] = useState(false);
  const [mode, setMode] = useState<"instagram" | "traditional">("instagram");

  // Sample video data
  const sampleVideos: VideoGridVideo[] = [
    {
      id: "1",
      thumbnailUrl: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=600&fit=crop",
      title: "Amazing Sunset Views",
      description: "Breathtaking sunset captured from the mountains",
      duration: 125,
      views: 15420,
      likes: 892,
      favorite: true,
      collectionId: "collection-1",
      addedAt: new Date().toISOString(), // This will show "New" badge
    },
    {
      id: "2",
      thumbnailUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop",
      title: "Mountain Adventure",
      description: "Exploring the highest peaks",
      duration: 89,
      views: 8920,
      likes: 456,
      favorite: false,
      collectionId: "collection-1",
    },
    {
      id: "3",
      thumbnailUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop",
      title: "Forest Walk",
      description: "Peaceful walk through ancient forests",
      duration: 203,
      views: 23410,
      likes: 1234,
      favorite: true,
      collectionId: "collection-2",
    },
  ];

  const handleToggleSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingVideos((prev) => new Set([...prev, videoId]));

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In a real app, you would call your delete API here
    console.log("Deleting video:", videoId);

    setDeletingVideos((prev) => {
      const newSet = new Set(prev);
      newSet.delete(videoId);
      return newSet;
    });
  };

  const handleFavorite = (video: VideoGridVideo, index: number) => {
    console.log("Toggling favorite for video:", video.id);
    // In a real app, you would call your API here
  };

  const handleVideoClick = (video: VideoGridVideo, index: number) => {
    console.log("Video clicked:", video, "at index:", index);
    // In a real app, you might open a lightbox or navigate to video detail
  };

  const handleLoadMore = async () => {
    console.log("Loading more videos...");
    // In a real app, you would fetch more videos from your API
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const renderBadge = (video: VideoGridVideo) => {
    if (video.addedAt && Date.now() - new Date(video.addedAt).getTime() < 1000 * 60 * 60 * 24) {
      return <Badge className="bg-green-500 text-white">New</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Video Grid Display Example</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <Button
              variant={mode === "instagram" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("instagram")}
            >
              Instagram
            </Button>
            <Button
              variant={mode === "traditional" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("traditional")}
            >
              Traditional
            </Button>
          </div>

          <Button variant={manageMode ? "destructive" : "outline"} size="sm" onClick={() => setManageMode(!manageMode)}>
            {manageMode ? "Exit Manage Mode" : "Manage Mode"}
          </Button>
        </div>
      </div>

      {manageMode && selectedVideos.size > 0 && (
        <div className="bg-secondary flex items-center justify-between rounded-lg p-4">
          <span className="text-sm font-medium">
            {selectedVideos.size} video{selectedVideos.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              selectedVideos.forEach((videoId) => handleDeleteVideo(videoId));
              setSelectedVideos(new Set());
            }}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <VideoGridDisplay
        videos={sampleVideos}
        mode={mode}
        manageMode={manageMode}
        selectedVideos={selectedVideos}
        deletingVideos={deletingVideos}
        hasMoreVideos={true}
        isLoadingMore={false}
        onVideoClick={handleVideoClick}
        onFavorite={handleFavorite}
        onToggleSelection={handleToggleSelection}
        onDeleteVideo={handleDeleteVideo}
        onLoadMore={handleLoadMore}
        renderBadge={renderBadge}
        emptyStateMessage="No videos found. Add some videos to get started!"
      />

      <div className="bg-muted mt-8 rounded-lg p-4">
        <h3 className="mb-2 text-lg font-semibold">Usage Instructions:</h3>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>• Click videos to view them (in normal mode) or select them (in manage mode)</li>
          <li>• Use the bookmark icon to favorite/unfavorite videos</li>
          <li>• Toggle between Instagram and Traditional display modes</li>
          <li>• Enable manage mode to select and delete videos</li>
          <li>• Videos with "New" badges were added within the last 24 hours</li>
        </ul>
      </div>
    </div>
  );
}
