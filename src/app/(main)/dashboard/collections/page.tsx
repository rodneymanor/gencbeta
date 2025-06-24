"use client";

import { useState, useEffect, useCallback } from "react";

import Image from "next/image";

import { Folder, PlayCircle, Plus, Search, BookCopy, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { CollectionsService, type Collection, type Video } from "@/lib/collections";
import { cn } from "@/lib/utils";

import { AddVideoDialog } from "./_components/add-video-dialog";
import { CreateCollectionDialog } from "./_components/create-collection-dialog";

function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadCollections = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const userCollections = await CollectionsService.getUserCollections(user.uid);
      setCollections(userCollections);
      if (userCollections.length > 0 && !selectedCollection) {
        setSelectedCollection(userCollections[0]);
      }
    } catch (error) {
      console.error("Error loading collections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedCollection]);

  useEffect(() => {
    if (user) {
      loadCollections();
    }
  }, [user, loadCollections]);

  return { collections, selectedCollection, setSelectedCollection, isLoading, loadCollections };
}

export default function CollectionsPage() {
  const { collections, selectedCollection, setSelectedCollection, isLoading, loadCollections } = useCollections();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const filteredCollections = collections.filter((collection) =>
    collection.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-full">
      <CollectionsSidebar
        collections={filteredCollections}
        selectedCollection={selectedCollection}
        setSelectedCollection={setSelectedCollection}
        isLoading={isLoading}
        loadCollections={loadCollections}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
      />
      <VideosGrid selectedCollection={selectedCollection} handleVideoClick={handleVideoClick} />
      <VideoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} video={selectedVideo} />
    </div>
  );
}

function CollectionsSidebar({
  collections,
  selectedCollection,
  setSelectedCollection,
  isLoading,
  loadCollections,
  searchQuery,
  setSearchQuery,
  user,
}: {
  collections: Collection[];
  selectedCollection: Collection | null;
  setSelectedCollection: (collection: Collection) => void;
  isLoading: boolean;
  loadCollections: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: any;
}) {
  return (
    <aside className="bg-background hidden w-full max-w-xs flex-col border-r p-4 lg:flex">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookCopy className="h-6 w-6" />
          Collections
        </h1>
        <div className="flex items-center gap-2">
          <AddVideoDialog collections={collections} onVideoAdded={loadCollections}>
            <Button size="icon" variant="ghost">
              <Plus className="h-5 w-5" />
            </Button>
          </AddVideoDialog>
          <CreateCollectionDialog onCollectionCreated={loadCollections} />
        </div>
      </div>
      <div className="relative mb-4">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search collections..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            <p>No collections found</p>
            <p className="mt-1 text-sm">Create your first collection to get started</p>
          </div>
        ) : (
          collections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
                selectedCollection?.id === collection.id ? "bg-muted font-semibold" : "hover:bg-muted/50",
              )}
            >
              <Folder className="text-muted-foreground h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm">{collection.title}</p>
                <p className="text-muted-foreground text-xs">{collection.videos.length} videos</p>
              </div>
            </button>
          ))
        )}
      </nav>
      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Avatar>
                <AvatarImage src={user.photoURL ?? undefined} />
                <AvatarFallback>{user.displayName?.[0] ?? user.email?.[0] ?? "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{user.displayName ?? "User"}</p>
                <p className="text-muted-foreground text-xs">Pro Member</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <User className="text-muted-foreground h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Not signed in</p>
                <p className="text-muted-foreground text-xs">Please sign in</p>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function VideosGrid({
  selectedCollection,
  handleVideoClick,
}: {
  selectedCollection: Collection | null;
  handleVideoClick: (video: Video) => void;
}) {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      {selectedCollection && (
        <>
          <div className="mb-6">
            <h2 className="text-3xl font-bold">{selectedCollection.title}</h2>
            <p className="text-muted-foreground">
              {selectedCollection.description ?? `A collection of ${selectedCollection.videos.length} videos`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {selectedCollection.videos.length === 0 ? (
              <div className="text-muted-foreground col-span-full py-12 text-center">
                <p>No videos in this collection yet</p>
                <p className="mt-1 text-sm">Add your first video to get started</p>
              </div>
            ) : (
              selectedCollection.videos.map((video) => (
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
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}

function VideoModal({ isOpen, onClose, video }: { isOpen: boolean; onClose: () => void; video: Video | null }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video?.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground text-center">
            Video information and embedded video will be displayed here.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
