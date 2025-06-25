import Image from "next/image";

import { PlayCircle } from "lucide-react";

import { type Video } from "@/lib/collections";

interface VideoGridProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

export function VideoGrid({ videos, onVideoClick }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-center">
        <div>
          <p className="text-lg font-medium">Add your videos here</p>
          <p className="mt-2">Start building your collection by adding your first video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-lg transition-all hover:shadow-lg"
          onClick={() => onVideoClick(video)}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
            <PlayCircle className="h-12 w-12 text-white/80 drop-shadow-lg" />
          </div>
          <p className="absolute right-3 bottom-8 left-3 truncate text-sm font-semibold text-white drop-shadow-md">
            {video.title}
          </p>
          <p className="absolute right-3 bottom-2 left-3 truncate text-xs text-white/80 drop-shadow-md">
            {video.author}
          </p>
          <div className="absolute top-2 right-2">
            <div className="rounded bg-black/50 px-2 py-1 text-xs text-white capitalize backdrop-blur-sm">
              {video.platform}
            </div>
          </div>
          {video.metadata?.views && (
            <div className="absolute top-2 left-2">
              <div className="rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
                {video.metadata.views.toLocaleString()} views
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
