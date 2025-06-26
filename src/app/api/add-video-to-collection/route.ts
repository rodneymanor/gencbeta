import { NextRequest, NextResponse } from "next/server";

import { CollectionsAPIService } from "@/lib/collections-api";

// Simple API key authentication
const API_KEY = process.env.VIDEO_API_KEY ?? "your-secret-api-key";

export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { videoUrl, collectionId, title } = body;

    // Validate required fields
    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return NextResponse.json({ error: "Invalid video URL format" }, { status: 400 });
    }

    // Check if collection exists
    const collection = await CollectionsAPIService.getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Add video to collection
    const videoData = {
      url: videoUrl,
      title: title ?? `Video ${Date.now()}`,
      platform: "external",
      userId: collection.userId, // Use collection owner's ID
    };

    const videoId = await CollectionsAPIService.addVideoToCollection(collectionId, videoData);

    return NextResponse.json({
      success: true,
      message: "Video added successfully",
      videoId,
      collectionId,
      video: {
        id: videoId,
        ...videoData,
      },
    });
  } catch (error) {
    console.error("Error adding video to collection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// Optional: Add GET method to retrieve collection info
export async function GET(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get collection ID from query params
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 });
    }

    // Get collection details
    const collection = await CollectionsAPIService.getCollectionById(collectionId);
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Get videos in collection
    const videos = await CollectionsAPIService.getCollectionVideos(collectionId);

    return NextResponse.json({
      collection: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        videoCount: videos.length,
      },
      videos: videos.map((video) => ({
        id: video.id,
        title: video.title,
        url: video.url,
        platform: video.platform,
        addedAt: video.addedAt,
      })),
    });
  } catch (error) {
    console.error("Error retrieving collection:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
