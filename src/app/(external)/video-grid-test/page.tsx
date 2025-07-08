"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsRBACService, type Video } from "@/lib/collections-rbac";
import { VideoPlaybackProvider } from "@/contexts/video-playback-context";
import { VideoEmbed } from "@/components/video-embed";
import Link from "next/link";

// Test Video Grid Component
const TestVideoGrid = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadVideos = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        console.log("🔍 [TEST] Loading all videos for user:", user.uid);
        
        // Load all videos (no collection filter = "All Videos")
        const allVideos = await CollectionsRBACService.getCollectionVideos(user.uid);
        
        console.log("✅ [TEST] Loaded videos:", allVideos.length);
        setVideos(allVideos);
      } catch (err) {
        console.error("❌ [TEST] Error loading videos:", err);
        setError(err instanceof Error ? err.message : "Failed to load videos");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideos();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Videos</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">📹</div>
          <h2 className="text-xl font-semibold mb-2">No Videos Found</h2>
          <p className="text-muted-foreground">No videos are available in your collections.</p>
        </div>
      </div>
    );
  }

  // Limit to 9 videos (3x3 grid)
  const displayVideos = videos.slice(0, 9);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Video Grid Test</h1>
          <p className="text-muted-foreground">
            Testing single video playback with {displayVideos.length} videos from "All Videos" collection
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Only one video can play at a time. Click any video to start playback.
          </div>
          
          {/* Navigation Links */}
          <div className="mt-6 flex justify-center gap-4">
            <Link 
              href="/video-grid-test/advanced"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Advanced Test (Player.js)
            </Link>
            <Link 
              href="/research/collections"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Back to Collections
            </Link>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayVideos.map((video, index) => (
            <div
              key={video.id}
              className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Video Container */}
              <div className="relative aspect-[9/16] bg-black">
                <VideoEmbed 
                  url={video.iframeUrl || video.directUrl || ""} 
                  className="w-full h-full"
                />
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {video.title || `Video ${index + 1}`}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="capitalize">{video.platform}</span>
                  {video.metrics && (
                    <div className="flex items-center gap-2">
                      <span>❤️ {video.metrics.likes || 0}</span>
                      <span>👁️ {video.metrics.views || 0}</span>
                    </div>
                  )}
                </div>

                {video.metadata?.author && (
                  <p className="text-xs text-muted-foreground mt-1">
                    by @{video.metadata.author}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Showing {displayVideos.length} of {videos.length} total videos</p>
          {videos.length > 9 && (
            <p className="mt-1">Only first 9 videos displayed for testing</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Test Page
export default function VideoGridTestPage() {
  return (
    <VideoPlaybackProvider>
      <TestVideoGrid />
    </VideoPlaybackProvider>
  );
} 