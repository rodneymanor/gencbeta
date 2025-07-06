"use client";

import { useState } from "react";

import { type Collection } from "@/lib/collections";

interface CollectionSidebarProps {
  collections: Collection[];
  selectedCollectionId?: string | null;
  onSelectionChange?: (collectionId: string | null) => void;
  className?: string;
  videoCount: number;
}

export default function CollectionSidebar({
  collections,
  selectedCollectionId,
  onSelectionChange,
  className = "",
  videoCount,
}: CollectionSidebarProps) {
  const [activeId, setActiveId] = useState(selectedCollectionId || null);

  // Create items array with "All Videos" as first item
  const items = [
    {
      id: null,
      name: "All Videos",
      count: videoCount,
    },
    ...collections.map((collection) => ({
      id: collection.id!,
      name: collection.title,
      count: collection.videoCount || 0,
    })),
  ];

  const handleItemClick = (itemId: string | null) => {
    setActiveId(itemId);
    onSelectionChange?.(itemId);
  };

  return (
    <div
      className={`p-4 isolate hidden flex-col items-end md:flex ${className}`}
      style={{ opacity: 1, transform: "none", transformOrigin: "50% 50% 0px" }}
      role="navigation"
      aria-label="Collections"
    >
      <div className="w-full">
        <h3 className="text-sm font-medium text-muted-foreground mb-4 px-6">Collections</h3>
        <ul className="-mb-1 flex w-full flex-col items-start">
          {items.map((item) => {
            const isActive = item.id === activeId;

            return (
              <li
                key={item.id || "all"}
                className="group relative flex select-none flex-col transition-all duration-500 ease-out w-full"
                style={{
                  animationDuration: "1800ms",
                  height: isActive ? "44px" : "32px",
                }}
              >
                <div
                  className="flex items-center justify-start w-full h-full transition-all duration-500 ease-out"
                  style={{
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "left center",
                  }}
                >
                  <div
                    className={`gap-1 pl-6 pr-4 line-clamp-2 cursor-pointer duration-500 ease-out group-hover:opacity-100 font-sans selection:bg-blue-500/50 selection:text-gray-900 dark:selection:bg-blue-500/10 dark:selection:text-blue-500 transition-all flex items-center justify-between w-full ${
                      isActive
                        ? "opacity-100 font-semibold text-foreground text-sm"
                        : "opacity-75 text-muted-foreground text-sm font-normal hover:opacity-90"
                    }`}
                    onClick={() => handleItemClick(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleItemClick(item.id);
                      }
                    }}
                    aria-pressed={isActive}
                    style={{
                      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  >
                    <span className="truncate">{item.name}</span>
                    <span className={`text-xs ${isActive ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                      {item.count}
                    </span>
                  </div>
                </div>

                {/* Active/Inactive indicator with smooth transitions */}
                <div
                  className={`absolute bottom-0 left-0 top-0 z-[1] rounded-full transition-all duration-500 ease-out ${
                    isActive
                      ? "bg-foreground opacity-100 w-[3px] shadow-sm"
                      : "bg-foreground opacity-20 w-[2px]"
                  }`}
                  style={{
                    transform: isActive ? "scaleY(1)" : "scaleY(0.8)",
                    transformOrigin: "center",
                  }}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 