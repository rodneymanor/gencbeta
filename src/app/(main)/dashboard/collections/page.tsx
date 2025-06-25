"use client";

import { useState, useEffect, useCallback } from "react";

import { useSearchParams } from "next/navigation";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { createDemoData } from "./_components/demo-data";
import { VideoGrid } from "./_components/video-grid";
import { VideoModal } from "./_components/video-modal";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get("collection");

  // Determine if we're in demo mode (not authenticated)
  const isDemoMode = !user;

  const loadUserCollections = useCallback(async () => {
    if (!user) return [];
    return await CollectionsService.getUserCollections(user.uid);
  }, [user]);

  const processCollections = useCallback(
    (userCollections: Collection[]) => {
      setCollections(userCollections);

      // Flatten all videos from all collections
      const videos = userCollections.flatMap((collection) => collection.videos);
      setAllVideos(videos);

      // Set current collection based on URL parameter
      if (collectionId) {
        const collection = userCollections.find((c) => c.id === collectionId);
        setCurrentCollection(collection ?? null);
      } else {
        setCurrentCollection(null); // Show all videos
      }
    },
    [collectionId],
  );

  const loadCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      const userCollections = isDemoMode ? createDemoData() : await loadUserCollections();
      processCollections(userCollections);
    } catch (error) {
      console.error("Error loading collections:", error);
      // Fallback to demo mode on error
      const demoCollections = createDemoData();
      processCollections(demoCollections);
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode, loadUserCollections, processCollections]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleVideoClick = useCallback((video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const displayVideos = currentCollection ? currentCollection.videos : allVideos;
  const pageTitle = currentCollection ? currentCollection.title : "All Videos";
  const pageDescription = currentCollection
    ? (currentCollection.description ?? `${currentCollection.videos.length} videos in this collection`)
    : `${allVideos.length} videos across all collections`;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Demo Mode Indicator */}
      {isDemoMode && (
        <div className="bg-primary/10 border-primary/20 border-b px-6 py-2">
          <p className="text-primary text-sm">📺 Demo Mode: Showing sample collection layout with your TikTok video</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        {user && (
          <AddVideoDialog collections={collections} onVideoAdded={loadCollections}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Video
            </Button>
          </AddVideoDialog>
        )}
        {isDemoMode && (
          <Button variant="outline" asChild>
            <a href="/auth/v1/login">Sign In to Add Videos</a>
          </Button>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <VideoGrid videos={displayVideos} onVideoClick={handleVideoClick} />
      </div>

      {/* Video Modal */}
      <VideoModal video={selectedVideo} isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
