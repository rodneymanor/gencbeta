"use client";

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTopBar } from '@/contexts/topbar-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { config } = useTopBar();

  if (!config.showTitle && !config.customContent && !config.actions) {
    return null;
  }

  const height = config.height || 64;
  const isCollectionsTopbar = config.className?.includes('collections-topbar');
  const isTwoColumnLayout = config.className?.includes('collections-topbar-two-column');

  return (
    <header
      className={cn(
        "flex shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/50 bg-background/95 backdrop-blur-sm rounded-t-xl",
        config.className
      )}
      style={{ height: `${height}px` }}
    >
      <div className={cn(
        "flex w-full items-center justify-between px-4 lg:px-6",
        isCollectionsTopbar && !isTwoColumnLayout && "mx-auto max-w-4xl",
        isTwoColumnLayout ? "mx-auto max-w-6xl justify-start gap-12" : "justify-between"
      )}>
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {config.showBackButton && config.backHref && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={config.backHref}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-4" />
            </>
          )}
          
          {config.titlePosition === 'left' && config.showTitle && config.title && (
            <div className="flex items-center gap-2">
              {config.titleIcon && (
                <config.titleIcon className="h-5 w-5" />
              )}
              <h1 className={cn("text-lg font-semibold truncate", config.titleClassName)}>{config.title}</h1>
            </div>
          )}
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-2">
          {config.titlePosition === 'center' && config.showTitle && config.title && (
            <div className="flex items-center gap-2">
              {config.titleIcon && (
                <config.titleIcon className="h-5 w-5" />
              )}
              <h1 className="text-lg font-semibold truncate">{config.title}</h1>
            </div>
          )}
          
          {config.customContent && (
            <div className="flex items-center gap-2">
              {config.customContent}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {config.actions && (
            <div className="flex items-center gap-2">
              {config.actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 