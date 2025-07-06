"use client";

import { memo } from "react";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import type { Collection } from "@/lib/collections";

import { CollectionBadgeMenu } from "./collection-badge-menu";
import { badgeVariants } from "./collections-animations";

interface CollectionBadgeProps {
  collection?: Collection;
  isActive: boolean;
  onClick: () => void;
  videoCount: number;
  isTransitioning: boolean;
  onCollectionDeleted: () => void;
}

// Optimized collection badge with smooth transitions and stable layout
export const CollectionBadge = memo<CollectionBadgeProps>(
  ({ collection, isActive, onClick, videoCount, isTransitioning, onCollectionDeleted }) => (
    <motion.div
      variants={badgeVariants}
      initial="inactive"
      animate={isActive ? "active" : "inactive"}
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      layout
      layoutId={collection ? `badge-${collection.id}` : "badge-all"}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="group relative"
    >
      <Badge
        variant="outline"
        className={`focus-visible:ring-ring min-w-[120px] cursor-pointer font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 ${
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
