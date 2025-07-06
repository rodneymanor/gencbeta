import { Suspense } from "react";

import { VideoCollectionLoading, PageHeaderLoading } from "@/components/ui/loading-animations";

import CollectionsPageContent from "./_components/collections-page-content";

// Loading fallback for the entire page
function CollectionsPageSkeleton() {
  return (
    <div className="@container/main">
      <div className="flex gap-6 max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex-1 min-w-0 space-y-8 md:space-y-10">
          <PageHeaderLoading />
          <VideoCollectionLoading count={12} />
        </div>
        <div className="hidden md:block w-[313px] flex-shrink-0">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main collections page - now fully client-side with React Query
export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsPageSkeleton />}>
      <CollectionsPageContent
        initialCollections={[]}
        initialVideos={[]}
      />
    </Suspense>
  );
}
