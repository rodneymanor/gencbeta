"use client";

import { useState, useEffect, useCallback } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Plus, Play, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="relative mx-auto w-full max-w-sm">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                <CardContent className="p-0">
                  <Skeleton className="aspect-[9/16] w-full rounded-xl" />
                </CardContent>
              </Card>
            </div>
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

      {/* Videos Grid */}
      {loadingVideos ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="relative mx-auto w-full max-w-sm">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                <CardContent className="p-0">
                  <Skeleton className="aspect-[9/16] w-full rounded-xl" />
                </CardContent>
              </Card>
            </div>
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
            <div key={video.id} className="relative mx-auto w-full max-w-sm">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-black shadow-2xl">
                <CardContent className="p-0">
                  {/* Video Container */}
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-black">
                    {video.isPlaying ? (
                      <video
                        src={video.url}
                        className="h-full w-full rounded-xl object-cover"
                        controls
                        autoPlay
                        onEnded={() => toggleVideoPlay(video.id!)}
                      />
                    ) : (
                      <div
                        className="relative h-full w-full cursor-pointer bg-black"
                        onClick={() => toggleVideoPlay(video.id!)}
                      >
                        <Image src={video.thumbnailUrl} alt={video.title} fill className="rounded-xl object-cover" />
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 hover:opacity-100">
                          <div className="rounded-full bg-white/90 p-4 transition-all duration-200 hover:scale-110 hover:bg-white">
                            <Play className="ml-1 h-6 w-6 text-black" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metrics Overlay */}
                    <div className="absolute right-0 bottom-0 left-0 rounded-b-xl bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">👁️</span>
                            <span className="text-sm font-medium">{formatNumber(video.insights.views)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">❤️</span>
                            <span className="text-sm font-medium">{formatNumber(video.insights.likes)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">💬</span>
                            <span className="text-sm font-medium">{formatNumber(video.insights.comments)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Insights Button */}
                    <VideoInsightsModal video={video}>
                      <Button
                        size="sm"
                        className="absolute top-4 right-4 border-0 bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/70"
                      >
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Insights
                      </Button>
                    </VideoInsightsModal>

                    {/* Platform Badge */}
                    <Badge className={`absolute top-4 left-4 border-0 capitalize ${getPlatformColor(video.platform)}`}>
                      {video.platform}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
