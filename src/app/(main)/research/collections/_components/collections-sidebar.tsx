"use client";

import type { Collection } from "@/lib/collections";

interface CollectionsSidebarProps {
  collections: Collection[];
  selected: string | null;
  onChange: (id: string | null) => void;
  videoCount: number;
}

export default function CollectionsSidebar({ collections, selected, onChange, videoCount }: CollectionsSidebarProps) {
  return (
    <div className="isolate flex flex-col items-end p-4 md:flex">
      <div className="w-full">
        <h3 className="text-muted-foreground mb-4 px-6 text-sm font-medium">Collections</h3>
        <ul className="-mb-1 flex w-full flex-col items-start">
          <li className="group relative flex w-full flex-col transition-all duration-500 ease-out select-none">
            <div
              className="flex h-full w-full cursor-pointer items-center justify-start transition-all duration-500 ease-out"
              onClick={() => onChange(null)}
            >
              <div
                className={`line-clamp-2 flex w-full items-center justify-between gap-1 pr-4 pl-6 font-sans transition-all duration-500 ease-out group-hover:opacity-100 selection:bg-blue-500/50 selection:text-gray-900 dark:selection:bg-blue-500/10 dark:selection:text-blue-500 ${
                  selected === null
                    ? "text-foreground text-sm font-semibold opacity-100"
                    : "text-muted-foreground text-sm font-normal opacity-75 hover:opacity-90"
                }`}
              >
                <span className="truncate">All Videos</span>
                <span className={`text-xs ${selected === null ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                  {videoCount}
                </span>
              </div>
            </div>
            <div
              className={`absolute top-0 bottom-0 left-0 z-[1] rounded-full transition-all duration-500 ease-out ${
                selected === null ? "bg-foreground w-[3px] opacity-100 shadow-sm" : "bg-foreground w-[2px] opacity-20"
              }`}
            />
          </li>

          {collections.map((collection) => (
            <li
              key={collection.id}
              className="group relative flex w-full flex-col transition-all duration-500 ease-out select-none"
            >
              <div
                className="flex h-full w-full cursor-pointer items-center justify-start transition-all duration-500 ease-out"
                onClick={() => onChange(collection.id!)}
              >
                <div
                  className={`line-clamp-2 flex w-full items-center justify-between gap-1 pr-4 pl-6 font-sans transition-all duration-500 ease-out group-hover:opacity-100 selection:bg-blue-500/50 selection:text-gray-900 dark:selection:bg-blue-500/10 dark:selection:text-blue-500 ${
                    selected === collection.id
                      ? "text-foreground text-sm font-semibold opacity-100"
                      : "text-muted-foreground text-sm font-normal opacity-75 hover:opacity-90"
                  }`}
                >
                  <span className="truncate">{collection.title}</span>
                  <span
                    className={`text-xs ${selected === collection.id ? "text-muted-foreground" : "text-muted-foreground/60"}`}
                  >
                    {collection.videoCount}
                  </span>
                </div>
              </div>
              <div
                className={`absolute top-0 bottom-0 left-0 z-[1] rounded-full transition-all duration-500 ease-out ${
                  selected === collection.id
                    ? "bg-foreground w-[3px] opacity-100 shadow-sm"
                    : "bg-foreground w-[2px] opacity-20"
                }`}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
