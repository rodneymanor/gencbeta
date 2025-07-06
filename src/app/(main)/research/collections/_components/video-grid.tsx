"use client";

import type { Video } from "@/lib/collections";

interface VideoGridProps {
  videos: Video[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">No videos found</p>
          <p className="text-muted-foreground mt-2 text-sm">Upload some videos to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div key={video.id} className="bg-muted aspect-video overflow-hidden rounded-lg">
          {/* Video poster keeps height -> no scroll jump */}
          <div className="flex h-full w-full items-center justify-center">
            <div className="p-4 text-center">
              <p className="text-muted-foreground text-sm font-medium">{video.title}</p>
              <p className="text-muted-foreground/60 mt-1 text-xs">
                {video.duration
                  ? `${Math.round(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, "0")}`
                  : "Unknown duration"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
