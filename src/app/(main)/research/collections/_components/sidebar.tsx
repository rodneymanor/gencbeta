"use client";

import type { Collection } from "@/lib/collections";

export default function Sidebar({
  collections,
  selected,
  onChange,
}: {
  collections: Collection[];
  selected: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="w-full">
      <h3 className="text-muted-foreground mb-4 px-6 text-sm font-medium">Collections</h3>
      <button
        onClick={() => onChange(null)}
        className={`w-full rounded-md px-6 py-2 text-left ${selected === null ? "bg-muted font-bold" : ""}`}
      >
        All Videos
      </button>

      {collections.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id!)}
          className={`w-full rounded-md px-6 py-2 text-left ${selected === c.id ? "bg-muted font-bold" : ""}`}
        >
          {c.title} ({c.videoCount})
        </button>
      ))}
    </div>
  );
}
