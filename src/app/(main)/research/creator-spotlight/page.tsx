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
    <div
      className="mx-auto max-w-screen-xl"
      style={{ padding: "0 24px", gap: "32px", display: "flex", flexDirection: "column" }}
      data-md-px="48px"
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between" style={{ gap: "16px" }}>
          <div>
            <h1 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">Creator Spotlight</h1>
            <p className="text-base leading-normal font-normal text-gray-600 dark:text-gray-400">
              Discover and analyze top creators from TikTok and Instagram
            </p>
          </div>
          <AddCreatorDialog onCreatorAdded={loadCreators}>
            <button
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 md:w-auto"
              style={{ gap: "8px" }}
            >
              <Plus className="h-5 w-5" />
              Add Creator
            </button>
          </AddCreatorDialog>
        </div>

        {/* Search and Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Mobile Filter Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center rounded-lg text-base font-normal text-gray-600 transition-all duration-200 ease-in-out focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none md:hover:text-gray-900 dark:text-gray-400 dark:md:hover:text-gray-100"
              style={{ gap: "8px", padding: "16px" }}
            >
              <Filter className="h-4 w-4" />
              <span>Search & Filter</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${filtersExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Filter Content */}
          <div
            className={`${filtersExpanded ? "block" : "hidden md:block"} transition-all duration-200`}
            style={{ display: "flex", flexDirection: "column", gap: "32px" }}
          >
            <div className="flex flex-col md:flex-row" style={{ gap: "32px" }}>
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-0 h-4 w-4 -translate-y-1/2 transform text-gray-600 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  className="h-12 w-full border-0 border-b-2 border-gray-200 bg-transparent pr-0 pl-6 text-base text-gray-900 transition-colors duration-200 placeholder:text-gray-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-400 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400 dark:disabled:border-gray-800 dark:disabled:text-gray-600"
                />
              </div>
              <div className="grid grid-cols-3 md:flex" style={{ gap: "16px" }}>
                <button
                  onClick={() => setPlatformFilter("all")}
                  disabled={loading}
                  className={
                    platformFilter === "all"
                      ? "h-10 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      : "h-10 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  }
                >
                  All
                </button>
                <button
                  onClick={() => setPlatformFilter("tiktok")}
                  disabled={loading}
                  className={
                    platformFilter === "tiktok"
                      ? "h-10 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      : "h-10 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  }
                >
                  TikTok
                </button>
                <button
                  onClick={() => setPlatformFilter("instagram")}
                  disabled={loading}
                  className={
                    platformFilter === "instagram"
                      ? "h-10 rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                      : "h-10 rounded-[20px] bg-gray-100 px-6 text-sm font-normal text-gray-900 transition-all duration-200 ease-in-out hover:bg-gray-200 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                  }
                >
                  Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <CreatorGrid creators={filteredCreators} loading={loading} onCreatorClick={handleCreatorClick} />

      {!loading && filteredCreators.length === 0 && (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div className="flex justify-center">
              <Users className="h-12 w-12 text-gray-600 dark:text-gray-400" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <h3 className="text-2xl leading-tight font-medium text-gray-900 dark:text-gray-100">
                {searchTerm || platformFilter !== "all" ? "No creators found" : "No creators available yet"}
              </h3>
              <p className="text-base leading-normal font-normal text-gray-600 dark:text-gray-400">
                {searchTerm || platformFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first creator to get started with content analysis."}
              </p>
            </div>
            {!searchTerm && platformFilter === "all" && (
              <AddCreatorDialog onCreatorAdded={loadCreators}>
                <button
                  disabled={loading}
                  className="flex h-10 w-full items-center justify-center rounded-[20px] bg-blue-600 px-6 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 md:w-auto"
                  style={{ marginTop: "48px", gap: "8px" }}
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Creator
                </button>
              </AddCreatorDialog>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
