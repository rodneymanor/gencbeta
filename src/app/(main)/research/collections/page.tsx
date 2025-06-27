"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection } from "@/lib/collections";
import { CollectionsRBACService } from "@/lib/collections-rbac";

import { AddVideoDialog } from "./_components/add-video-dialog";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./_components/collections-helpers";
import { LoadingSkeleton, VideosLoadingSkeleton } from "./_components/loading-skeleton";
import { ManageModeHeader } from "./_components/manage-mode-header";
import { VideoCard } from "./_components/video-card";

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

  // Create selection handlers
  const { toggleVideoSelection, selectAllVideos, clearSelection } = createVideoSelectionHandlers(
    setSelectedVideos,
    videos,
  );

  // Role-based access control
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (userProfile && userProfile.role === "creator") {
      return; // Creators can view collections
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
      const collectionVideos = await CollectionsRBACService.getCollectionVideos(
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

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;
    setDeletingVideos((prev) => new Set([...prev, videoId]));

    try {
      await CollectionsService.deleteVideo(user.uid, videoId);
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
    setDeletingVideos((prev) => new Set([...prev, ...videoIds]));

    try {
      await Promise.all(videoIds.map((videoId) => CollectionsService.deleteVideo(user.uid, videoId)));
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
      setDeletingVideos((prev) => {
        const newSet = new Set(prev);
        videoIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    }
  };

  const handleExitManageMode = () => {
    setManageMode(false);
    setSelectedVideos(new Set());
  };

  const pageTitle = getPageTitle(selectedCollectionId, collections);
  const pageDescription = getPageDescription(selectedCollectionId, collections);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="@container/main">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:space-y-10 md:p-6">
        {/* Header Section */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground text-lg">{pageDescription}</p>
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
        </section>

        {/* Collection Filter Section */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={!selectedCollectionId ? "default" : "secondary"}
              className={`cursor-pointer transition-all duration-200 ${
                !selectedCollectionId
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                  : "bg-secondary/50 hover:bg-secondary/80"
              }`}
              onClick={() => router.push("/research/collections")}
            >
              All Videos ({videos.length})
            </Badge>
            {collections.map((collection) => (
              <Badge
                key={collection.id}
                variant={selectedCollectionId === collection.id ? "default" : "secondary"}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedCollectionId === collection.id
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    : "bg-secondary/50 hover:bg-secondary/80"
                }`}
                onClick={() => router.push(`/research/collections?collection=${collection.id}`)}
              >
                {collection.title} ({collection.videoCount})
              </Badge>
            ))}
          </div>
        </section>

        {/* Videos Content Section */}
        <section className="space-y-6">
          {loadingVideos ? (
            <VideosLoadingSkeleton />
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted/50 mb-6 rounded-full p-6">
                <Plus className="text-muted-foreground h-12 w-12" />
              </div>
              <div className="space-y-4">
                <h3 className="text-foreground text-xl font-semibold">No videos yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Add your first video to get started with content analysis and research
                </p>
                <div className="pt-4">
                  <AddVideoDialog
                    collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
                    selectedCollectionId={selectedCollectionId ?? undefined}
                    onVideoAdded={handleVideoAdded}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        </section>
      </div>
    </div>
  );
}
