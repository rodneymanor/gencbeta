

export interface VideoData {
  id: string;
  platform: "tiktok" | "instagram";
  video_url: string;
  thumbnail_url?: string;
  viewCount: number;
  likeCount: number;
  quality: string;
  title?: string;
  description?: string;
  author?: string;
  duration?: number;
  // Add fields for processing status
  downloadStatus?: "pending" | "downloading" | "completed" | "failed";
  transcriptionStatus?: "pending" | "transcribing" | "completed" | "failed";
  downloadUrl?: string; // CDN URL after download
  transcriptionId?: string; // ID of transcription result
}

export interface ProcessCreatorRequest {
  username: string;
  platform: "tiktok" | "instagram";
  videoCount: number;
}

export interface ProcessCreatorResponse {
  success: boolean;
  extractedVideos: VideoData[];
  totalFound: number;
  message: string;
  error?: string;
}

export async function processCreatorProfile(
  username: string,
  platform: "tiktok" | "instagram",
  videoCount: number
): Promise<ProcessCreatorResponse> {
  try {
    console.log(`🔍 [PROCESS_CREATOR_UTILS] Processing ${platform} profile: @${username}`);

    let extractedVideos: VideoData[] = [];

    if (platform === "tiktok") {
      extractedVideos = await processTikTokProfile(username, videoCount);
    } else {
      extractedVideos = await processInstagramProfile(username, videoCount);
    }

    if (extractedVideos.length === 0) {
      return {
        success: false,
        extractedVideos: [],
        totalFound: 0,
        message: "No videos found",
        error: "No videos found for this profile. The profile may be private, empty, or the username may be incorrect."
      };
    }

    // Sort by engagement (views + likes) and take the top performers
    const sortedVideos = extractedVideos
      .sort((a, b) => (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount))
      .slice(0, videoCount)
      .map(video => ({
        ...video,
        downloadStatus: "pending" as const,
        transcriptionStatus: "pending" as const
      }));

    console.log(`✅ [PROCESS_CREATOR_UTILS] Successfully extracted ${sortedVideos.length} videos`);

    return {
      success: true,
      extractedVideos: sortedVideos,
      totalFound: extractedVideos.length,
      message: `Successfully extracted ${sortedVideos.length} videos from @${username}'s ${platform} profile.`
    };

  } catch (error) {
    console.error("🔥 [PROCESS_CREATOR_UTILS] Failed to process profile:", error);
    
    return {
      success: false,
      extractedVideos: [],
      totalFound: 0,
      message: "Processing failed",
      error: error instanceof Error ? error.message : "Failed to process profile"
    };
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
      const tiktokApiUrl = `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/${username}/feed`;
      console.log(`🌐 [TIKTOK] Making API call to: ${tiktokApiUrl}`);
      
      const response = await fetch(tiktokApiUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com"
        }
      });

      console.log(`📡 [TIKTOK] API Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [TIKTOK] API Error Response:`, errorText);
        throw new Error(`TikTok API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 [TIKTOK] API Response Data:`, JSON.stringify(data, null, 2));
      
      if (!data.videos || !Array.isArray(data.videos)) {
        console.error(`❌ [TIKTOK] No videos array found in response. Response structure:`, Object.keys(data));
        throw new Error("No videos found in TikTok API response. The profile may be private or the username may be incorrect.");
      }

      console.log(`📊 [TIKTOK] Found ${data.videos.length} videos in response`);
      
      if (data.videos.length === 0) {
        throw new Error(`No videos found for @${username}. The profile may be empty or private.`);
      }

      // Process up to 2x the requested count to get best performers
      const maxVideos = Math.min(data.videos.length, videoCount * 2);
      console.log(`🔄 [TIKTOK] Processing ${maxVideos} videos out of ${data.videos.length} total`);
      const processedVideos: VideoData[] = [];

      for (let i = 0; i < maxVideos; i++) {
        const video = data.videos[i];
        console.log(`🔍 [TIKTOK] Processing video ${i + 1}/${maxVideos}:`, {
          id: video.id,
          title: video.title,
          video_url: video.video_url,
          view_count: video.view_count,
          like_count: video.like_count
        });
        
        const videoData = extractTikTokVideoData(video, username, i);
        if (videoData) {
          processedVideos.push(videoData);
          console.log(`✅ [TIKTOK] Successfully extracted video ${i + 1}`);
        } else {
          console.log(`⚠️ [TIKTOK] Failed to extract video ${i + 1}`);
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
      const userIdApiUrl = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/user_id_by_username?username=${username}`;
      console.log(`🌐 [INSTAGRAM] Making User ID API call to: ${userIdApiUrl}`);
      
      const userIdResponse = await fetch(userIdApiUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com"
        }
      });

      console.log(`📡 [INSTAGRAM] User ID API Response Status: ${userIdResponse.status} ${userIdResponse.statusText}`);

      if (!userIdResponse.ok) {
        const errorText = await userIdResponse.text();
        console.error(`❌ [INSTAGRAM] User ID API Error Response:`, errorText);
        throw new Error(`Instagram user ID lookup failed with status ${userIdResponse.status}: ${errorText}`);
      }

      const userIdData = await userIdResponse.json();
      console.log(`📊 [INSTAGRAM] User ID API Response Data:`, JSON.stringify(userIdData, null, 2));
      
      const userId = userIdData.UserID;

      if (!userId) {
        throw new Error(`No user ID found for @${username}. The username may be incorrect or the profile may not exist.`);
      }

      // Step 2: Get reels by user ID
      const reelsApiUrl = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
      console.log(`🌐 [INSTAGRAM] Making Reels API call to: ${reelsApiUrl}`);
      
      const reelsResponse = await fetch(reelsApiUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidApiKey,
          "X-RapidAPI-Host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com"
        }
      });

      console.log(`📡 [INSTAGRAM] Reels API Response Status: ${reelsResponse.status} ${reelsResponse.statusText}`);

      if (!reelsResponse.ok) {
        const errorText = await reelsResponse.text();
        console.error(`❌ [INSTAGRAM] Reels API Error Response:`, errorText);
        throw new Error(`Instagram reels fetch failed with status ${reelsResponse.status}: ${errorText}`);
      }

      const reelsData = await reelsResponse.json();
      console.log(`📊 [INSTAGRAM] Reels API Response Data:`, JSON.stringify(reelsData, null, 2));
      
      // Handle the new Instagram API response structure
      if (!reelsData.data || !reelsData.data.items || !Array.isArray(reelsData.data.items)) {
        console.error(`❌ [INSTAGRAM] No items array found in response. Response structure:`, Object.keys(reelsData));
        throw new Error("No reels found in Instagram API response. The profile may be private or the username may be incorrect.");
      }

      // Filter for video/reel items only
      const videoItems = reelsData.data.items.filter((item: any) => 
        item.media && item.media.media_type === 2 // 2 = video/reel
      );

      console.log(`📊 [INSTAGRAM] Found ${videoItems.length} video items out of ${reelsData.data.items.length} total items`);
      
      if (videoItems.length === 0) {
        throw new Error(`No video reels found for @${username}. The profile may be empty or private.`);
      }

      // Process up to 2x the requested count to get best performers
      const maxReels = Math.min(videoItems.length, videoCount * 2);
      console.log(`🔄 [INSTAGRAM] Processing ${maxReels} reels out of ${videoItems.length} total`);
      const processedVideos: VideoData[] = [];

      for (let i = 0; i < maxReels; i++) {
        const item = videoItems[i];
        const reel = item.media; // The actual reel data is in the media object
        console.log(`🔍 [INSTAGRAM] Processing reel ${i + 1}/${maxReels}:`, {
          id: reel.pk,
          title: reel.caption?.text,
          video_url: reel.video_versions?.[0]?.url,
          view_count: reel.play_count,
          like_count: reel.like_count
        });
        
        const videoData = extractInstagramReelData(reel, username, i);
        if (videoData) {
          processedVideos.push(videoData);
          console.log(`✅ [INSTAGRAM] Successfully extracted reel ${i + 1}`);
        } else {
          console.log(`⚠️ [INSTAGRAM] Failed to extract reel ${i + 1}`);
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

// Helper function for extracting TikTok video data
function extractTikTokVideoData(video: any, username: string, i: number): VideoData | null {
  const videoUrl = video.video_url ?? video.download_url ?? video.url;
  if (!videoUrl || !isValidVideoUrl(videoUrl)) {
    console.warn(`⚠️ [TIKTOK] Invalid video URL for video ${i}, skipping`);
    return null;
  }
  return {
    id: video.id ?? `tiktok_${username}_${i}_${Date.now()}`,
    platform: 'tiktok',
    video_url: videoUrl,
    thumbnail_url: video.thumbnail_url ?? video.cover,
    viewCount: parseInt(video.view_count ?? video.views ?? '0'),
    likeCount: parseInt(video.like_count ?? video.likes ?? '0'),
    quality: video.quality ?? '720p',
    title: video.title ?? video.description ?? `TikTok Video ${i + 1}`,
    description: video.description ?? '',
    author: video.author ?? username,
    duration: parseInt(video.duration ?? '30'),
  };
}

// Helper function for extracting Instagram reel data
function extractInstagramReelData(reel: any, username: string, i: number): VideoData | null {
  // Handle the new Instagram API structure where video data is nested
  const videoVersions = reel.video_versions;
  if (!videoVersions || !Array.isArray(videoVersions) || videoVersions.length === 0) {
    console.warn(`⚠️ [INSTAGRAM] No video versions found for reel ${i}, skipping`);
    return null;
  }

  // Get the highest quality video URL (usually the first one)
  const videoUrl = videoVersions[0].url;
  if (!videoUrl || !isValidVideoUrl(videoUrl)) {
    console.warn(`⚠️ [INSTAGRAM] Invalid video URL for reel ${i}, skipping`);
    return null;
  }

  // Get thumbnail from image_versions2
  const imageVersions = reel.image_versions2?.candidates;
  const thumbnailUrl = imageVersions && imageVersions.length > 0 ? imageVersions[0].url : undefined;

  // Extract caption text
  const caption = reel.caption?.text ?? '';

  return {
    id: reel.pk ?? reel.id ?? `instagram_${username}_${i}_${Date.now()}`,
    platform: 'instagram',
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
    viewCount: parseInt(reel.play_count ?? reel.view_count ?? '0'),
    likeCount: parseInt(reel.like_count ?? '0'),
    quality: videoVersions[0].width + 'x' + videoVersions[0].height,
    title: caption || `Instagram Reel ${i + 1}`,
    description: caption,
    author: username,
    duration: parseInt(reel.video_duration ?? '30'),
  };
}

function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
} 