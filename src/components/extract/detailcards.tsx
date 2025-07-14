import React from "react";

export interface DetailCardProps {
  faviconUrl: string;
  domain: string;
  title: string;
  className?: string;
}

export function DetailCard({ faviconUrl, domain, title, className = "" }: DetailCardProps) {
  return (
    <div
      className={`w-[179px] rounded-lg border border-gray-200/50 bg-white font-sans text-base leading-6 text-black transition-all duration-300 ${className}`}
    >
      <div className="pointer-events-none relative flex h-[68px] w-[179px] max-w-full flex-col gap-1 p-2 select-none">
        {/* Header with favicon and domain */}
        <div className="flex w-[163px] items-center justify-between">
          <div className="flex">
            <div className="flex items-center gap-1.5 bg-transparent">
              {/* Favicon */}
              <div className="relative -mt-px flex-shrink-0 font-sans text-xs leading-4 font-medium text-blue-600/70">
                <div className="flex h-4 w-4 items-center justify-center">
                  <div className="relative h-4 w-4 overflow-hidden rounded-full">
                    <div className="absolute inset-0 rounded-full bg-white"></div>
                    <img
                      alt={`${domain} favicon`}
                      width={16}
                      height={16}
                      src={faviconUrl}
                      className="relative h-4 w-4 max-w-full align-middle"
                    />
                    <div className="absolute inset-0 rounded-full border border-black/10"></div>
                  </div>
                </div>
              </div>

              {/* Domain */}
              <div className="line-clamp-1 max-w-[150px] min-w-0 flex-1 font-sans text-xs leading-4 font-medium break-all text-blue-600/70 transition-all duration-300">
                {domain}
              </div>
            </div>
          </div>
          <div></div>
        </div>

        {/* Title */}
        <div className="font-sans text-xs leading-4 font-medium text-blue-600">
          <span className="line-clamp-2 text-left">{title}</span>
        </div>
      </div>
    </div>
  );
}
