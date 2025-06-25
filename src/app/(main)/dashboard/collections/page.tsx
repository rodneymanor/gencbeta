"use client";

import { useState, useEffect, useCallback } from "react";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { PlayCircle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";

import { AddVideoDialog } from "./_components/add-video-dialog";

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

  const loadCollections = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userCollections = await CollectionsService.getUserCollections(user.uid);
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
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, collectionId]);

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user, loadCollections]);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageDescription}</p>
        </div>
        <AddVideoDialog collections={collections} onVideoAdded={loadCollections}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        </AddVideoDialog>
      </div>

      <Separator />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayVideos.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center text-center">
            <div>
              <p className="text-lg font-medium">Add your videos here</p>
              <p className="mt-2">Start building your collection by adding your first video</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayVideos.map((video) => (
              <div
                key={video.id}
                className="bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-lg"
                onClick={() => handleVideoClick(video)}
              >
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="from-primary/20 to-primary/5 flex h-full w-full items-center justify-center bg-gradient-to-br">
                    <PlayCircle className="text-primary/60 h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                  <PlayCircle className="h-12 w-12 text-white/80" />
                </div>
                <p className="absolute right-3 bottom-2 left-3 truncate text-sm font-semibold text-white">
                  {video.title}
                </p>
                <div className="absolute top-2 right-2">
                  <div className="rounded bg-black/50 px-2 py-1 text-xs text-white capitalize">{video.platform}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground text-center">
              Video information and embedded video will be displayed here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
