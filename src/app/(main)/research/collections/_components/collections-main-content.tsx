"use client";

import { useCallback } from "react";

import { FolderOpen } from "lucide-react";

import { MotionDiv } from "@/components/dynamic-motion";
import type { Collection } from "@/lib/collections";

import { CollectionBadge } from "./collection-badge";
import CollectionSidebar from "./collection-sidebar";
import type { VideoWithPlayer } from "./collections-helpers";
import { VirtualizedVideoGrid } from "./virtualized-video-grid";

interface CollectionsMainContentProps {
  selectedCollectionId: string | null;
  collections: Collection[];
  videosWithState: VideoWithPlayer[];
  videosFetching: boolean;
  pageTitle: string;
  pageDescription: string;
  onCollectionChange: (collectionId: string | null) => void;
  onCollectionDeleted: () => void;
  onToggleVideoSelection: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onVideoAdded: () => void;
}

export function CollectionsMainContent({
  selectedCollectionId,
  collections,
  videosWithState,
  videosFetching,
  pageTitle,
  pageDescription,
  onCollectionChange,
  onCollectionDeleted,
  onToggleVideoSelection,
  onDeleteVideo,
  onVideoAdded,
}: CollectionsMainContentProps) {
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      onCollectionChange(collectionId);
    },
    [onCollectionChange],
  );

  const contentKey = `content-${selectedCollectionId ?? "all"}-${videosWithState.length}`;

  return (
    <div className="@container/main">
      <MotionDiv
        key={contentKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="relative mx-auto flex max-w-6xl gap-6">
          <div className="min-w-0 flex-1 space-y-8 md:space-y-10">
            <section className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="text-muted-foreground text-lg">{pageDescription}</p>
              </div>
            </section>

            <section className="space-y-4 md:hidden">
              <div className="flex flex-wrap items-center gap-3">
                <CollectionBadge
                  isActive={!selectedCollectionId}
                  onClick={() => handleCollectionChange(null)}
                  videoCount={videosWithState.length}
                  isTransitioning={videosFetching && !selectedCollectionId}
                  onCollectionDeleted={onCollectionDeleted}
                />
                {collections.map((collection) => (
                  <CollectionBadge
                    key={collection.id}
                    collection={collection}
                    isActive={selectedCollectionId === collection.id}
                    onClick={() => handleCollectionChange(collection.id!)}
                    videoCount={collection.videoCount}
                    isTransitioning={videosFetching && selectedCollectionId === collection.id}
                    onCollectionDeleted={onCollectionDeleted}
                  />
                ))}
              </div>
            </section>

            <VirtualizedVideoGrid
              videos={videosWithState}
              selectedCollectionId={selectedCollectionId}
              onToggleVideoSelection={onToggleVideoSelection}
              onDeleteVideo={onDeleteVideo}
              onVideoAdded={onVideoAdded}
            />
          </div>

          <div className="hidden w-[313px] flex-shrink-0 md:block">
            <div className="sticky top-4">
              <CollectionSidebar
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onSelectionChange={handleCollectionChange}
                videoCount={videosWithState.length}
              />
            </div>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
