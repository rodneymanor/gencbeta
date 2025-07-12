"use client";

import React, { useState, useRef, useEffect } from "react";

import { Bookmark } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Collection } from "@/lib/collections";

interface CollectionsTabNavProps {
  collections: Collection[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  allVideosCount: number;
  favoriteVideosCount: number;
}

export function CollectionsTabNav({
  collections,
  activeId,
  onSelect,
  allVideosCount,
  favoriteVideosCount,
}: CollectionsTabNavProps) {
  // Build tabs: All, favorites, others
  const fav = collections.filter((c) => c.favorite).sort((a, b) => a.title.localeCompare(b.title));
  const others = collections.filter((c) => !c.favorite).sort((a, b) => a.title.localeCompare(b.title));

  const tabs: Array<{ id: string | null; label: string; favorite?: boolean; count: number }> = [
    { id: null, label: "All Videos", count: allVideosCount },
    ...(fav.length > 0 ? [{ id: "favorites", label: "Favorites", count: favoriteVideosCount, favorite: true }] : []),
    ...fav.map((c) => ({ id: c.id!, label: c.title, favorite: true, count: c.videoCount })),
    ...others.map((c) => ({ id: c.id!, label: c.title, count: c.videoCount })),
  ];

  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 10);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [tabs.length]);

  return (
    <div className="relative h-12 w-full md:h-14">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="scrollbar-none -mx-4 flex min-w-0 snap-x snap-mandatory gap-1 overflow-x-auto overflow-y-hidden md:mx-0"
        style={{ maskImage: "linear-gradient(to left, transparent 0%, black 10%)" }}
        onScroll={updateScrollButtons}
      >
        <div className="w-4 shrink-0 snap-start md:hidden" />

        {tabs.map((tab) => {
          const isActive = (activeId ?? null) === tab.id;
          return (
            <div key={tab.id ?? "all"}>
              <div className="group relative isolate flex min-w-16 shrink-0 snap-start items-center justify-center duration-150 select-none hover:opacity-80">
                <button
                  className="relative z-[2] flex h-full flex-row items-center gap-1.5 px-3 py-3 duration-150 outline-none active:scale-95"
                  onClick={() => onSelect(tab.id)}
                >
                  {tab.favorite && (
                    <Bookmark size={14} className={isActive ? "text-yellow-400" : "text-muted-foreground"} />
                  )}
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </span>
                </button>
                {isActive && <div className="bg-primary/10 absolute inset-x-0 inset-y-2 -z-10 rounded-full" />}
              </div>
            </div>
          );
        })}

        <div className="w-6 shrink-0 snap-start md:hidden" />
      </div>

      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => {
            containerRef.current?.scrollBy({ left: -150, behavior: "smooth" });
          }}
          className="border-border text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-accent bg-background absolute top-1/2 left-0 z-30 hidden aspect-square h-8 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm md:inline-flex"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => {
            containerRef.current?.scrollBy({ left: 150, behavior: "smooth" });
          }}
          className="border-border text-muted-foreground hover:text-foreground hover:border-foreground hover:bg-accent bg-background absolute top-1/2 right-0 z-30 hidden aspect-square h-8 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm md:inline-flex"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      )}
    </div>
  );
}
