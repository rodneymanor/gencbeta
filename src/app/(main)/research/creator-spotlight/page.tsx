"use client";

import React, { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AddCreatorDialog } from "./_components/add-creator-dialog";
import { CreatorDetailView } from "./_components/creator-detail-view";
import { CreatorGrid } from "./_components/creator-grid";
import { useCreators, useCreatorVideos } from "./_hooks/use-creators";

interface CreatorProfile {
  id: string;
  username: string;
  displayName?: string;
  platform: "tiktok" | "instagram";
  profileImageUrl: string;
  bio?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  lastProcessed?: string;
  videoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function CreatorSpotlightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCreatorId = searchParams.get("creator");

  const { creators, loading, loadCreators } = useCreators();
  const { creatorVideos, loadingVideos, loadCreatorVideos, clearVideos } = useCreatorVideos();
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "tiktok" | "instagram">("all");

  // Handle creator selection from URL
  useEffect(() => {
    if (selectedCreatorId && creators.length > 0) {
      const creator = creators.find((c) => c.id === selectedCreatorId);
      if (creator) {
        setSelectedCreator(creator);
        loadCreatorVideos(creator);
      }
    }
  }, [selectedCreatorId, creators]); // Removed loadCreatorVideos to prevent infinite loop

  const handleCreatorClick = (creator: CreatorProfile) => {
    setSelectedCreator(creator);
    router.push(`/research/creator-spotlight?creator=${creator.id}`);
    loadCreatorVideos(creator);
  };

  const handleBackToGrid = () => {
    setSelectedCreator(null);
    clearVideos();
    router.push("/research/creator-spotlight");
  };

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch =
      creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = platformFilter === "all" || creator.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  if (selectedCreator) {
    return (
      <CreatorDetailView
        creator={selectedCreator}
        videos={creatorVideos}
        loadingVideos={loadingVideos}
        onBack={handleBackToGrid}
      />
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Creator Spotlight</h1>
            <p className="text-muted-foreground">Discover and analyze top creators from TikTok and Instagram</p>
          </div>
          <AddCreatorDialog onCreatorAdded={loadCreators}>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Creator
            </Button>
          </AddCreatorDialog>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              placeholder="Search creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={platformFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("all")}
            >
              All
            </Button>
            <Button
              variant={platformFilter === "tiktok" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("tiktok")}
              className="bg-[#FF0050] text-white hover:bg-[#E6004C]"
            >
              TikTok
            </Button>
            <Button
              variant={platformFilter === "instagram" ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter("instagram")}
              className="bg-[#E4405F] text-white hover:bg-[#D6336C]"
            >
              Instagram
            </Button>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <CreatorGrid creators={filteredCreators} loading={loading} onCreatorClick={handleCreatorClick} />

      {!loading && filteredCreators.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex justify-center">
              <Users className="text-muted-foreground h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {searchTerm || platformFilter !== "all" ? "No creators found" : "No creators available yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || platformFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first creator to get started with content analysis."}
              </p>
            </div>
            {!searchTerm && platformFilter === "all" && (
              <AddCreatorDialog onCreatorAdded={loadCreators}>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Creator
                </Button>
              </AddCreatorDialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
