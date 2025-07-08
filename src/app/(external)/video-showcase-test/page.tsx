"use client";

import { useEffect, useState, useCallback } from "react";

import dynamic from "next/dynamic";

import { useAuth } from "@/contexts/auth-context";
import { CollectionsRBACService, type Video } from "@/lib/collections-rbac";

// Dynamically import the showcase component's `ProductGrid` (client-only)
const VideoShowcase = dynamic(() => import("react-product-video-showcase").then((m) => m.ProductGrid), {
  ssr: false,
}) as any;

interface SimpleVideoItem {
  id: string;
  iframe: string;
}

export default function VideoShowcaseTestPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<SimpleVideoItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load first 9 videos from all collections
  useEffect(() => {
    const loadVideos = async () => {
      if (!user) return;
      try {
        const rawVideos = (await CollectionsRBACService.getCollectionVideos(user.uid)) as unknown as Video[];

        const prepared = rawVideos
          .filter((v) => Boolean((v as any).iframeUrl))
          .slice(0, 9)
          .map((v) => ({ id: (v as any).id!, iframe: (v as any).iframeUrl! }));

        setVideos(prepared);
      } catch (error) {
        console.error("Failed to load videos:", error);
      }
    };

    loadVideos();
  }, [user]);

  // Ensure single video playback by tracking currently playing id
  const handlePlay = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const preparedVideos = videos.map((v) => ({
    id: v.id,
    src: v.iframe,
    type: "iframe",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Video Showcase – All Videos</h1>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - external library lacks typings */}
      <VideoShowcase
        videos={preparedVideos}
        columns={3}
        rows={3}
        autoPlay={false}
        activeVideoId={activeId}
        onVideoPlay={handlePlay}
        singleActive
      />
    </div>
  );
}
