"use client";

import { useState, useEffect, useCallback, useMemo, useTransition, useRef } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

import { useAuth } from "@/contexts/auth-context";
import { useTopBarConfig } from "@/hooks/use-route-topbar";
import type { Collection, Video } from "@/lib/collections";

import { CollectionBadge } from "./collection-badge";
import CollectionSidebar from "./collection-sidebar";
import { CollectionsDataManager } from "./collections-data-manager";
import {
  type VideoWithPlayer,
  getPageTitle,
  getPageDescription,
  createVideoSelectionHandlers,
} from "./collections-helpers";
import { CollectionsTopbarActions } from "./collections-topbar-actions";
import { useCollectionsLogic } from "./use-collections-logic";
import { VideoGridWithSuspense } from "./video-grid-with-suspense";

// Smooth cross-fade component with proper keying
const Fade = ({ children, keyId }: { children: React.ReactNode; keyId: string }) => (
  <motion.div
    key={keyId}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

interface CollectionsPageContentProps {
  initialCollections: Collection[];
  initialVideos: VideoWithPlayer[];
}

// Main collections page client component - optimized for smooth transitions
export default function CollectionsPageContent({ initialCollections, initialVideos }: CollectionsPageContentProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [videos, setVideos] = useState<VideoWithPlayer[]>(initialVideos);
  const [, setPreviousVideos] = useState<VideoWithPlayer[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const videosRef = useRef<VideoWithPlayer[]>(videos);
  const cacheRef = useRef({ data: new Map() });
  const previousCollectionRef = useRef<string | null>(null);
  const dataManager = useMemo(() => new CollectionsDataManager(cacheRef), []);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCollectionId = searchParams.get("collection");
  const setTopBarConfig = useTopBarConfig();

  const selectionActions = useMemo(() => createVideoSelectionHandlers(setSelectedVideos, videosRef), []);

  const { toggleVideoSelection, selectAllVideos, clearSelection } = selectionActions;
  const pageTitle = useMemo(() => getPageTitle(selectedCollectionId, collections), [selectedCollectionId, collections]);
  const pageDescription = useMemo(
    () => getPageDescription(selectedCollectionId, collections),
    [selectedCollectionId, collections],
  );

  const handleVideoResult = useCallback(
    (videosResult: PromiseSettledResult<Video[]>, collectionId: string | null) => {
      if (videosResult.status === "fulfilled") {
        const optimizedVideos = videosResult.value.map((video) => ({
          ...video,
          isPlaying: false,
        }));

        setPreviousVideos(videosRef.current);
        startTransition(() => {
          setVideos(optimizedVideos);
        });
        dataManager.setCachedVideos(collectionId, optimizedVideos);
      } else {
        console.error("Error loading videos:", videosResult.reason);
        if (videosResult.reason?.message?.includes("Collection not found") && !dataManager.getCachedVideos(null)) {
          setPreviousVideos(videosRef.current);
          startTransition(() => {
            setVideos([]);
          });
        }
      }
    },
    [dataManager],
  );

  const loadData = useCallback(
    async (targetCollectionId?: string | null) => {
      if (!user) return;

      const collectionId = targetCollectionId !== undefined ? targetCollectionId : selectedCollectionId;
      const cachedVideos = dataManager.getCachedVideos(collectionId);

      if (cachedVideos) {
        setPreviousVideos(videosRef.current);
        startTransition(() => {
          setVideos(cachedVideos);
        });
        setTimeout(() => setIsTransitioning(false), 50);
        return;
      }

      try {
        const [collectionsResult, videosResult] = await dataManager.loadCollectionsAndVideos(
          user.uid,
          collectionId ?? undefined,
        );

        if (collectionsResult.status === "fulfilled") {
          startTransition(() => {
            setCollections(collectionsResult.value);
          });

          if (!dataManager.validateCollectionExists(collectionId, collectionsResult.value, router, startTransition)) {
            return;
          }
        }

        handleVideoResult(videosResult, collectionId);
      } catch (error) {
        console.error("❌ [Collections] Error loading data:", error);
      } finally {
        setTimeout(() => setIsTransitioning(false), 50);
      }
    },
    [user, selectedCollectionId, dataManager, handleVideoResult, router],
  );

  const handleCollectionChange = useCallback(
    (collectionId: string | null) => {
      if (collectionId === previousCollectionRef.current || isTransitioning) return;

      previousCollectionRef.current = collectionId;
      const cachedVideos = dataManager.getCachedVideos(collectionId);

      if (cachedVideos) {
        setPreviousVideos(videosRef.current);
        startTransition(() => {
          setVideos(cachedVideos);
        });
      } else {
        setIsTransitioning(true);
      }

      startTransition(() => {
        const path = collectionId ? `/research/collections?collection=${collectionId}` : "/research/collections";
        router.push(path, { scroll: false });
      });

      if (!cachedVideos) {
        loadData(collectionId);
      }
    },
    [router, isTransitioning, dataManager, loadData],
  );

  const { handleVideoAdded, handleCollectionDeleted, handleDeleteVideo, handleBulkDelete } = useCollectionsLogic({
    user,
    selectedCollectionId,
    dataManager,
    videosRef,
    setPreviousVideos,
    setVideos,
    setDeletingVideos,
    setSelectedVideos,
    startTransition,
    loadData,
    router,
  });

  // Auth and initial loading effects
  useEffect(() => {
    if (!user) {
      router.push("/auth/v1/login");
      return;
    }

    if (!userProfile) return;

    const allowedRoles = ["creator", "coach", "super_admin"];
    if (!allowedRoles.includes(userProfile.role)) {
      router.push("/dashboard");
      return;
    }
  }, [user, userProfile, router]);

  useEffect(() => {
    if (user && userProfile && videos.length === 0) {
      loadData();
    }
  }, [user, userProfile, videos.length, loadData]);

  const handleExitManageMode = useCallback(() => {
    setManageMode(false);
    setSelectedVideos(new Set());
  }, []);

  // Update top bar configuration
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
    selectedVideos,
    userProfile,
    handleVideoAdded,
    handleExitManageMode,
    handleBulkDelete,
    clearSelection,
    selectAllVideos,
  ]);

  const contentKey = `content-${selectedCollectionId ?? "all"}-${videos.length}`;

  return (
    <div className="@container/main">
      <Fade keyId={contentKey}>
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
                  videoCount={videos.length}
                  isTransitioning={isTransitioning && !selectedCollectionId}
                  onCollectionDeleted={handleCollectionDeleted}
                />
                {collections.map((collection) => (
                  <CollectionBadge
                    key={collection.id}
                    collection={collection}
                    isActive={selectedCollectionId === collection.id}
                    onClick={() => handleCollectionChange(collection.id!)}
                    videoCount={collection.videoCount || 0}
                    isTransitioning={isTransitioning && selectedCollectionId === collection.id}
                    onCollectionDeleted={handleCollectionDeleted}
                  />
                ))}
              </div>
            </section>

            <VideoGridWithSuspense
              videos={videos}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              loadingVideos={isTransitioning}
              isPending={isPending}
              manageMode={manageMode}
              selectedVideos={selectedVideos}
              deletingVideos={deletingVideos}
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
                videoCount={videos.length}
              />
            </div>
          </div>
        </div>
      </Fade>
    </div>
  );
}
