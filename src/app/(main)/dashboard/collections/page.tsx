"use client";

import { useState, useEffect, useCallback } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Plus, Play, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Video, type Collection } from "@/lib/collections";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { VideoInsightsModal } from "./_components/video-insights-modal";

interface VideoWithPlayer extends Video {
  isPlaying?: boolean;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const selectedCollectionId = searchParams.get("collection");

  const loadCollections = useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await CollectionsService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, [user]);

  const loadVideos = useCallback(async () => {
    if (!user) return;

    setLoadingVideos(true);
    try {
      const collectionVideos = await CollectionsService.getCollectionVideos(
        user.uid,
        selectedCollectionId ?? undefined,
      );
      setVideos(collectionVideos.map((video) => ({ ...video, isPlaying: false })));
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [user, selectedCollectionId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadCollections(), loadVideos()]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user, selectedCollectionId, loadCollections, loadVideos]);

  const handleVideoAdded = () => {
    loadCollections();
    loadVideos();
  };

  const toggleVideoPlay = (videoId: string) => {
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
      setVideos((prev) => prev.map((v) => ({ ...v, isPlaying: false })));
    } else {
      setPlayingVideoId(videoId);
      setVideos((prev) =>
        prev.map((v) => ({
          ...v,
          isPlaying: v.id === videoId,
        })),
      );
    }
  };

  const getPageTitle = () => {
    if (!selectedCollectionId) {
      return "All Videos";
    }

    const collection = collections.find((c) => c.id === selectedCollectionId);
    return collection ? collection.title : "Collection";
  };

  const getPageDescription = () => {
    if (!selectedCollectionId) {
      return "All your videos across collections";
    }

    const collection = collections.find((c) => c.id === selectedCollectionId);
    return collection?.description ?? "Collection videos";
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "tiktok":
        return "bg-black text-white";
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "youtube":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-[9/16] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getPageTitle()}</h1>
          <p className="text-muted-foreground">{getPageDescription()}</p>
        </div>
        <AddVideoDialog
          collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
          selectedCollectionId={selectedCollectionId ?? undefined}
          onVideoAdded={handleVideoAdded}
        />
      </div>

      <Separator />

      {/* Videos Grid */}
      {loadingVideos ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="aspect-[9/16] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted mb-4 rounded-full p-4">
            <Plus className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-medium">No videos yet</h3>
          <p className="text-muted-foreground mb-4">Add your first video to get started with content analysis</p>
          <AddVideoDialog
            collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
            selectedCollectionId={selectedCollectionId ?? undefined}
            onVideoAdded={handleVideoAdded}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {videos.map((video) => (
            <Card key={video.id} className="group overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                {/* Video Thumbnail/Player */}
                <div className="relative aspect-[9/16] bg-black">
                  {video.isPlaying ? (
                    <video
                      src={video.url}
                      className="h-full w-full object-cover"
                      controls
                      autoPlay
                      onEnded={() => toggleVideoPlay(video.id!)}
                    />
                  ) : (
                    <>
                      <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 hover:bg-white"
                          onClick={() => toggleVideoPlay(video.id!)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}

                  {/* Platform Badge */}
                  <Badge className={`absolute top-2 left-2 ${getPlatformColor(video.platform)}`}>
                    {video.platform}
                  </Badge>
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-sm font-medium">{video.title}</h3>
                  <p className="text-muted-foreground mb-3 text-xs">by {video.author}</p>

                  {/* Insights Button */}
                  <VideoInsightsModal video={video}>
                    <Button variant="outline" size="sm" className="w-full">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Insights
                    </Button>
                  </VideoInsightsModal>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
