import { NextRequest, NextResponse } from "next/server";

import { CreatorService } from "../../../../lib/creator-service";
import { processCreatorProfile } from "../../../../lib/process-creator-utils";
import { VideoService } from "../../../../lib/video-service";

interface SyncCreatorsRequest {
  creatorIds?: string[]; // Specific creator IDs to sync, or empty for all (deprecated)
  creatorUsernames?: string[]; // Specific creator usernames to sync, or empty for all
  syncVideos?: boolean; // Whether to sync new videos too
  adminKey?: string; // Admin authentication
  dryRun?: boolean; // Test mode - don't actually call APIs
  maxConcurrent?: number; // Maximum concurrent syncs (default: 1)
  delayBetweenCreators?: number; // Custom delay between creators in ms
}

interface SyncCreatorsResponse {
  success: boolean;
  syncedCreators: number;
  errors: Array<{
    creatorId: string;
    username: string;
    error: string;
  }>;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 [ADMIN_SYNC] Starting creator background sync...");

    // Parse request body
    let body: SyncCreatorsRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

    const {
      creatorIds,
      creatorUsernames,
      syncVideos = false,
      adminKey,
      dryRun = false,
      maxConcurrent = 1,
      delayBetweenCreators = 3000, // 3 seconds default
    } = body;

    // Basic admin authentication check
    if (adminKey !== process.env.ADMIN_SYNC_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid admin key",
        },
        { status: 401 },
      );
    }

    console.log(`🔄 [ADMIN_SYNC] Admin authenticated, starting sync...`);

    // Get creators to sync
    let creatorsToSync;
    if (creatorUsernames && creatorUsernames.length > 0) {
      // Sync specific creators by username
      console.log(`🔄 [ADMIN_SYNC] Syncing specific creators by username: ${creatorUsernames.join(", ")}`);
      creatorsToSync = [];
      for (const username of creatorUsernames) {
        // Try to find creator by username on Instagram first, then TikTok
        let creator = await CreatorService.getCreatorByUsernameAndPlatform(username, "instagram");
        if (!creator) {
          creator = await CreatorService.getCreatorByUsernameAndPlatform(username, "tiktok");
        }
        if (creator) {
          creatorsToSync.push(creator);
        } else {
          console.log(`⚠️ [ADMIN_SYNC] Creator @${username} not found on any platform`);
        }
      }
    } else if (creatorIds && creatorIds.length > 0) {
      // Fallback to IDs for backward compatibility
      console.log(`🔄 [ADMIN_SYNC] Syncing specific creators by ID: ${creatorIds.join(", ")}`);
      creatorsToSync = [];
      for (const creatorId of creatorIds) {
        const creator = await CreatorService.getCreatorById(creatorId);
        if (creator) {
          creatorsToSync.push(creator);
        }
      }
    } else {
      // Sync all creators
      console.log(`🔄 [ADMIN_SYNC] Syncing all creators...`);
      creatorsToSync = await CreatorService.getAllCreators();
    }

    console.log(`🔄 [ADMIN_SYNC] Found ${creatorsToSync.length} creators to sync`);
    console.log(
      `⚙️ [ADMIN_SYNC] Settings: dryRun=${dryRun}, maxConcurrent=${maxConcurrent}, delay=${delayBetweenCreators}ms`,
    );

    const syncResults = {
      syncedCreators: 0,
      errors: [] as Array<{ creatorId: string; username: string; error: string }>,
    };

    // Process creators with rate limiting
    for (let i = 0; i < creatorsToSync.length; i++) {
      const creator = creatorsToSync[i];

      try {
        console.log(
          `🔄 [ADMIN_SYNC] Syncing creator @${creator.username} (${creator.id}) [${i + 1}/${creatorsToSync.length}]...`,
        );

        if (dryRun) {
          // Dry run mode - simulate sync without API calls
          console.log(`🧪 [ADMIN_SYNC] DRY RUN: Would sync @${creator.username} (platform: ${creator.platform})`);
          syncResults.syncedCreators++;

          // Simulate a small delay even in dry run
          await new Promise((resolve) => setTimeout(resolve, 100));
          continue;
        }

        // Re-process the creator profile to get latest data
        // Use profile-only mode for syncing to avoid video URL validation failures
        const processResult = await processCreatorProfile(
          creator.username,
          creator.platform,
          syncVideos ? 20 : 0, // If syncVideos is false, don't fetch new videos
          true, // profileOnly = true to skip video URL validation
        );

        if (processResult.success && processResult.profileData) {
          const profileData = processResult.profileData;
          const now = new Date().toISOString();

          // Update creator profile with latest data
          const updates = {
            displayName: profileData.displayName || creator.displayName,
            fullName: profileData.displayName,
            profileImageUrl: profileData.profileImageUrl || creator.profileImageUrl,
            bio: profileData.bio || creator.bio,
            externalUrl: profileData.externalUrl,
            category: profileData.category,
            postsCount: profileData.postsCount || creator.postsCount,
            followersCount: profileData.followersCount || creator.followersCount,
            followingCount: profileData.followingCount || creator.followingCount,
            isVerified: profileData.isVerified !== undefined ? profileData.isVerified : creator.isVerified,
            isPrivate: profileData.isPrivate !== undefined ? profileData.isPrivate : creator.isPrivate,
            lastSynced: now,
          };

          await CreatorService.updateCreator(creator.id!, updates);

          // If syncing videos, add new ones
          if (syncVideos && processResult.extractedVideos.length > 0) {
            console.log(
              `📹 [ADMIN_SYNC] Adding ${processResult.extractedVideos.length} new videos for @${creator.username}...`,
            );

            const videoDocuments = processResult.extractedVideos.map((video) => ({
              platform: video.platform,
              video_url: video.video_url,
              thumbnail_url: video.thumbnail_url,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              quality: video.quality,
              title: video.title,
              description: video.description,
              author: video.author,
              duration: video.duration,
              downloadStatus: video.downloadStatus,
              transcriptionStatus: video.transcriptionStatus,
            }));

            await VideoService.createVideosForCreator(creator.id!, videoDocuments);

            // Update video count
            const newVideoCount = await VideoService.getVideoCountByCreatorId(creator.id!);
            await CreatorService.updateVideoCount(creator.id!, newVideoCount);
          }

          syncResults.syncedCreators++;
          console.log(`✅ [ADMIN_SYNC] Successfully synced @${creator.username}`);
        } else {
          const error = processResult.error || "Failed to fetch profile data";
          syncResults.errors.push({
            creatorId: creator.id!,
            username: creator.username,
            error,
          });
          console.log(`❌ [ADMIN_SYNC] Failed to sync @${creator.username}: ${error}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        syncResults.errors.push({
          creatorId: creator.id!,
          username: creator.username,
          error: errorMessage,
        });
        console.error(`❌ [ADMIN_SYNC] Error syncing @${creator.username}:`, error);
      }

      // Add configurable delay between requests to avoid rate limiting
      if (i < creatorsToSync.length - 1) {
        // Don't wait after the last creator
        console.log(`⏳ [ADMIN_SYNC] Waiting ${delayBetweenCreators}ms before next creator...`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenCreators));
      }
    }

    const response: SyncCreatorsResponse = {
      success: true,
      syncedCreators: syncResults.syncedCreators,
      errors: syncResults.errors,
      message: `Successfully synced ${syncResults.syncedCreators} creators with ${syncResults.errors.length} errors`,
    };

    console.log(`✅ [ADMIN_SYNC] Sync complete: ${JSON.stringify(response)}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("🔥 [ADMIN_SYNC] Failed to sync creators:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync creators",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Use POST method to sync creators",
      usage: {
        method: "POST",
        body: {
          creatorUsernames: "Array<string> (optional) - specific creator usernames to sync",
          creatorIds: "Array<string> (optional) - specific creator IDs to sync (deprecated)",
          syncVideos: "boolean (optional) - whether to fetch new videos",
          adminKey: "string (required) - admin authentication key",
        },
        examples: {
          "Sync all creators (profile data only)": {
            adminKey: "your-admin-key",
          },
          "Sync specific creators with videos": {
            creatorUsernames: ["john_doe", "jane_smith"],
            syncVideos: true,
            adminKey: "your-admin-key",
          },
        },
      },
    },
    { status: 405 },
  );
}
