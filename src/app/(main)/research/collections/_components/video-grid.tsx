import { VideoEmbed } from "@/components/video-embed";
import type { Video } from "@/lib/collections";

export default function VideoGrid({ videos }: { videos: Video[] }) {
  if (videos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-16">
        <p className="text-muted-foreground">No videos in this collection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {videos.map((v) => (
        <div key={v.id} className="bg-muted group relative overflow-hidden rounded-lg">
          {v.iframeUrl ? (
            <VideoEmbed url={v.iframeUrl} className="h-full w-full" />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center">
              <p className="text-muted-foreground text-sm">No video available</p>
            </div>
          )}
          <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <h3 className="truncate text-sm font-semibold text-white">{v.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
