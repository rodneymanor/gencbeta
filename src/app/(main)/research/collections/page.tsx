import { Suspense } from "react";

import { VideoCollectionLoading, PageHeaderLoading } from "@/components/ui/loading-animations";

import CollectionsPageContent from "./_components/collections-page-content";

// Loading fallback for the entire page
function CollectionsPageSkeleton() {
  return (
    <div className="@container/main">
      <div className="mx-auto flex max-w-6xl gap-6 p-4 md:p-6">
        <div className="min-w-0 flex-1 space-y-8 md:space-y-10">
          <PageHeaderLoading />
          <VideoCollectionLoading count={12} />
        </div>
        <div className="hidden w-[313px] flex-shrink-0 md:block">
          <div className="animate-pulse">
            <div className="bg-muted mb-4 h-6 rounded"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-muted/50 h-8 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main server component page with Suspense boundaries
export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsPageContent initialCollections={[]} initialVideos={[]} />
    </Suspense>
  );
}
