import { NextRequest, NextResponse } from "next/server";

import { CreatorMediaService } from "../../../lib/creator-media-service";
import { CreatorService, CreatorProfile } from "../../../lib/creator-service";
import { processCreatorProfile } from "../../../lib/process-creator-utils";
import { VideoService } from "../../../lib/video-service";

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

    const creators = await CreatorService.getAllCreators();
    console.log(`📊 [CREATORS] Returning ${creators.length} creators from Firestore`);

    return NextResponse.json({
      success: true,
      creators,
      total: creators.length,
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

    // Validate request has content
    const contentLength = request.headers.get("content-length");
    if (!contentLength || contentLength === "0") {
      return NextResponse.json(
        {
          success: false,
          error: "Empty request body. Please provide username and platform.",
        },
        { status: 400 },
      );
    }

    let body: AddCreatorRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }
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

    // Check if creator already exists
    const existingCreator = await CreatorService.getCreatorByUsernameAndPlatform(username, platform);

    if (existingCreator) {
      return NextResponse.json(
        {
          success: false,
          error: `Creator @${username} already exists in Creator Spotlight.`,
        },
        { status: 409 },
      );
    }

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

    // Step 3: Create creator profile (without embedded videos)
    const profileData = processData.profileData;
    const now = new Date().toISOString();

    const creatorData = {
      username,
      displayName: displayName || profileData?.displayName || username,
      fullName: profileData?.displayName || undefined,
      platform,
      profileImageUrl: profileImageUrl || profileData?.profileImageUrl || `/images/placeholder.svg`,
      bio: bio || profileData?.bio || `Content creator on ${platform}`,
      website: website || profileData?.externalUrl || undefined,
      externalUrl: profileData?.externalUrl || undefined,
      category: profileData?.category || undefined,
      postsCount: profileData?.postsCount || processData.extractedVideos.length,
      followersCount: profileData?.followersCount || 0,
      followingCount: profileData?.followingCount || 0,
      isVerified: profileData?.isVerified || false,
      isPrivate: profileData?.isPrivate || false,
      videoCount: processData.extractedVideos.length,
      lastProcessed: now,
      lastSynced: now,
    };

    console.log(`📸 [CREATORS] Using profile data from API:`, profileData);

    // Save creator profile to Firestore
    const creatorProfile = await CreatorService.createCreator(creatorData);
    console.log("✅ [CREATORS] Creator profile saved to Firestore:", creatorProfile);
    console.log(`📊 [CREATORS] Creator ID: ${creatorProfile.id}`);

    // Step 3.5: Upload profile image to Bunny.net immediately
    if (creatorProfile.id && creatorData.profileImageUrl && !creatorData.profileImageUrl.startsWith("/")) {
      console.log("📸 [CREATORS] Uploading profile image to Bunny.net...");
      try {
        // We'll upload just the profile image, not all media
        const profileImageResult = await CreatorMediaService.uploadImageToBunny(
          creatorData.profileImageUrl,
          `${creatorData.username}_profile_${creatorData.platform}_${Date.now()}.jpg`,
        );

        if (profileImageResult) {
          // Update the creator with the Bunny URL
          await CreatorService.updateCreator(creatorProfile.id, {
            bunnyProfileImageUrl: profileImageResult.thumbnailUrl,
            profileImageUrl: profileImageResult.thumbnailUrl, // Update main profile image to use Bunny URL
            bunnyMediaUrls: {
              profileImage: {
                originalUrl: creatorData.profileImageUrl,
                bunnyIframeUrl: profileImageResult.bunnyIframeUrl,
                thumbnailUrl: profileImageResult.thumbnailUrl,
                videoId: profileImageResult.videoId,
              },
              videoThumbnails: [],
              lowQualityVideos: [],
            },
            bunnyUploadedAt: new Date().toISOString(),
          });
          console.log("✅ [CREATORS] Profile image uploaded to Bunny.net:", profileImageResult.thumbnailUrl);
        }
      } catch (error) {
        console.error("⚠️ [CREATORS] Failed to upload profile image to Bunny, continuing without it:", error);
        // Don't fail the entire request if profile image upload fails
      }
    }

    // Step 4: Store videos separately in the videos collection
    if (processData.extractedVideos.length > 0 && creatorProfile.id) {
      console.log(`📹 [CREATORS] Storing ${processData.extractedVideos.length} videos separately...`);

      // Upload thumbnails for the first 10 videos to Bunny.net
      const videosToUploadThumbnails = processData.extractedVideos
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10);

      const thumbnailUploads = await Promise.all(
        videosToUploadThumbnails.map(async (video, index) => {
          if (video.thumbnail_url) {
            try {
              console.log(`📸 [CREATORS] Uploading thumbnail ${index + 1}/10...`);
              const thumbnailResult = await CreatorMediaService.uploadImageToBunny(
                video.thumbnail_url,
                `${creatorData.username}_thumb_${Date.now()}_${index}.jpg`,
              );
              return { video, thumbnailResult };
            } catch (error) {
              console.error(`⚠️ [CREATORS] Failed to upload thumbnail ${index + 1}:`, error);
              return { video, thumbnailResult: null };
            }
          }
          return { video, thumbnailResult: null };
        }),
      );

      // Create video documents with Bunny URLs where available
      const videoDocuments = processData.extractedVideos.map((video) => {
        const uploadResult = thumbnailUploads.find((u) => u.video === video);
        const bunnyThumbnailUrl = uploadResult?.thumbnailResult?.thumbnailUrl;

        return {
          platform: video.platform,
          video_url: video.video_url,
          thumbnail_url: bunnyThumbnailUrl || video.thumbnail_url,
          original_thumbnail_url: video.thumbnail_url,
          bunny_thumbnail_url: bunnyThumbnailUrl,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          quality: video.quality,
          title: video.title,
          description: video.description,
          author: video.author,
          duration: video.duration,
          downloadStatus: video.downloadStatus,
          transcriptionStatus: video.transcriptionStatus,
        };
      });

      const savedVideos = await VideoService.createVideosForCreator(creatorProfile.id, videoDocuments);
      console.log(`✅ [CREATORS] Saved ${savedVideos.length} videos to separate collection`);

      // Update creator's bunnyMediaUrls with video thumbnails if we uploaded any
      const uploadedThumbnails = thumbnailUploads
        .filter((u) => u.thumbnailResult)
        .map((u, index) => ({
          videoId: `temp_${index}`, // We don't have video IDs yet
          originalUrl: u.video.thumbnail_url,
          bunnyIframeUrl: u.thumbnailResult!.bunnyIframeUrl,
          thumbnailUrl: u.thumbnailResult!.thumbnailUrl,
        }));

      if (uploadedThumbnails.length > 0) {
        // Get current bunnyMediaUrls
        const currentCreator = await CreatorService.getCreatorById(creatorProfile.id);
        const currentBunnyUrls = (currentCreator as any)?.bunnyMediaUrls || {
          videoThumbnails: [],
          lowQualityVideos: [],
        };

        await CreatorService.updateCreator(creatorProfile.id, {
          bunnyMediaUrls: {
            ...currentBunnyUrls,
            videoThumbnails: uploadedThumbnails,
          },
        });
        console.log(`✅ [CREATORS] Updated creator with ${uploadedThumbnails.length} video thumbnails`);
      }
    }

    const response: AddCreatorResponse = {
      success: true,
      creator: creatorProfile,
      message: `Successfully added @${username} to Creator Spotlight. ${processData.extractedVideos.length} videos processed and stored separately.`,
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
