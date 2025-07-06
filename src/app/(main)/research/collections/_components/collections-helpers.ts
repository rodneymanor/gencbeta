import { type Video, type Collection } from "@/lib/collections";

export interface VideoWithPlayer extends Video {
  isPlaying?: boolean;
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  hostedOnCDN?: boolean;
}

export const getPageTitle = (selectedCollectionId: string | null, collections: Collection[]) => {
  if (!selectedCollectionId) {
    return "All Videos";
  }

  const collection = collections.find((c) => c.id === selectedCollectionId);
  return collection ? collection.title : "Collection";
};

export const getPageDescription = (selectedCollectionId: string | null, collections: Collection[]) => {
  if (!selectedCollectionId) {
    return "All your videos across collections";
  }

  const collection = collections.find((c) => c.id === selectedCollectionId);
  return collection?.description ?? "Collection videos";
};

export const createVideoSelectionHandlers = (
  setSelectedVideos: React.Dispatch<React.SetStateAction<Set<string>>>,
  videosRef: React.MutableRefObject<VideoWithPlayer[]>,
) => {
  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const selectAllVideos = () => {
    const allVideoIds = videosRef.current.map((v) => v.id!);
    setSelectedVideos(new Set(allVideoIds));
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  return {
    toggleVideoSelection,
    selectAllVideos,
    clearSelection,
  };
};
