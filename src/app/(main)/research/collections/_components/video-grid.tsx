"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus } from "lucide-react";

import type { Collection } from "@/lib/collections";

import { AddVideoDialog } from "./add-video-dialog";
import { containerVariants, itemVariants } from "./collections-animations";
import type { VideoWithPlayer } from "./collections-helpers";
import { VideosLoadingSkeleton } from "./loading-skeleton";
import { VideoCard } from "./video-card";

interface VideoGridProps {
  videos: VideoWithPlayer[];
  collections: Collection[];
  selectedCollectionId: string | null;
  loadingVideos: boolean;
  isPending: boolean;
  manageMode: boolean;
  selectedVideos: Set<string>;
  deletingVideos: Set<string>;
  onToggleVideoSelection: (videoId: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onVideoAdded: () => void;
}

export function VideoGrid({
  videos,
  collections,
  selectedCollectionId,
  loadingVideos,
  isPending,
  manageMode,
  selectedVideos,
  deletingVideos,
  onToggleVideoSelection,
  onDeleteVideo,
  onVideoAdded,
}: VideoGridProps) {
  return (
    <motion.section
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {loadingVideos || isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <VideosLoadingSkeleton />
          </motion.div>
        ) : videos.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <motion.div
              className="bg-muted/50 mb-6 rounded-full p-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <Plus className="text-muted-foreground h-12 w-12" />
            </motion.div>
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-foreground text-xl font-semibold">No videos yet</h3>
              <p className="text-muted-foreground max-w-md">
                Add your first video to get started with content analysis and research
              </p>
              <div className="pt-4">
                <AddVideoDialog
                  collections={collections.filter((c) => c.id).map((c) => ({ id: c.id!, title: c.title }))}
                  selectedCollectionId={selectedCollectionId ?? undefined}
                  onVideoAdded={onVideoAdded}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <LayoutGroup>
            <motion.div
              key="videos"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence mode="popLayout">
                {videos.map((video) => (
                  <motion.div
                    key={video.id}
                    variants={itemVariants}
                    layout
                    layoutId={video.id}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{
                      y: -4,
                      transition: { type: "spring", stiffness: 400, damping: 30 },
                    }}
                  >
                    <VideoCard
                      video={video}
                      manageMode={manageMode}
                      isSelected={selectedVideos.has(video.id!)}
                      isDeleting={deletingVideos.has(video.id!)}
                      onToggleSelection={() => onToggleVideoSelection(video.id!)}
                      onDelete={() => onDeleteVideo(video.id!)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </LayoutGroup>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
