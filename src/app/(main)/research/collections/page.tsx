import { fetchCollections, fetchVideos } from "@/lib/collections-data";

import PageClient from "./page-client";

export const dynamic = "force-dynamic"; // always fresh

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: { collection?: string };
}) {
  const { collection } = await searchParams;
  const selected = collection ?? null;

  // 1. Fetch on the server – runs in parallel
  const [collections, videos] = await Promise.all([fetchCollections(), fetchVideos(selected)]);

  return (
    <PageClient
      initialCollections={collections}
      initialVideos={videos}
      initialCollectionId={selected}
    />
  );
}
