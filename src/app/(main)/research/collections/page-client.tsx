"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { type Collection, type Video } from "@/lib/collections";

import CategoryChooser from "./_components/category-chooser";
import SkeletonGrid from "./_components/skeleton-grid";
import VideoGrid from "./_components/video-grid";

const fetchCollectionsClient = () => fetch("/api/collections").then((res) => res.json());
const fetchVideosClient = (collectionId: string | null) => {
  const url = collectionId ? `/api/videos?collectionId=${collectionId}` : "/api/videos";
  return fetch(url).then((res) => res.json());
};

type Props = {
  initialCollections: Collection[];
  initialVideos: Video[];
  initialCollectionId: string | null;
};

export default function PageClient({ initialCollections, initialVideos, initialCollectionId }: Props) {
  const [current, setCurrent] = useState(initialCollectionId);
  const router = useRouter();

  /* collections never change often, so cache for 5 min */
  const { data: collections } = useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: fetchCollectionsClient,
    initialData: initialCollections,
    staleTime: 5 * 60_000,
  });

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["videos", current ?? "all"], // STABLE key
    queryFn: () => fetchVideosClient(current),
    initialData: initialVideos,
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  });

  const handleCollectionChange = (id: string | null) => {
    setCurrent(id);
    const params = new URLSearchParams(window.location.search);
    if (id) {
      params.set("collection", id);
    } else {
      params.delete("collection");
    }
    router.replace(`${window.location.pathname}?${params.toString()}`);
  };

  // Transform collections data for CategoryChooser
  const categoryItems = [
    { id: "all", name: "All Videos", description: "View all videos" },
    ...(collections?.map((collection) => ({
      id: collection.id ?? "",
      name: collection.title,
      description: collection.description,
    })) ?? []),
  ];

  const handleCategorySelection = (item: { id: string; name: string; description?: string }) => {
    const collectionId = item.id === "all" ? null : item.id;
    handleCollectionChange(collectionId);
  };

  return (
    <div className="relative mx-auto flex max-w-6xl justify-center gap-12 px-4">
      <div className="max-w-3xl min-w-0 flex-1 space-y-8 md:space-y-10">
        {isLoading ? <SkeletonGrid /> : <VideoGrid videos={videos ?? []} />}
      </div>
      <div className="hidden w-[280px] flex-shrink-0 lg:block">
        <div className="sticky top-4">
          <CategoryChooser
            items={categoryItems}
            selectedId={current ?? "all"}
            onSelectionChange={handleCategorySelection}
            label="Collections"
          />
        </div>
      </div>
    </div>
  );
}
