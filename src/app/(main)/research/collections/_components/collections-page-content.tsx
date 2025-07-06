"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { FolderOpen } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import { useCollectionsQuery, useCollectionVideosQuery, useInvalidateCollections } from "@/hooks/use-collections-query";
import { useDebouncedNavigation } from "@/hooks/use-debounced-navigation";
import { MotionDiv } from "@/components/dynamic-motion";
import type { Collection } from "@/lib/collections";

import { CollectionBadge } from "./collection-badge";
import CollectionSidebar from "./collection-sidebar";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./collections-helpers";
import { CollectionsTopbarActions } from "./collections-topbar-actions";
import { VirtualizedVideoGrid } from "./virtualized-video-grid";

interface CollectionsPageContentProps {
  initialCollections: Collection[];
  initialVideos: VideoWithPlayer[];
}

// Loading component
function LoadingState() {
  return (
    <div className="@container/main">
      <div className="flex gap-6 max-w-6xl mx-auto relative">
        <div className="flex-1 min-w-0 space-y-8 md:space-y-10">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-6 bg-muted rounded w-96"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-[313px] flex-shrink-0 md:block">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error component
function ErrorState({ collectionsError, videosError }: { collectionsError?: Error; videosError?: Error }) {
  return (
    <div className="@container/main">
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-destructive text-lg">Error loading collections</p>
          <p className="text-muted-foreground text-sm mt-2">
            {collectionsError?.message ?? videosError?.message ?? "Please try again"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPageContent({ 
  initialCollections, 
  initialVideos 
}: CollectionsPageContentProps) {
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const selectedCollectionId = searchParams.get("collection");
  const setTopBarConfig = useTopBarConfig();
  const { navigateToCollection } = useDebouncedNavigation(200);
  const { invalidateAll } = useInvalidateCollections();

  // React Query hooks for data fetching
  const { 
    data: collections = initialCollections, 
    isLoading: collectionsLoading,
    error: collectionsError 
  } = useCollectionsQuery();

  const { 
    data: videos = initialVideos, 
    isLoading: videosLoading,
    isFetching: videosFetching,
    error: videosError 
  } = useCollectionVideosQuery(selectedCollectionId);

  // Transform videos to include playing state
  const videosWithState = useMemo(() => 
    videos.map(video => ({ ...video, isPlaying: false })),
    [videos]
  );

  // Memoized computed values
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);
  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  // Stable video selection handlers - don't depend on videosWithState
  const toggleVideoSelection = useCallback((videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);

  const selectAllVideos = useCallback(() => {
    const allVideoIds = videosWithState.map((v) => v.id!);
    setSelectedVideos(new Set(allVideoIds));
  }, [videosWithState]);

  const clearSelection = useCallback(() => {
    setSelectedVideos(new Set());
  }, []);

  // Collection change handler with debounced navigation
  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      startTransition(() => {
        navigateToCollection(collectionId);
      });
    },
    [navigateToCollection],
  );

  // Auth and role-based access control
  useEffect(() => {
    if (!user || !userProfile) return;

    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      navigateToCollection(null);
    }
  }, [user, userProfile, navigateToCollection]);

  // Video management functions
  const handleVideoAdded = useCallback(() => {
    invalidateAll();
  }, [invalidateAll]);

  const handleCollectionDeleted = useCallback(() => {
    if (selectedCollectionId) {
      startTransition(() => {
        navigateToCollection(null);
      });
    }
    invalidateAll();
  }, [selectedCollectionId, navigateToCollection, invalidateAll]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;

      setDeletingVideos((prev) => new Set([...prev, videoId]));
      
      try {
        // Optimistic update - remove from local state immediately
        startTransition(() => {
          setSelectedVideos((prev) => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
        });

        // TODO: Implement actual deletion with React Query mutation
        setTimeout(() => {
          setDeletingVideos((prev) => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
          invalidateAll();
        }, 1000);
      } catch (error) {
        console.error("Error deleting video:", error);
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [user, invalidateAll],
  );

  const handleBulkDelete = useCallback(async (videosToDelete: Set<string>) => {
    if (!user || videosToDelete.size === 0) return;

    const videoIds = Array.from(videosToDelete);
    setDeletingVideos((prev) => new Set([...prev, ...videoIds]));

    try {
      // Optimistic update
      startTransition(() => {
        setSelectedVideos(new Set());
      });

      // TODO: Implement actual bulk deletion with React Query mutation
      setTimeout(() => {
        setDeletingVideos(new Set());
        invalidateAll();
      }, 1000);
    } catch (error) {
      console.error("Error deleting videos:", error);
      setDeletingVideos(new Set());
    }
  }, [user, invalidateAll]);

  const handleExitManageMode = useCallback(() => {
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  // Track selected videos count for stable dependency
  const selectedVideosCount = selectedVideos.size;

  // Update top bar configuration - use stable dependencies
  useEffect(() => {
    const topbarActions = (
      <CollectionsTopbarActions
        collections={collections}
        selectedCollectionId={selectedCollectionId}
        manageMode={manageMode}
        selectedVideos={selectedVideos}
        onManageModeToggle={() => userProfile?.role !== "creator" && setManageMode(true)}
        onExitManageMode={handleExitManageMode}
        onBulkDelete={() => handleBulkDelete(selectedVideos)}
        onClearSelection={clearSelection}
        onSelectAll={selectAllVideos}
        onVideoAdded={handleVideoAdded}
      />
    );

    setTopBarConfig({
      title: "Collections",
      titleIcon: FolderOpen,
      height: 53,
      className: "collections-topbar-two-column",
      actions: topbarActions,
    });
  }, [
    selectedCollectionId,
    collections,
    setTopBarConfig,
    manageMode,
    selectedVideosCount, // Use count instead of the Set object
    userProfile?.role, // Use specific property instead of entire object
    handleVideoAdded,
    handleExitManageMode,
    handleBulkDelete,
    clearSelection,
    selectAllVideos,
  ]);

  // Show loading state
  if (collectionsLoading || videosLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (collectionsError || videosError) {
    return <ErrorState collectionsError={collectionsError} videosError={videosError} />;
  }

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
        <div className="flex gap-6 max-w-6xl mx-auto relative">
          <div className="flex-1 min-w-0 space-y-8 md:space-y-10">
            <section className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">{pageTitle}</h1>
                <p className="text-muted-foreground text-lg">{pageDescription}</p>
              </div>
            </section>

            <section className="md:hidden space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <CollectionBadge
                  isActive={!selectedCollectionId}
                  onClick={() => handleCollectionChange(null)}
                  videoCount={videosWithState.length}
                  isTransitioning={videosFetching && !selectedCollectionId}
                  onCollectionDeleted={handleCollectionDeleted}
                />
                {collections.map((collection) => (
                  <CollectionBadge
                    key={collection.id}
                    collection={collection}
                    isActive={selectedCollectionId === collection.id}
                    onClick={() => handleCollectionChange(collection.id!)}
                    videoCount={collection.videoCount}
                    isTransitioning={videosFetching && selectedCollectionId === collection.id}
                    onCollectionDeleted={handleCollectionDeleted}
                  />
                ))}
              </div>
            </section>

            <VirtualizedVideoGrid
              videos={videosWithState}
              selectedCollectionId={selectedCollectionId}
              onToggleVideoSelection={toggleVideoSelection}
              onDeleteVideo={handleDeleteVideo}
              onVideoAdded={handleVideoAdded}
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
