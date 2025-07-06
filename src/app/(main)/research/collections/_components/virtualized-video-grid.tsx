"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useMemo } from "react";

import type { Collection } from "@/lib/collections";

import type { VideoWithPlayer } from "./collections-helpers";

interface VirtualizedVideoGridProps {
  videos: VideoWithPlayer[];
  collections: Collection[];
  selectedCollectionId: string | null;
  manageMode: boolean;
  selectedVideos: Set<string>;
  deletingVideos: Set<string>;
  onToggleVideoSelection: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onVideoAdded: () => void;
}

interface VirtualItem {
  key: string;
  index: number;
  start: number;
  size: number;
}

const COLUMNS = 3;
const CARD_WIDTH = 320;
const CARD_HEIGHT = 240;

export function VirtualizedVideoGrid({
  videos,
  selectedCollectionId,
  onToggleVideoSelection,
  onDeleteVideo,
  onVideoAdded,
}: VirtualizedVideoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const rowCount = Math.ceil(videos.length / COLUMNS);

  // Create virtualizer for rows
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + 16, // Add gap
    overscan: 2, // Render 2 extra rows above and below visible area
  });

  // Memoize video items to prevent unnecessary re-renders
  const videoItems = useMemo(() => {
    const items: (VideoWithPlayer | null)[][] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: (VideoWithPlayer | null)[] = [];
      for (let j = 0; j < COLUMNS; j++) {
        const videoIndex = i * COLUMNS + j;
        row.push(videos[videoIndex] ?? null);
      }
      items.push(row);
    }
    return items;
  }, [videos, rowCount]);

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-muted-foreground text-lg">No videos found</p>
          <p className="text-muted-foreground text-sm mt-2">
            {selectedCollectionId ? "This collection is empty" : "Upload some videos to get started"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[70vh] overflow-auto"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowVideos = videoItems[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div
                className="flex justify-center gap-4"
                style={{
                  width: "100%",
                  height: CARD_HEIGHT,
                }}
              >
                {rowVideos.map((video, colIndex) => {
                  if (!video) return <div key={colIndex} style={{ width: CARD_WIDTH }} />;
                  
                  return (
                    <div
                      key={video.id}
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_HEIGHT,
                        flexShrink: 0,
                      }}
                    >
                      {/* Placeholder for video card */}
                      <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">Video: {video.title}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 