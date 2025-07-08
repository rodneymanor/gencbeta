"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CollectionsRBACService, type Video } from '@/lib/collections-rbac';
import { VideoShowcase } from 'react-product-video-showcase';

interface VideoWithPlayer extends Video {
  isPlaying: boolean;
  iframeUrl?: string; 
}

export default function VideoGridTestPage() {
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadVideos = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const allVideos = await CollectionsRBACService.getCollectionVideos(user.uid);
        const videosWithPlayerState = allVideos.map(v => ({ ...v, isPlaying: false, iframeUrl: v.iframeUrl ?? '' }));
        setVideos(videosWithPlayerState);
      } catch (error) {
        console.error("Failed to load videos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadVideos();
  }, [user]);

  const handlePlay = (videoId: string) => {
    setPlayingVideoId(videoId);
  };

  const productVideos = useMemo(() => videos.map(video => ({
      src: video.iframeUrl ?? '',
      title: video.title ?? 'Untitled',
      id: video.id ?? '',
  })), [videos]);


  if (isLoading) {
    return <div>Loading videos...</div>;
  }

  if (!user) {
    return <div>Please log in to see videos.</div>;
  }

  if (videos.length === 0) {
    return <div>No videos found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Grid Test</h1>
        <VideoShowcase
            videos={productVideos}
            cols={3}
            gap={16}
            onPlay={handlePlay}
            playingId={playingVideoId}
        />
    </div>
  );
} 