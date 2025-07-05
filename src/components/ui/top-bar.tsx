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

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border/50 bg-background/95 backdrop-blur-sm rounded-t-xl",
        config.className
      )}
    >
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
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
            <h1 className="text-lg font-semibold truncate">{config.title}</h1>
          )}
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-2">
          {config.titlePosition === 'center' && config.showTitle && config.title && (
            <h1 className="text-lg font-semibold truncate">{config.title}</h1>
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