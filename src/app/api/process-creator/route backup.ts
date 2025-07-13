import { NextRequest, NextResponse } from "next/server";
import { processCreatorProfile, ProcessCreatorRequest, ProcessCreatorResponse, VideoData } from "@/lib/process-creator-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 [PROCESS_CREATOR] Starting profile processing...");

    const body: ProcessCreatorRequest = await request.json();
    const { username, platform, videoCount } = body;

    // Validate input
    if (!username || !platform || !videoCount) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Username, platform, and video count are required" 
        },
        { status: 400 }
      );
    }

    if (!["tiktok", "instagram"].includes(platform)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Platform must be 'tiktok' or 'instagram'" 
        },
        { status: 400 }
      );
    }

    if (videoCount < 1 || videoCount > 200) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Video count must be between 1 and 200" 
        },
        { status: 400 }
      );
    }

    console.log(`🔍 [PROCESS_CREATOR] Processing ${platform} profile: @${username}`);

    // Use the shared utility function
    const result = await processCreatorProfile(username, platform, videoCount);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to process profile"
        },
        { status: 404 }
      );
    }

    console.log(`✅ [PROCESS_CREATOR] Successfully extracted ${result.extractedVideos.length} videos`);

    const response: ProcessCreatorResponse = {
      success: true,
      extractedVideos: result.extractedVideos,
      totalFound: result.totalFound,
      message: `Successfully extracted ${result.extractedVideos.length} videos from @${username}'s ${platform} profile. Use /api/process-creator/download-all to download and transcribe these videos.`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("🔥 [PROCESS_CREATOR] Failed to process profile:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process profile"
      },
      { status: 500 }
    );
  }
}

async function processTikTokProfile(username: string, videoCount: number): Promise<VideoData[]> {
  console.log(`🎵 [TIKTOK] Processing profile: @${username}`);
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [TIKTOK] Attempt ${attempt}/${maxRetries} for @${username}`);

      // Check if RapidAPI key is available
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        throw new Error("RapidAPI key not configured. Please set RAPIDAPI_KEY environment variable.");
      }

      // Fetch user feed from TikTok scraper API
      const response = await fetch(
        `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/${username}/feed`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com"
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`TikTok API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.videos || !Array.isArray(data.videos)) {
        throw new Error("No videos found in TikTok API response. The profile may be private or the username may be incorrect.");
      }

      if (data.videos.length === 0) {
        throw new Error(`No videos found for @${username}. The profile may be empty or private.`);
      }

      // Process up to 2x the requested count to get best performers
      const maxVideos = Math.min(data.videos.length, videoCount * 2);
      const processedVideos: VideoData[] = [];

      for (let i = 0; i < maxVideos; i++) {
        const video = data.videos[i];
        
        try {
          // Extract video data with proper validation
          const videoUrl = video.video_url || video.download_url || video.url;
          if (!videoUrl || !isValidVideoUrl(videoUrl)) {
            console.warn(`⚠️ [TIKTOK] Invalid video URL for video ${i}, skipping`);
            continue;
          }

          const videoData: VideoData = {
            id: video.id || `tiktok_${username}_${i}_${Date.now()}`,
            platform: "tiktok",
            video_url: videoUrl,
            thumbnail_url: video.thumbnail_url || video.cover,
            viewCount: parseInt(video.view_count || video.views || "0"),
            likeCount: parseInt(video.like_count || video.likes || "0"),
            quality: video.quality || "720p",
            title: video.title || video.description || `TikTok Video ${i + 1}`,
            description: video.description || "",
            author: video.author || username,
            duration: parseInt(video.duration || "30")
          };

          processedVideos.push(videoData);
        } catch (error) {
          console.warn(`⚠️ [TIKTOK] Failed to process video ${i}:`, error);
        }
      }

      if (processedVideos.length === 0) {
        throw new Error(`No valid videos could be extracted from @${username}'s TikTok profile. All video URLs were invalid or inaccessible.`);
      }

      console.log(`✅ [TIKTOK] Successfully processed ${processedVideos.length} videos for @${username}`);
      return processedVideos;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [TIKTOK] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`⏳ [TIKTOK] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to process TikTok profile @${username} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

async function processInstagramProfile(username: string, videoCount: number): Promise<VideoData[]> {
  console.log(`📸 [INSTAGRAM] Processing profile: @${username}`);
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [INSTAGRAM] Attempt ${attempt}/${maxRetries} for @${username}`);

      // Check if RapidAPI key is available
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        throw new Error("RapidAPI key not configured. Please set RAPIDAPI_KEY environment variable.");
      }

      // Step 1: Get user ID by username
      const userIdResponse = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/user_id_by_username?username=${username}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
          }
        }
      );

      if (!userIdResponse.ok) {
        const errorText = await userIdResponse.text();
        throw new Error(`Instagram user ID lookup failed with status ${userIdResponse.status}: ${errorText}`);
      }

      const userIdData = await userIdResponse.json();
      const userId = userIdData.user_id;

      if (!userId) {
        throw new Error(`No user ID found for @${username}. The username may be incorrect or the profile may not exist.`);
      }

      // Step 2: Get posts by user ID
      const postsResponse = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/posts_by_user_id?user_id=${userId}&count=${videoCount * 2}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "instagram-scraper-api2.p.rapidapi.com"
          }
        }
      );

      if (!postsResponse.ok) {
        const errorText = await postsResponse.text();
        throw new Error(`Instagram posts lookup failed with status ${postsResponse.status}: ${errorText}`);
      }

      const postsData = await postsResponse.json();
      
      if (!postsData.posts || !Array.isArray(postsData.posts)) {
        throw new Error("No posts found in Instagram API response. The profile may be private or empty.");
      }

      // Filter for video content only (media_type === 2)
      const videoContent = postsData.posts.filter((post: any) => post.media_type === 2);
      
      if (videoContent.length === 0) {
        throw new Error(`No video content found for @${username}. The profile may only contain photos or may be private.`);
      }

      const processedVideos: VideoData[] = [];

      for (let i = 0; i < Math.min(videoContent.length, videoCount * 2); i++) {
        const post = videoContent[i];
        
        try {
          // Extract video data with proper validation
          const videoUrl = post.video_url || post.download_url;
          if (!videoUrl || !isValidVideoUrl(videoUrl)) {
            console.warn(`⚠️ [INSTAGRAM] Invalid video URL for video ${i}, skipping`);
            continue;
          }

          const videoData: VideoData = {
            id: post.id || `instagram_${username}_${i}_${Date.now()}`,
            platform: "instagram",
            video_url: videoUrl,
            thumbnail_url: post.thumbnail_url || post.display_url,
            viewCount: parseInt(post.view_count || post.video_view_count || "0"),
            likeCount: parseInt(post.like_count || "0"),
            quality: "720p",
            title: post.caption ? post.caption.substring(0, 100) : `Instagram Video ${i + 1}`,
            description: post.caption || "",
            author: post.owner?.username || username,
            duration: parseInt(post.video_duration || "30")
          };

          processedVideos.push(videoData);
        } catch (error) {
          console.warn(`⚠️ [INSTAGRAM] Failed to process video ${i}:`, error);
        }
      }

      if (processedVideos.length === 0) {
        throw new Error(`No valid videos could be extracted from @${username}'s Instagram profile. All video URLs were invalid or inaccessible.`);
      }

      console.log(`✅ [INSTAGRAM] Successfully processed ${processedVideos.length} videos for @${username}`);
      return processedVideos;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [INSTAGRAM] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delayMs = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
        console.log(`⏳ [INSTAGRAM] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(`Failed to process Instagram profile @${username} after ${maxRetries} attempts. Last error: ${lastError?.message}`);
}

function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
} 