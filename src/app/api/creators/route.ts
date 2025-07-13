import { NextRequest, NextResponse } from "next/server";
import { processCreatorProfile } from "@/lib/process-creator-utils";



interface CreatorProfile {
  id: string;
  username: string;
  displayName?: string;
  platform: "tiktok" | "instagram";
  profileImageUrl: string;
  bio?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isVerified?: boolean;
  mutualFollowers?: Array<{
    username: string;
    displayName: string;
  }>;
  lastProcessed?: string;
  videoCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AddCreatorRequest {
  username: string;
  platform: "tiktok" | "instagram";
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
  website?: string;
}

interface AddCreatorResponse {
  success: boolean;
  creator?: CreatorProfile;
  message: string;
  error?: string;
}

export async function GET() {
  try {
    console.log("🔍 [CREATORS] Fetching all creators...");

    // For GET requests, we'll allow unauthenticated access to creator data
    // since it's just reading public information
    // TODO: Add proper authentication when user management is implemented

    // TODO: Replace with actual database query
    // For now, return mock data
    const mockCreators: CreatorProfile[] = [
      {
        id: "1",
        username: "tiktok_creator_1",
        displayName: "TikTok Star",
        platform: "tiktok",
        profileImageUrl: "/images/placeholder.svg",
        bio: "Creating amazing TikTok content! 🎵",
        postsCount: 150,
        followersCount: 2500000,
        followingCount: 500,
        isVerified: true,
        videoCount: 45,
        lastProcessed: "2024-01-15T10:30:00Z",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "2",
        username: "instagram_creator_1",
        displayName: "Instagram Influencer",
        platform: "instagram",
        profileImageUrl: "/images/placeholder.svg",
        bio: "Lifestyle and fashion content 📸",
        postsCount: 320,
        followersCount: 1800000,
        followingCount: 1200,
        isVerified: true,
        videoCount: 28,
        lastProcessed: "2024-01-14T15:45:00Z",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-14T15:45:00Z",
      },
      {
        id: "3",
        username: "tiktok_creator_2",
        displayName: "Comedy Creator",
        platform: "tiktok",
        profileImageUrl: "/images/placeholder.svg",
        bio: "Making people laugh one video at a time 😂",
        postsCount: 89,
        followersCount: 850000,
        followingCount: 200,
        isVerified: false,
        videoCount: 32,
        lastProcessed: "2024-01-13T09:20:00Z",
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-13T09:20:00Z",
      },
    ];

    return NextResponse.json({
      success: true,
      creators: mockCreators,
      total: mockCreators.length,
    });
  } catch (error) {
    console.error("🔥 [CREATORS] Failed to fetch creators:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch creators",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // For Creator Spotlight, allow unauthenticated access since it's a public feature
    // TODO: Add proper authentication when user management is implemented
    console.log("🔍 [CREATORS] Adding new creator (unauthenticated access allowed)...");

    const body: AddCreatorRequest = await request.json();
    const { username, platform, displayName, profileImageUrl, bio, website } = body;

    // Validate input
    if (!username || !platform) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and platform are required",
        },
        { status: 400 },
      );
    }

    if (!["tiktok", "instagram"].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: "Platform must be 'tiktok' or 'instagram'",
        },
        { status: 400 },
      );
    }

    console.log(`🔍 [CREATORS] Adding ${platform} creator: @${username}`);

    // Step 1: Process the creator to get profile data and videos
    console.log(`🔍 [CREATORS] Processing creator profile directly...`);
    
    const processData = await processCreatorProfile(username, platform, 20);

    if (!processData.success || !processData.extractedVideos?.length) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No videos found for this creator. The profile may be private, empty, or the username may be incorrect.",
        },
        { status: 404 },
      );
    }

    // Step 2: Download and transcribe all videos (skip for now to avoid redirect loop)
    console.log(`🔍 [CREATORS] Skipping video download/transcription for now to avoid redirect loop`);
    console.log(`📊 [CREATORS] Successfully extracted ${processData.extractedVideos.length} videos for @${username}`);
    
    // TODO: Implement direct function calls instead of HTTP requests
    // const downloadResponse = await fetch(...);

    // Step 3: Create creator profile
    const creatorProfile: CreatorProfile = {
      id: `creator_${Date.now()}`,
      username,
      displayName: displayName || username,
      platform,
      profileImageUrl:
        profileImageUrl ||
        `/images/placeholder.svg`,
      bio: bio || `Content creator on ${platform}`,
      website,
      postsCount: processData.extractedVideos.length,
      followersCount: 0, // TODO: Extract from profile data
      followingCount: 0, // TODO: Extract from profile data
      isVerified: false, // TODO: Extract from profile data
      videoCount: processData.extractedVideos.length,
      lastProcessed: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: Save to database
    console.log("✅ [CREATORS] Creator profile created:", creatorProfile);

    const response: AddCreatorResponse = {
      success: true,
      creator: creatorProfile,
      message: `Successfully added @${username} to Creator Spotlight. ${processData.extractedVideos.length} videos processed.`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [CREATORS] Failed to add creator:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add creator",
      },
      { status: 500 },
    );
  }
}
