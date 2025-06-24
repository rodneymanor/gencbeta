"use client";

import { useState } from "react";
import {
  Folder,
  PlayCircle,
  Plus,
  Search,
  BookCopy,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// --- Mock Data ---

const mockCollections = [
  {
    id: 1,
    title: "Viral Hooks & Intros",
    itemCount: 42,
    author: "Arham Khan",
    avatar: "/avatars/arhamkhnz.png",
  },
  {
    id: 2,
    title: "Aesthetic B-Roll Shots",
    itemCount: 112,
    author: "Jane Doe",
    avatar: "https://i.pravatar.cc/150?u=jane",
  },
  {
    id: 3,
    title: "Sound Design & Music",
    itemCount: 78,
    author: "John Smith",
    avatar: "https://i.pravatar.cc/150?u=john",
  },
  {
    id: 4,
    title: "Killer CTAs",
    itemCount: 25,
    author: "Arham Khan",
    avatar: "/avatars/arhamkhnz.png",
  },
];

const mockVideos = {
  1: Array.from({ length: 12 }, (_, i) => ({
    id: `v${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/${i + 10}/400`,
    title: `Viral Hook Idea ${i + 1}`,
  })),
  2: Array.from({ length: 8 }, (_, i) => ({
    id: `v${i + 13}`,
    thumbnailUrl: `https://picsum.photos/seed/${i + 22}/400`,
    title: `Aesthetic Shot ${i + 1}`,
  })),
  3: Array.from({ length: 15 }, (_, i) => ({
    id: `v${i + 21}`,
    thumbnailUrl: `https://picsum.photos/seed/${i + 30}/400`,
    title: `Audio Track ${i + 1}`,
  })),
  4: Array.from({ length: 7 }, (_, i) => ({
    id: `v${i + 36}`,
    thumbnailUrl: `https://picsum.photos/seed/${i + 45}/400`,
    title: `CTA Example ${i + 1}`,
  })),
};

type Collection = (typeof mockCollections)[0];
type Video = (typeof mockVideos)[1][0];

export default function CollectionsPage() {
  const [selectedCollection, setSelectedCollection] = useState<Collection>(
    mockCollections[0]
  );
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-full">
      {/* Left Column: Collections List */}
      <aside className="hidden lg:flex flex-col w-full max-w-xs p-4 border-r bg-background">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookCopy className="h-6 w-6" />
            Collections
          </h1>
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search collections..." className="pl-10" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {mockCollections.map((collection) => (
            <button
              key={collection.id}
              onClick={() => setSelectedCollection(collection)}
              className={cn(
                "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                selectedCollection.id === collection.id
                  ? "bg-muted font-semibold"
                  : "hover:bg-muted/50"
              )}
            >
              <Folder className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">{collection.title}</p>
                <p className="text-xs text-muted-foreground">
                  {collection.itemCount} items
                </p>
              </div>
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatars/arhamkhnz.png" />
              <AvatarFallback>AK</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Arham Khan</p>
              <p className="text-xs text-muted-foreground">Pro Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Column: Video Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedCollection && (
          <>
            <div className="mb-6">
              <h2 className="text-3xl font-bold">{selectedCollection.title}</h2>
              <p className="text-muted-foreground">
                A collection of {selectedCollection.itemCount} items by{" "}
                {selectedCollection.author}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(mockVideos as any)[selectedCollection.id]?.map((video: Video) => (
                <div
                  key={video.id}
                  className="aspect-square bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="h-12 w-12 text-white/80" />
                  </div>
                  <p className="absolute bottom-2 left-3 right-3 text-sm font-semibold text-white truncate">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Video Modal Placeholder */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Video information and embedded video will be displayed here.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
