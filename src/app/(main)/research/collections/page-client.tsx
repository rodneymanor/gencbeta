"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useQuery } from "@tanstack/react-query";

import { type Collection, type Video } from "@/lib/collections";

import Sidebar from "./_components/sidebar";
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

  return (
    <div className="relative mx-auto flex max-w-6xl gap-6">
      <div className="hidden w-[313px] flex-shrink-0 md:block">
        <div className="sticky top-4">
          <Sidebar collections={collections} selected={current} onChange={handleCollectionChange} />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-8 md:space-y-10">
        {isLoading ? <SkeletonGrid /> : <VideoGrid videos={videos ?? []} />}
      </div>
    </div>
  );
}
