import { fetchCollections, fetchVideos } from "@/lib/collections-server";
import { ReactQueryHydrate } from "@/providers/react-query-provider";

import CollectionsPageClient from "./page-client";

export const dynamic = "force-dynamic"; // always fresh

export default async function CollectionsPage({ searchParams }: { searchParams: { collection?: string } }) {
  const selected = searchParams.collection ?? null;

  // 1. Fetch on the server – runs in parallel
  const [collections, videos] = await Promise.all([fetchCollections(), fetchVideos(selected)]);

  return (
    <ReactQueryHydrate>
      <CollectionsPageClient initialCollections={collections} initialVideos={videos} initialCollectionId={selected} />
    </ReactQueryHydrate>
  );
}
