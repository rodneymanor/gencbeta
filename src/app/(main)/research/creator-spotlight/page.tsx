"use client";

import React, { useState, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Plus, Search, Users, Filter, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EnhancedCreatorProfile } from "@/lib/creator-spotlight-utils";

import { AddCreatorDialog } from "./_components/add-creator-dialog";
import { CreatorDetailView } from "./_components/creator-detail-view";
import { CreatorGrid } from "./_components/creator-grid";
import { useCreators, useCreatorVideos } from "./_hooks/use-creators";

export default function CreatorSpotlightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCreatorId = searchParams.get("creator");

  const { creators, loading, loadCreators } = useCreators();
  const { creatorVideos, loadingVideos, loadCreatorVideos, clearVideos } = useCreatorVideos();
  const [selectedCreator, setSelectedCreator] = useState<EnhancedCreatorProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | "tiktok" | "instagram">("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Handle creator selection from URL
  useEffect(() => {
    if (selectedCreatorId && creators.length > 0) {
      const creator = creators.find((c) => c.id === selectedCreatorId);
      if (creator) {
        setSelectedCreator(creator);
        loadCreatorVideos(creator);
      }
    }
  }, [selectedCreatorId, creators, loadCreatorVideos]);

  const handleCreatorClick = (creator: EnhancedCreatorProfile) => {
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
    <div className="mx-auto max-w-screen-xl space-y-[var(--space-4)] px-[var(--space-3)] md:px-[var(--space-6)]">
      {/* Header */}
      <div className="space-y-[var(--space-2)]">
        <div className="flex flex-col space-y-[var(--space-2)] md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-foreground text-2xl leading-tight font-medium">Creator Spotlight</h1>
            <p className="text-muted-foreground text-base leading-normal font-normal">
              Discover and analyze top creators from TikTok and Instagram
            </p>
          </div>
          <AddCreatorDialog onCreatorAdded={loadCreators}>
            <Button
              disabled={loading}
              className="bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground flex w-full items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed md:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Creator
            </Button>
          </AddCreatorDialog>
        </div>

        {/* Search and Filter */}
        <div className="space-y-[var(--space-2)]">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="text-muted-foreground md:hover:text-foreground focus:ring-ring flex items-center gap-2 rounded-lg p-2 text-sm font-normal focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <Filter className="h-4 w-4" />
              <span>Search & Filter</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${filtersExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Filter Content */}
          <div className={`space-y-4 ${filtersExpanded ? "block" : "hidden md:block"} transition-all duration-200`}>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 transform" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  className="text-foreground border-border focus:border-primary focus:ring-ring disabled:border-muted disabled:text-muted-foreground placeholder:text-muted-foreground h-12 w-full border-0 border-b-2 bg-transparent pr-0 pl-6 text-base transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 md:flex md:gap-2">
                <Button
                  variant={platformFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("all")}
                  disabled={loading}
                  className={
                    platformFilter === "all"
                      ? "bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed"
                      : "border-border text-foreground focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed md:hover:bg-black/5 dark:md:hover:bg-white/5"
                  }
                >
                  All
                </Button>
                <Button
                  variant={platformFilter === "tiktok" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("tiktok")}
                  disabled={loading}
                  className={
                    platformFilter === "tiktok"
                      ? "bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed"
                      : "border-border text-foreground focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed md:hover:bg-black/5 dark:md:hover:bg-white/5"
                  }
                >
                  TikTok
                </Button>
                <Button
                  variant={platformFilter === "instagram" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlatformFilter("instagram")}
                  disabled={loading}
                  className={
                    platformFilter === "instagram"
                      ? "bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed"
                      : "border-border text-foreground focus:ring-ring disabled:bg-muted disabled:text-muted-foreground focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed md:hover:bg-black/5 dark:md:hover:bg-white/5"
                  }
                >
                  Instagram
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <CreatorGrid creators={filteredCreators} loading={loading} onCreatorClick={handleCreatorClick} />

      {!loading && filteredCreators.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="flex justify-center">
              <Users className="text-muted-foreground h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-foreground text-2xl leading-tight font-medium">
                {searchTerm || platformFilter !== "all" ? "No creators found" : "No creators available yet"}
              </h3>
              <p className="text-muted-foreground text-base leading-normal font-normal">
                {searchTerm || platformFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first creator to get started with content analysis."}
              </p>
            </div>
            {!searchTerm && platformFilter === "all" && (
              <AddCreatorDialog onCreatorAdded={loadCreators}>
                <Button
                  disabled={loading}
                  className="bg-primary text-primary-foreground md:hover:bg-primary/90 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground mt-6 w-full focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed md:w-auto"
                >
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
