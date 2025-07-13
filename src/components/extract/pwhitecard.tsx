import React from 'react';

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

export function WhiteCard({
  title,
  summary,
  sources,
  timeAgo,
  className = '',
  icon,
}: WhiteCardProps) {
  return (
    <div
      className={`relative h-[219px] min-w-[225px] w-[238px] bg-white text-black text-base leading-6 font-sans rounded-xl border border-gray-200 shadow-sm pt-2 pb-2 transition-all duration-200 scale-[1.02] ${className}`}
    >
      {/* Header */}
      <div className="mb-2 flex flex-col gap-2 bg-transparent px-4 pb-2 border-b border-gray-200">
        <div className="truncate font-medium text-sm leading-4 text-primary-600" title={title}>
          {title}
        </div>
        <div className="flex items-center gap-1 bg-transparent">
          {/* Favicon avatars */}
          <div className="relative flex items-center ml-1">
            {sources.map((source, idx) => (
              <div
                key={source.faviconUrl}
                className={`relative z-0 -ml-1 first:ml-0 flex-shrink-0 overflow-hidden bg-gray-100 rounded-full w-[14px] h-[14px] border border-gray-100`}
              >
                <img
                  src={source.faviconUrl}
                  alt={source.alt}
                  width={14}
                  height={14}
                  className="w-[14px] h-[14px] object-cover rounded-full"
                />
                <div className="absolute inset-0 border border-black/10 rounded-full pointer-events-none" />
              </div>
            ))}
          </div>
          {/* Meta info */}
          <div className="flex items-center gap-1 ml-2">
            {icon && <span className="text-xs text-blue-700">{icon}</span>}
            <span className="text-xs font-normal text-gray-500">
              <time>{timeAgo}</time>
            </span>
          </div>
        </div>
      </div>
      {/* Summary */}
      <div className="mb-1 flex flex-col gap-2 bg-transparent px-4">
        <div className="truncate-6-lines text-sm leading-5 text-primary-700">
          {summary}
        </div>
      </div>
    </div>
  );
}

// Tailwind utility for line clamping (add to globals if not present)
// .truncate-6-lines { @apply overflow-hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; } 