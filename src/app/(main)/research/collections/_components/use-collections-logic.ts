import { useCallback } from "react";

import type { Collection } from "@/lib/collections";

import { CollectionsDataManager } from "./collections-data-manager";
import type { VideoWithPlayer } from "./collections-helpers";

interface UseCollectionsLogicProps {
  user: any;
  selectedCollectionId: string | null;
  dataManager: CollectionsDataManager;
  videosRef: React.MutableRefObject<VideoWithPlayer[]>;
  setPreviousVideos: React.Dispatch<React.SetStateAction<VideoWithPlayer[]>>;
  setVideos: React.Dispatch<React.SetStateAction<VideoWithPlayer[]>>;
  setDeletingVideos: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectedVideos: React.Dispatch<React.SetStateAction<Set<string>>>;
  startTransition: (callback: () => void) => void;
  loadData: () => Promise<void>;
  router: any;
}

export const useCollectionsLogic = ({
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
}: UseCollectionsLogicProps) => {
  const handleVideoAdded = useCallback(async () => {
    dataManager.clearCache();
    await loadData();
  }, [loadData, dataManager]);

  const handleCollectionDeleted = useCallback(async () => {
    if (!user) return;

    try {
      if (selectedCollectionId) {
        startTransition(() => {
          router.push("/research/collections");
        });
      }

      dataManager.clearCache();
      await loadData();
    } catch (error) {
      console.error("Error refreshing after collection deleted:", error);
    }
  }, [user, selectedCollectionId, router, loadData, dataManager, startTransition]);

  const handleDeleteVideo = useCallback(
    async (videoId: string) => {
      if (!user) return;

      setDeletingVideos((prev) => new Set([...prev, videoId]));

      try {
        await dataManager.deleteVideo(user.uid, videoId);

        setPreviousVideos(videosRef.current);
        startTransition(() => {
          setVideos((prev) => {
            const newVideos = prev.filter((video) => video.id !== videoId);
            dataManager.setCachedVideos(selectedCollectionId, newVideos);
            return newVideos;
          });
        });

        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } catch (error) {
        console.error("Error deleting video:", error);
        await loadData();
        setDeletingVideos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      }
    },
    [
      user,
      selectedCollectionId,
      dataManager,
      loadData,
      videosRef,
      setPreviousVideos,
      setVideos,
      setDeletingVideos,
      startTransition,
    ],
  );

  const handleBulkDelete = useCallback(
    async (selectedVideos: Set<string>) => {
      if (!user || selectedVideos.size === 0) return;

      const videoIds = Array.from(selectedVideos);
      setDeletingVideos((prev) => new Set([...prev, ...videoIds]));

      try {
        await dataManager.deleteBulkVideos(user.uid, videoIds);

        setPreviousVideos(videosRef.current);
        startTransition(() => {
          setVideos((prev) => {
            const newVideos = prev.filter((video) => !videoIds.includes(video.id!));
            dataManager.setCachedVideos(selectedCollectionId, newVideos);
            return newVideos;
          });
        });

        setSelectedVideos(new Set());
        setDeletingVideos(new Set());
      } catch (error) {
        console.error("Error deleting videos:", error);
        await loadData();
        setDeletingVideos(new Set());
      }
    },
    [
      user,
      selectedCollectionId,
      dataManager,
      loadData,
      videosRef,
      setPreviousVideos,
      setVideos,
      setDeletingVideos,
      setSelectedVideos,
      startTransition,
    ],
  );

  return {
    handleVideoAdded,
    handleCollectionDeleted,
    handleDeleteVideo,
    handleBulkDelete,
  };
};
