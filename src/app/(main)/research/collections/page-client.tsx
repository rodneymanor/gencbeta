"use client";

import React, { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react";

import { useTopBarConfig } from "@/hooks/use-route-topbar";
import type { Collection } from "@/lib/collections";
import { fetchCollections, fetchVideos } from "@/lib/collections-server";

import CollectionsSidebar from "./_components/collections-sidebar";
import { CollectionsTopbarActions } from "./_components/collections-topbar-actions";
import SkeletonGrid from "./_components/skeleton-grid";
import VideoGrid from "./_components/video-grid";

import type { Video } from "@/types/video";

interface Props {
  initialCollections: Collection[];
  initialVideos: Video[];
  initialCollectionId: string | null;
}

export default function CollectionsPageClient({ initialCollections, initialVideos, initialCollectionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTopBarConfig = useTopBarConfig();
  const [current, setCurrent] = useState(initialCollectionId);

  /* collections never change often, so cache for 5 min */
  const { data: collections = initialCollections } = useQuery({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    initialData: initialCollections,
    staleTime: 5 * 60_000,
  });

  const { data: videos = initialVideos, isLoading } = useQuery({
    queryKey: ["videos", current ?? "all"], // STABLE key
    queryFn: () => fetchVideos(current),
    initialData: initialVideos,
    keepPreviousData: true, // no jump when refetching
    staleTime: 30_000,
  });

  // Handle collection change with URL update
  const handleCollectionChange = (collectionId: string | null) => {
    setCurrent(collectionId);

    const params = new URLSearchParams(searchParams);
    if (collectionId) {
      params.set("collection", collectionId);
    } else {
      params.delete("collection");
    }

    router.replace(`/collections?${params.toString()}`);
  };

  // Set topbar config - use useEffect to avoid infinite loops
  React.useEffect(() => {
    const topbarActions = (
      <CollectionsTopbarActions
        collections={collections}
        selectedCollectionId={current}
        manageMode={false}
        selectedVideos={new Set()}
        onManageModeToggle={() => {}}
        onExitManageMode={() => {}}
        onBulkDelete={() => {}}
        onClearSelection={() => {}}
        onSelectAll={() => {}}
        onVideoAdded={() => {}}
      />
    );

    setTopBarConfig({
      title: "Collections",
      titleIcon: FolderOpen,
      height: 53,
      className: "collections-topbar-two-column",
      actions: topbarActions,
    });
  }, [setTopBarConfig, collections, current]);

  return (
    <div className="@container/main">
      <div className="relative mx-auto flex max-w-6xl gap-6">
        <div className="min-w-0 flex-1 space-y-8 md:space-y-10">
          <section className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                {current ? collections.find((c) => c.id === current)?.title : "All Videos"}
              </h1>
              <p className="text-muted-foreground text-lg">
                {current ? `${videos.length} videos in this collection` : `${videos.length} total videos`}
              </p>
            </div>
          </section>

          {isLoading ? <SkeletonGrid /> : <VideoGrid videos={videos} />}
        </div>

        <div className="hidden w-[313px] flex-shrink-0 md:block">
          <div className="sticky top-4">
            <CollectionsSidebar
              collections={collections}
              selected={current}
              onChange={handleCollectionChange}
              videoCount={videos.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
