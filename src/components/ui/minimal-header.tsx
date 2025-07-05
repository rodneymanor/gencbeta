"use client";

import { DrawerNav } from "@/components/ui/drawer-nav";
import { GenCLogo } from "@/components/ui/gen-c-logo";

interface MinimalHeaderProps {
  navigationContent: React.ReactNode;
  children?: React.ReactNode;
}

export function MinimalHeader({ navigationContent, children }: MinimalHeaderProps) {
  return (
    <header className="center-column">
      <div className="flex items-center justify-between py-4">
        {/* Left: Navigation + Logo */}
        <div className="flex items-center gap-4">
          <DrawerNav>
            {navigationContent}
          </DrawerNav>
          <GenCLogo iconSize="sm" textSize="sm" />
        </div>

        {/* Right: Optional additional content */}
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export default MinimalHeader; 