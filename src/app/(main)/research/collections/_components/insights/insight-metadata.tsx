import React from "react";
import type { Video } from "@/lib/collections";
import { formatTimestamp } from "@/lib/collections-helpers";

interface InsightMetadataProps {
  video: Video;
}

function MetadataItem({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-mono text-sm">{value ?? "N/A"}</p>
    </div>
  );
}

export function InsightMetadata({ video }: InsightMetadataProps) {
  const metadata = video.metadata;
  const videoData = metadata?.videoData;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Video Details</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-lg border bg-card p-4">
        <MetadataItem label="Platform" value={video.platform} />
        <MetadataItem label="Added On" value={formatTimestamp(video.addedAt)} />
        <MetadataItem label="Duration" value={`${videoData?.duration?.toFixed(2)}s` ?? "N/A"} />
        <MetadataItem label="Resolution" value={videoData?.resolution ?? "N/A"} />
        <MetadataItem label="Frame Rate" value={`${videoData?.fps?.toFixed(0)} FPS` ?? "N/A"} />
        <MetadataItem label="Codec" value={videoData?.codec ?? "N/A"} />
        <MetadataItem label="File Size" value={`${(videoData?.sizeInMb ?? 0).toFixed(2)} MB`} />
        <MetadataItem label="Bitrate" value={`${(videoData?.bitrateInKbps ?? 0).toFixed(0)} kbps`} />
      </div>
    </div>
  );
} 