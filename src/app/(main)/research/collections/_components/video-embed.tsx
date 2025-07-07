import React from "react";
import type { VideoWithPlayer } from "./collections-helpers";

interface VideoEmbedProps {
  video: VideoWithPlayer;
}

export function VideoEmbed({ video }: VideoEmbedProps) {
  return (
    <div className="w-full aspect-w-16 aspect-h-9 rounded-lg overflow-hidden border">
      {video.iframeUrl ? (
        <iframe
          src={video.iframeUrl}
          title={video.title ?? "Video player"}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Video not available</p>
        </div>
      )}
    </div>
  );
} 