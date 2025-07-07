import { Dispatch, SetStateAction } from "react";

import { VideoEmbed } from "@/components/video-embed";
import type { Video } from "@/lib/collections";

export default function VideoGrid({
  videos,
  activeVideoId,
  setActiveVideoId,
}: {
  videos: Video[];
  activeVideoId: string | null;
  setActiveVideoId: Dispatch<SetStateAction<string | null>>;
}) {
  if (videos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <p className="text-muted-foreground">No videos in this collection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {videos.map((v) => (
        <div key={v.id} className="bg-muted group relative overflow-hidden rounded-lg">
          {v.iframeUrl ? (
            <VideoEmbed
              url={v.iframeUrl}
              className="h-full w-full"
              onPlay={() => setActiveVideoId(v.id ?? null)}
              playing={activeVideoId === (v.id ?? null)}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No video available</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
