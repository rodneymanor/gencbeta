import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="@container/main">
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="relative mx-auto w-full max-w-sm">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900/50 to-black/50 shadow-lg">
                <CardContent className="p-0">
                  <Skeleton className="aspect-[9/16] w-full" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function VideosLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="relative mx-auto w-full max-w-sm">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-gray-900/50 to-black/50 shadow-lg">
            <CardContent className="p-0">
              <Skeleton className="aspect-[9/16] w-full" />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
