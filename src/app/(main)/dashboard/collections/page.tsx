"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Plus, Settings, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/video-player";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Video, type Collection } from "@/lib/collections";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { CreateCollectionDialog } from "./_components/create-collection-dialog";

interface VideoWithPlayer extends Video {
  isPlaying?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  hostedOnCDN?: boolean;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [videos, setVideos] = useState<VideoWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videoObjectUrls, setVideoObjectUrls] = useState<Record<string, string>>({});
  const [manageMode, setManageMode] = useState(false);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(videoObjectUrls).forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [videoObjectUrls]);

  const handleVideoAdded = () => {
    loadCollections();
    loadVideos();
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user || !confirm("Are you sure you want to delete this video?")) return;

    try {
      await CollectionsService.deleteVideo(user.uid, videoId);
      loadVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const createVideoObjectUrl = useCallback((video: VideoWithPlayer) => {
    if (video.videoData && !video.hostedOnCDN && video.id) {
      try {
        const uint8Array = new Uint8Array(video.videoData.buffer);
        const blob = new Blob([uint8Array], { type: video.videoData.mimeType });
        const objectUrl = URL.createObjectURL(blob);
        setVideoObjectUrls((prev) => {
          const videoId = video.id!;
          return { ...prev, [videoId]: objectUrl };
        });
        return objectUrl;
      } catch (error) {
        console.error("❌ [VIDEO_PLAYER] Failed to create video blob:", error);
      }
    }
    return null;
  }, []);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setManageMode(!manageMode)}>
            <Settings className="mr-2 h-4 w-4" />
            {manageMode ? "Exit Manage" : "Manage"}
          </Button>
          {!manageMode && (
            <>
              <CreateCollectionDialog onCollectionCreated={handleVideoAdded}>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Collection
                </Button>
              </CreateCollectionDialog>
              <AddVideoDialog
                collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
                selectedCollectionId={selectedCollectionId ?? undefined}
                onVideoAdded={handleVideoAdded}
              />
            </>
          )}
        </div>
      </div>

      {/* Collection Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={!selectedCollectionId ? "default" : "secondary"}
          className={`cursor-pointer transition-colors ${
            !selectedCollectionId ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-secondary/80"
          }`}
          onClick={() => {
            router.push("/dashboard/collections");
          }}
        >
          All Videos ({videos.length})
        </Badge>
        {collections.map((collection) => (
          <Badge
            key={collection.id}
            variant={selectedCollectionId === collection.id ? "default" : "secondary"}
            className={`cursor-pointer transition-colors ${
              selectedCollectionId === collection.id
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "hover:bg-secondary/80"
            }`}
            onClick={() => {
              router.push(`/dashboard/collections?collection=${collection.id}`);
            }}
          >
            {collection.title} ({collection.videoCount})
          </Badge>
        ))}
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
                  {/* Use VideoPlayer Component */}
                  <VideoPlayer
                    videoUrl={video.url}
                    platform={video.platform as "tiktok" | "instagram"}
                    metrics={{
                      views: video.insights.views,
                      likes: video.insights.likes,
                      comments: video.insights.comments,
                      shares: video.insights.shares || 0,
                    }}
                    insights={{
                      reach: video.insights.views * 1.2, // Estimate
                      impressions: video.insights.views * 1.5, // Estimate
                      engagementRate: ((video.insights.likes + video.insights.comments) / video.insights.views) * 100,
                      topHours: ["18:00", "19:00", "20:00"], // Placeholder
                      demographics: [
                        { ageGroup: "18-24", percentage: 35 },
                        { ageGroup: "25-34", percentage: 40 },
                        { ageGroup: "35-44", percentage: 25 },
                      ],
                      growthRate: 15.2, // Placeholder
                    }}
                    title={video.title}
                    author={video.author}
                    hostedOnCDN={video.hostedOnCDN}
                    videoData={video.videoData}
                    className="h-full w-full"
                  />
                </CardContent>
                {manageMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 p-0 text-white hover:bg-red-600"
                    onClick={() => handleDeleteVideo(video.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
