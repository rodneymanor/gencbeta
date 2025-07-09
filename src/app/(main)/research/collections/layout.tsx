import { Suspense } from "react";

import { FirefoxVideoManager } from "@/components/firefox-video-manager";

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </div>
      {/* Global Firefox video manager for handling Firefox-specific issues */}
      <FirefoxVideoManager />
    </div>
  );
}
