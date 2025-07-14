import React from "react";

export interface Source {
  faviconUrl: string;
  alt: string;
}

export interface WhiteCardProps {
  title: string;
  summary: string;
  sources: Source[];
  timeAgo: string;
  className?: string;
  icon?: React.ReactNode;
}

export function WhiteCard({ title, summary, sources, timeAgo, className = "", icon }: WhiteCardProps) {
  return (
    <div
      className={`relative h-[219px] w-[238px] min-w-[225px] scale-[1.02] rounded-xl border border-gray-200 bg-white pt-2 pb-2 font-sans text-base leading-6 text-black shadow-sm transition-all duration-200 ${className}`}
    >
      {/* Header */}
      <div className="mb-2 flex flex-col gap-2 border-b border-gray-200 bg-transparent px-4 pb-2">
        <div className="text-primary-600 truncate text-sm leading-4 font-medium" title={title}>
          {title}
        </div>
        <div className="flex items-center gap-1 bg-transparent">
          {/* Favicon avatars */}
          <div className="relative ml-1 flex items-center">
            {sources.map((source, idx) => (
              <div
                key={source.faviconUrl}
                className={`relative z-0 -ml-1 h-[14px] w-[14px] flex-shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100 first:ml-0`}
              >
                <img
                  src={source.faviconUrl}
                  alt={source.alt}
                  width={14}
                  height={14}
                  className="h-[14px] w-[14px] rounded-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 rounded-full border border-black/10" />
              </div>
            ))}
          </div>
          {/* Meta info */}
          <div className="ml-2 flex items-center gap-1">
            {icon && <span className="text-xs text-blue-700">{icon}</span>}
            <span className="text-xs font-normal text-gray-500">
              <time>{timeAgo}</time>
            </span>
          </div>
        </div>
      </div>
      {/* Summary */}
      <div className="mb-1 flex flex-col gap-2 bg-transparent px-4">
        <div className="truncate-6-lines text-primary-700 text-sm leading-5">{summary}</div>
      </div>
    </div>
  );
}

// Tailwind utility for line clamping (add to globals if not present)
// .truncate-6-lines { @apply overflow-hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; }
