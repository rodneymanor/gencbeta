"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";

import { useSearchParams } from "next/navigation";

import { FolderOpen } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useCollectionsQuery, useCollectionVideosQuery, useInvalidateCollections } from "@/hooks/use-collections-query";
import { useDebouncedNavigation } from "@/hooks/use-debounced-navigation";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import type { Collection } from "@/lib/collections";

import { type VideoWithPlayer, getPageTitle, getPageDescription } from "./collections-helpers";
import { CollectionsMainContent } from "./collections-main-content";
import { CollectionsTopbarActions } from "./collections-topbar-actions";

interface CollectionsPageContentProps {
  initialCollections: Collection[];
  initialVideos: VideoWithPlayer[];
}

// Loading component
function LoadingState() {
  return (
    <div className="@container/main">
      <div className="relative mx-auto flex max-w-6xl gap-6">
        <div className="min-w-0 flex-1 space-y-8 md:space-y-10">
          <div className="animate-pulse">
            <div className="bg-muted mb-2 h-8 w-48 rounded"></div>
            <div className="bg-muted h-6 w-96 rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted aspect-video rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden w-[313px] flex-shrink-0 md:block">
          <div className="animate-pulse">
            <div className="bg-muted mb-4 h-6 rounded"></div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted h-10 rounded"></div>
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
          <p className="text-muted-foreground mt-2 text-sm">
            {collectionsError?.message ?? videosError?.message ?? "Please try again"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CollectionsPageContent({ initialCollections, initialVideos }: CollectionsPageContentProps) {
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
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
    error: collectionsError,
  } = useCollectionsQuery();

  const {
    data: videos = initialVideos,
    isLoading: videosLoading,
    isFetching: videosFetching,
    error: videosError,
  } = useCollectionVideosQuery(selectedCollectionId);

  // Transform videos to include playing state
  const videosWithState = useMemo(() => videos.map((video) => ({ ...video, isPlaying: false })), [videos]);

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
    console.log("🔐 [Collections] Auth effect running:", {
      user: !!user,
      userProfile: !!userProfile,
      userRole: userProfile?.role,
      timestamp: new Date().toISOString(),
    });

    if (!user || !userProfile) return;

    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      console.log("🔐 [Collections] Redirecting due to role:", userProfile.role);
      navigateToCollection(null);
    }
  }, [user, userProfile, navigateToCollection]);

  // Video management functions
  const handleVideoAdded = useCallback(() => {
    console.log("➕ [Collections] handleVideoAdded called");
    invalidateAll();
  }, [invalidateAll]);

  const handleCollectionDeleted = useCallback(() => {
    console.log("🗑️ [Collections] handleCollectionDeleted called:", { selectedCollectionId });
    if (selectedCollectionId) {
      startTransition(() => {
        navigateToCollection(null);
      });
    }
    invalidateAll();
  }, [selectedCollectionId, navigateToCollection, invalidateAll]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      console.log("🗑️ [Collections] handleDeleteVideo called:", { videoId });
      if (!user) return;

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
          invalidateAll();
        }, 1000);
      } catch (error) {
        console.error("Error deleting video:", error);
      }
    },
    [user, invalidateAll],
  );

  const handleBulkDelete = useCallback(
    async (videosToDelete: Set<string>) => {
      console.log("🗑️ [Collections] handleBulkDelete called:", { count: videosToDelete.size });
      if (!user || videosToDelete.size === 0) return;

      try {
        // Optimistic update
        startTransition(() => {
          setSelectedVideos(new Set());
        });

        // TODO: Implement actual bulk deletion with React Query mutation
        setTimeout(() => {
          invalidateAll();
        }, 1000);
      } catch (error) {
        console.error("Error deleting videos:", error);
      }
    },
    [user, invalidateAll],
  );

  const handleExitManageMode = useCallback(() => {
    console.log("🚪 [Collections] handleExitManageMode called");
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  // Track selected videos count for stable dependency
  const selectedVideosCount = selectedVideos.size;

  // Memoize topbar actions to prevent infinite re-renders
  const topbarActions = useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🎛️ [Collections] Creating topbar actions:", {
        selectedCollectionId,
        collectionsCount: collections.length,
        manageMode,
        selectedVideosCount,
        userRole: userProfile?.role,
        timestamp: new Date().toISOString(),
      });
    }

    return (
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
  }, [
    collections,
    selectedCollectionId,
    manageMode,
    selectedVideos,
    selectedVideosCount,
    userProfile?.role,
    setManageMode,
    handleExitManageMode,
    handleBulkDelete,
    clearSelection,
    selectAllVideos,
    handleVideoAdded,
  ]);

  // Update top bar configuration - use stable dependencies
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🎛️ [Collections] TopBar effect running:", {
        selectedCollectionId,
        collectionsCount: collections.length,
        manageMode,
        selectedVideosCount,
        userRole: userProfile?.role,
        timestamp: new Date().toISOString(),
      });
    }

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
    topbarActions, // Now this is memoized and stable
  ]);

  // Show loading state
  if (collectionsLoading || videosLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (collectionsError || videosError) {
    return <ErrorState collectionsError={collectionsError} videosError={videosError} />;
  }

  return (
    <CollectionsMainContent
      selectedCollectionId={selectedCollectionId}
      collections={collections}
      videosWithState={videosWithState}
      videosFetching={videosFetching}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      onCollectionChange={handleCollectionChange}
      onCollectionDeleted={handleCollectionDeleted}
      onToggleVideoSelection={toggleVideoSelection}
      onDeleteVideo={handleDeleteVideo}
      onVideoAdded={handleVideoAdded}
    />
  );
}
