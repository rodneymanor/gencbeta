"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Video, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { ManageModeHeader } from "./_components/manage-mode-header";
import { VideoCard } from "./_components/video-card";

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

  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");

  // Role-based access control
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (userProfile && userProfile.role === "creator") {
      // Creators can only view collections, not manage them
      // They see their assigned coach's collections
      return;
    }

    if (userProfile && userProfile.role !== "coach" && userProfile.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, userProfile, router]);

  const loadCollections = useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await CollectionsRBACService.getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
    }
  }, [user]);

  const loadVideos = useCallback(async () => {
    if (!user) return;

    setLoadingVideos(true);
    try {
      console.log("🔍 [COLLECTIONS] Loading videos for user:", user.uid);
      console.log("🔍 [COLLECTIONS] Selected collection:", selectedCollectionId);

      const collectionVideos = await CollectionsRBACService.getCollectionVideos(
        user.uid,
        selectedCollectionId ?? undefined,
      );

      console.log("🔍 [COLLECTIONS] Loaded videos count:", collectionVideos.length);
      console.log(
        "🔍 [COLLECTIONS] Video IDs:",
        collectionVideos.map((v) => v.id),
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

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;

    // Start the delete animation
    setDeletingVideos((prev) => new Set([...prev, videoId]));

    try {
      await CollectionsService.deleteVideo(user.uid, videoId);

      // Wait for animation to complete before removing from state
      setTimeout(() => {
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
        loadVideos();
      }, 300);
    } catch (error) {
      console.error("Error deleting video:", error);
      // Remove from deleting state on error
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(videoId);
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!user || selectedVideos.size === 0) return;

    const videoIds = Array.from(selectedVideos);

    // Start the delete animation for all selected videos
    setDeletingVideos((prev) => new Set([...prev, ...videoIds]));

    try {
      // Delete all selected videos
      await Promise.all(videoIds.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));

      // Wait for animation to complete before removing from state
      setTimeout(() => {
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          videoIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
        setSelectedVideos(new Set());
        loadVideos();
      }, 300);
    } catch (error) {
      console.error("Error deleting videos:", error);
      // Remove from deleting state on error
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        videoIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const toggleVideoSelection = (videoId: string) => {
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

  const selectAllVideos = () => {
    const allVideoIds = videos.map((v) => v.id!);
    setSelectedVideos(new Set(allVideoIds));
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  const handleExitManageMode = () => {
    setManageMode(false);
    setSelectedVideos(new Set());
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
                  <Skeleton className="aspect-[9/16] w-full" />
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
          <ManageModeHeader
            manageMode={manageMode}
            selectedVideos={selectedVideos}
            videosLength={videos.length}
            collections={collections}
            selectedCollectionId={selectedCollectionId}
            onManageModeToggle={() => userProfile?.role !== "creator" && setManageMode(true)}
            onExitManageMode={handleExitManageMode}
            onBulkDelete={handleBulkDelete}
            onClearSelection={clearSelection}
            onSelectAll={selectAllVideos}
            onVideoAdded={handleVideoAdded}
          />
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
            router.push("/research/collections");
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
              router.push(`/research/collections?collection=${collection.id}`);
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
                  <Skeleton className="aspect-[9/16] w-full" />
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
            <VideoCard
              key={video.id}
              video={video}
              manageMode={manageMode}
              isSelected={selectedVideos.has(video.id!)}
              isDeleting={deletingVideos.has(video.id!)}
              onToggleSelection={() => toggleVideoSelection(video.id!)}
              onDelete={() => handleDeleteVideo(video.id!)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
