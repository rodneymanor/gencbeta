import { NextResponse, NextRequest } from "next/server";

import { fetchVideos } from "@/lib/collections-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const collectionId = searchParams.get("collectionId");

  try {
    const videos = await fetchVideos(collectionId);
    return NextResponse.json(videos);
  } catch (error) {
    console.error(`Error fetching videos for collection ${collectionId}:`, error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}
