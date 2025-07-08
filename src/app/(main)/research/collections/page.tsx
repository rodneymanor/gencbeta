"use client";

// Prevent Next.js from attempting to statically prerender a client-side page
export const dynamic = "force-dynamic";

import { memo, Suspense } from "react";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { VideoCollectionLoading } from "@/components/ui/loading-animations";
import { Collection } from "@/lib/collections";

import CategoryChooser from "./_components/category-chooser";
import { CollectionBadgeMenu } from "./_components/collection-badge-menu";
import { badgeVariants } from "./_components/collections-animations";
import { ManageModeHeader } from "./_components/manage-mode-header";
import { VideoGrid } from "./_components/video-grid";
import { useCollectionsPage } from "./_hooks/use-collections-page";

// Optimized collection badge with smooth transitions and management menu
const CollectionBadge = memo(
  ({
    collection,
    isActive,
    onClick,
    videoCount,
    isTransitioning,
    onCollectionDeleted,
  }: {
    collection?: Collection;
    isActive: boolean;
    onClick: () => void;
    videoCount: number;
    isTransitioning: boolean;
    onCollectionDeleted: () => void;
  }) => (
    <motion.div
      variants={badgeVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      layout
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="group relative"
    >
      <Badge
        variant="outline"
        className={`focus-visible:ring-ring cursor-pointer font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isActive
            ? "bg-secondary text-foreground hover:bg-secondary/80 border-border/60 font-semibold shadow-sm"
            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/40 bg-transparent font-normal"
        } ${isTransitioning && isActive ? "opacity-75" : ""} ${isTransitioning ? "pointer-events-none" : ""} min-h-[36px] rounded-md border-0 px-4 py-2.5 text-sm shadow-xs hover:shadow-sm`}
        onClick={isTransitioning ? undefined : onClick}
      >
        {collection ? `${collection.title} (${collection.videoCount})` : `All Videos (${videoCount})`}
      </Badge>
      {collection && (
        <div className="absolute -top-1 -right-1">
          <CollectionBadgeMenu
            collection={collection}
            onCollectionDeleted={onCollectionDeleted}
            className="bg-background border-border rounded-md border shadow-md transition-shadow duration-200 hover:shadow-lg"
          />
        </div>
      )}
    </motion.div>
  ),
);

CollectionBadge.displayName = "CollectionBadge";

// Main collections page component - simplified and optimized
function CollectionsPageContent() {
  const {
    collections,
    videos,
    isTransitioning,
    manageMode,
    selectedVideos,
    deletingVideos,
    isPending,
    selectedCollectionId,
    pageTitle,
    pageDescription,
    categoryItems,
    setManageMode,
    handleCollectionChange,
    toggleVideoSelection,
    selectAllVideos,
    clearSelection,
    handleVideoAdded,
    handleDeleteVideo,
    handleBulkDelete,
    handleExitManageMode,
    shouldShowLoading,
  } = useCollectionsPage();

  // Don't show anything until collections are loaded and validated
  if (shouldShowLoading) {
    return <VideoCollectionLoading />;
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl justify-center gap-8 p-4 md:p-6">
      {/* Left side: Main content (Video Grid) */}
      <div className="flex-1">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground max-w-prose">{pageDescription}</p>
          </div>
          <div className="flex items-center gap-2">
            <ManageModeHeader
              manageMode={manageMode}
              selectedVideos={selectedVideos}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onManageModeToggle={() => setManageMode(!manageMode)}
              onExitManageMode={handleExitManageMode}
              onBulkDelete={handleBulkDelete}
              onClearSelection={clearSelection}
              onSelectAll={selectAllVideos}
              onVideoAdded={handleVideoAdded}
            />
          </div>
        </header>

        <main>
          <VideoGrid
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
        </main>
      </div>

      {/* Right side: Category Chooser */}
      <div className="w-64">
        <CategoryChooser
          items={categoryItems}
          selectedId={selectedCollectionId ?? "all-videos"}
          onSelectionChange={(item) => handleCollectionChange(item.id === "all-videos" ? null : item.id)}
        />
      </div>
    </div>
  );
}

// Main export
export default function CollectionsPage() {
  return (
    <Suspense fallback={<VideoCollectionLoading />}>
      <CollectionsPageContent />
    </Suspense>
  );
}
