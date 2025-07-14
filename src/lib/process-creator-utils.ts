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
  profileData?: {
    profileImageUrl?: string;
    displayName?: string;
    bio?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    isVerified?: boolean;
    isPrivate?: boolean;
    externalUrl?: string;
    category?: string;
  };
}

// Enhanced global rate limiting for RapidAPI calls with intelligent backoff
let lastRapidApiCall = 0; // Single rate limiter for all RapidAPI calls
let consecutiveFailures = 0; // Track failures for dynamic rate limiting
let last429Time = 0; // Track when we last got rate limited
let apiHealthStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

// Dynamic rate limiting based on API health
const BASE_RATE_LIMIT_MS = 2000; // Start with 2 seconds (more conservative)
const MAX_RATE_LIMIT_MS = 30000; // Max 30 seconds between calls when unhealthy
const MAX_QUEUE_SIZE = 5; // Reduce queue size to prevent overwhelming API
const FAILURE_THRESHOLD = 3; // After 3 failures, increase delays
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Calculate dynamic rate limit based on API health and recent failures
function getDynamicRateLimit(): number {
  const timeSince429 = Date.now() - last429Time;
  const recent429 = timeSince429 < 10 * 60 * 1000; // Within last 10 minutes
  
  // Base multiplier based on consecutive failures
  let multiplier = 1 + (consecutiveFailures * 0.5);
  
  // Health-based adjustment
  switch (apiHealthStatus) {
    case 'unhealthy':
      multiplier *= 4; // 4x slower when unhealthy
      break;
    case 'degraded':
      multiplier *= 2; // 2x slower when degraded
      break;
    case 'healthy':
      multiplier *= 1; // Normal speed
      break;
  }
  
  // Recent 429 penalty
  if (recent429) {
    multiplier *= 3; // 3x slower if we got rate limited recently
  }
  
  const dynamicLimit = Math.min(BASE_RATE_LIMIT_MS * multiplier, MAX_RATE_LIMIT_MS);
  console.log(`📊 [RATE_LIMIT] Dynamic rate limit: ${dynamicLimit}ms (health: ${apiHealthStatus}, failures: ${consecutiveFailures}, recent429: ${recent429})`);
  
  return dynamicLimit;
}

// Request queue to handle multiple concurrent requests
interface QueuedRequest {
  id: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;

// Profile cache to prevent duplicate processing
interface CachedProfile {
  data: ProcessCreatorResponse;
  timestamp: number;
}
const profileCache = new Map<string, CachedProfile>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

// Simple circuit breaker to prevent continuous API failures
interface CircuitBreaker {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}
const circuitBreakers = new Map<string, CircuitBreaker>();
const CIRCUIT_BREAKER_THRESHOLD = 5; // Open circuit after 5 consecutive failures
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes timeout

// Helper function to check circuit breaker
function isCircuitOpen(platform: string): boolean {
  const breaker = circuitBreakers.get(platform);
  if (!breaker) return false;

  // Auto-close circuit after timeout
  if (breaker.isOpen && Date.now() - breaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
    breaker.isOpen = false;
    breaker.failures = 0;
    console.log(`🔄 [CIRCUIT_BREAKER] Auto-closed circuit for ${platform}`);
  }

  return breaker.isOpen;
}

// Enhanced API health monitoring
function updateApiHealth(success: boolean, isRateLimit: boolean = false): void {
  if (success) {
    consecutiveFailures = Math.max(0, consecutiveFailures - 1);
    
    // Gradually improve health status on success
    if (apiHealthStatus === 'unhealthy' && consecutiveFailures === 0) {
      apiHealthStatus = 'degraded';
      console.log(`🟡 [API_HEALTH] Status improved to: degraded`);
    } else if (apiHealthStatus === 'degraded' && consecutiveFailures === 0) {
      apiHealthStatus = 'healthy';
      console.log(`🟢 [API_HEALTH] Status improved to: healthy`);
    }
  } else {
    consecutiveFailures++;
    
    if (isRateLimit) {
      last429Time = Date.now();
      apiHealthStatus = 'unhealthy';
      console.log(`🔴 [API_HEALTH] Rate limited! Status set to: unhealthy`);
    } else if (consecutiveFailures >= FAILURE_THRESHOLD) {
      if (apiHealthStatus === 'healthy') {
        apiHealthStatus = 'degraded';
        console.log(`🟡 [API_HEALTH] ${consecutiveFailures} failures, status degraded`);
      } else if (consecutiveFailures >= FAILURE_THRESHOLD * 2) {
        apiHealthStatus = 'unhealthy';
        console.log(`🔴 [API_HEALTH] ${consecutiveFailures} failures, status unhealthy`);
      }
    }
  }
  
  console.log(`📊 [API_HEALTH] Current status: ${apiHealthStatus}, consecutive failures: ${consecutiveFailures}`);
}

// Helper function to record API failure
function recordFailure(platform: string, isRateLimit: boolean = false): void {
  const breaker = circuitBreakers.get(platform) || { failures: 0, lastFailureTime: 0, isOpen: false };
  breaker.failures++;
  breaker.lastFailureTime = Date.now();

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.isOpen = true;
    console.log(`🚫 [CIRCUIT_BREAKER] Opened circuit for ${platform} after ${breaker.failures} failures`);
  }

  circuitBreakers.set(platform, breaker);
  updateApiHealth(false, isRateLimit);
}

// Helper function to record API success
function recordSuccess(platform: string): void {
  const breaker = circuitBreakers.get(platform);
  if (breaker) {
    breaker.failures = 0;
    breaker.isOpen = false;
    circuitBreakers.set(platform, breaker);
  }
  updateApiHealth(true);
}

// Helper function to check if cache is valid
function getCachedProfile(username: string, platform: string): ProcessCreatorResponse | null {
  const cacheKey = `${platform}:${username}`;
  const cached = profileCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log(`✨ [CACHE] Using cached data for @${username} on ${platform}`);
    return cached.data;
  }

  // Remove expired cache entry
  if (cached) {
    profileCache.delete(cacheKey);
  }

  return null;
}

// Helper function to cache profile data
function setCachedProfile(username: string, platform: string, data: ProcessCreatorResponse): void {
  const cacheKey = `${platform}:${username}`;
  profileCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  console.log(`💾 [CACHE] Cached profile data for @${username} on ${platform}`);
}

// Request queue processor
async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (!request) break;

    try {
      // Enforce dynamic global rate limit
      const now = Date.now();
      const dynamicRateLimit = getDynamicRateLimit();
      const timeSinceLastCall = now - lastRapidApiCall;
      
      if (timeSinceLastCall < dynamicRateLimit) {
        const waitTime = dynamicRateLimit - timeSinceLastCall;
        console.log(`⏳ [QUEUE] Waiting ${waitTime}ms before next RapidAPI call... (dynamic rate limit, queue: ${requestQueue.length + 1})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      console.log(`🔄 [QUEUE] Processing request ${request.id} (queue: ${requestQueue.length})`);
      const startTime = Date.now();
      const result = await request.execute();
      const endTime = Date.now();
      lastRapidApiCall = endTime;
      console.log(`✅ [QUEUE] Request ${request.id} completed in ${endTime - startTime}ms`);
      request.resolve(result);
    } catch (error) {
      console.error(`❌ [QUEUE] Request ${request.id} failed:`, error);
      request.reject(error);
    }
  }

  isProcessingQueue = false;
}

// Helper function to queue RapidAPI calls with global rate limiting
function queueRapidApiCall<T>(id: string, apiCall: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check queue size limit
    if (requestQueue.length >= MAX_QUEUE_SIZE) {
      reject(new Error(`Request queue is full (${MAX_QUEUE_SIZE} requests). Please try again later.`));
      return;
    }

    const queuedRequest: QueuedRequest = {
      id,
      execute: apiCall,
      resolve,
      reject,
    };

    requestQueue.push(queuedRequest);
    console.log(`📋 [QUEUE] Added request ${id} to queue (size: ${requestQueue.length})`);

    // Start processing queue if not already running
    console.log(`🚀 [QUEUE] Starting queue processor (isProcessing: ${isProcessingQueue})`);
    processQueue().catch((error) => {
      console.error(`🔥 [QUEUE] Queue processing error:`, error);
    });
  });
}

export async function processCreatorProfile(
  username: string,
  platform: "tiktok" | "instagram",
  videoCount: number,
  profileOnly: boolean = false,
): Promise<ProcessCreatorResponse> {
  try {
    console.log(`🔍 [PROCESS_CREATOR_UTILS] Processing ${platform} profile: @${username}`);

    // Check cache first
    const cachedResult = getCachedProfile(username, platform);
    if (cachedResult) {
      return cachedResult;
    }

    let processResult: { videos: VideoData[], profileData?: ProcessCreatorResponse["profileData"] };

    if (platform === "tiktok") {
      processResult = await processTikTokProfile(username, videoCount, profileOnly);
    } else {
      processResult = await processInstagramProfile(username, videoCount, profileOnly);
    }

    const extractedVideos = processResult.videos;
    const profileData = processResult.profileData;

    // In profile-only mode, allow success even with no videos if we have profile data
    if (extractedVideos.length === 0 && !profileOnly) {
      return {
        success: false,
        extractedVideos: [],
        totalFound: 0,
        message: "No videos found",
        error: "No videos found for this profile. The profile may be private, empty, or the username may be incorrect.",
      };
    }

    // In profile-only mode, success depends on having profile data, not videos
    if (profileOnly && !profileData) {
      return {
        success: false,
        extractedVideos: [],
        totalFound: 0,
        message: "No profile data found",
        error: "Could not extract profile information. The profile may be private or the username may be incorrect.",
      };
    }

    // Sort by engagement (views + likes) and take the top performers
    const sortedVideos = extractedVideos
      .sort((a, b) => b.viewCount + b.likeCount - (a.viewCount + a.likeCount))
      .slice(0, videoCount)
      .map((video) => ({
        ...video,
        downloadStatus: "pending" as const,
        transcriptionStatus: "pending" as const,
      }));

    console.log(`✅ [PROCESS_CREATOR_UTILS] Successfully extracted ${sortedVideos.length} videos${profileOnly ? ' (profile-only mode)' : ''}`);

    const result: ProcessCreatorResponse = {
      success: true,
      extractedVideos: sortedVideos,
      totalFound: extractedVideos.length,
      message: profileOnly 
        ? `Successfully extracted profile data for @${username} (${sortedVideos.length} videos found but not validated)`
        : `Successfully extracted ${sortedVideos.length} videos from @${username}'s ${platform} profile.`,
      profileData,
    };

    // Cache the successful result
    setCachedProfile(username, platform, result);

    return result;
  } catch (error) {
    console.error("🔥 [PROCESS_CREATOR_UTILS] Failed to process profile:", error);

    return {
      success: false,
      extractedVideos: [],
      totalFound: 0,
      message: "Processing failed",
      error: error instanceof Error ? error.message : "Failed to process profile",
    };
  }
}

async function processTikTokProfile(username: string, videoCount: number, profileOnly: boolean = false): Promise<{ videos: VideoData[], profileData?: ProcessCreatorResponse["profileData"] }> {
  console.log(`🎵 [TIKTOK] Processing profile: @${username}`);

  // Check circuit breaker
  if (isCircuitOpen("tiktok")) {
    throw new Error("TikTok API circuit breaker is open. Please try again later.");
  }

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

      // Queue the TikTok API call with global rate limiting
      const tiktokApiUrl = `https://tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com/user/${username}/feed`;
      console.log(`🌐 [TIKTOK] Queueing API call to: ${tiktokApiUrl}`);

      const response = await queueRapidApiCall(`tiktok_feed_${username}_${attempt}`, async () => {
        return await fetch(tiktokApiUrl, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "tiktok-scrapper-videos-music-challenges-downloader.p.rapidapi.com",
          },
        });
      });

      console.log(`📡 [TIKTOK] API Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [TIKTOK] API Error Response:`, errorText);

        // Handle 429 (Too Many Requests) specifically
        if (response.status === 429) {
          recordFailure("tiktok", true); // Mark as rate limit failure
          const retryAfter = response.headers.get("retry-after");
          const baseWait = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          const waitTime = Math.max(baseWait, getDynamicRateLimit() * 2); // Use at least 2x dynamic rate limit
          console.log(`🚫 [TIKTOK] Rate limited (429). Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`TikTok API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 [TIKTOK] API Response Data:`, JSON.stringify(data, null, 2));

      if (!data.videos || !Array.isArray(data.videos)) {
        console.error(`❌ [TIKTOK] No videos array found in response. Response structure:`, Object.keys(data));
        throw new Error(
          "No videos found in TikTok API response. The profile may be private or the username may be incorrect.",
        );
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
          like_count: video.like_count,
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
        throw new Error(
          `No valid videos could be extracted from @${username}'s TikTok profile. All video URLs were invalid or inaccessible.`,
        );
      }

      console.log(`✅ [TIKTOK] Successfully processed ${processedVideos.length} videos for @${username}`);
      recordSuccess("tiktok");
      return { videos: processedVideos, profileData: undefined }; // TikTok profile data extraction not implemented yet
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [TIKTOK] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // Record failure for circuit breaker on final attempt
      if (attempt === maxRetries) {
        recordFailure("tiktok");
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter: base delay * 2^attempt + random jitter
        const baseDelay = 1000;
        const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const delayMs = backoffDelay + jitter;

        console.log(`⏳ [TIKTOK] Retrying in ${Math.round(delayMs)}ms... (exponential backoff)`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to process TikTok profile @${username} after ${maxRetries} attempts. Last error: ${lastError?.message}`,
  );
}

async function processInstagramProfile(username: string, videoCount: number, profileOnly: boolean = false): Promise<{ videos: VideoData[], profileData?: ProcessCreatorResponse["profileData"] }> {
  console.log(`📸 [INSTAGRAM] Processing profile: @${username}`);

  // Check circuit breaker
  if (isCircuitOpen("instagram")) {
    throw new Error("Instagram API circuit breaker is open. Please try again later.");
  }

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

      // Step 1: Get user ID by username (queued with global rate limiting)
      const userIdApiUrl = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/user_id_by_username?username=${username}`;
      console.log(`🌐 [INSTAGRAM] Queueing User ID API call to: ${userIdApiUrl}`);

      const userIdResponse = await queueRapidApiCall(`instagram_userid_${username}_${attempt}`, async () => {
        return await fetch(userIdApiUrl, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
          },
        });
      });

      console.log(`📡 [INSTAGRAM] User ID API Response Status: ${userIdResponse.status} ${userIdResponse.statusText}`);

      if (!userIdResponse.ok) {
        const errorText = await userIdResponse.text();
        console.error(`❌ [INSTAGRAM] User ID API Error Response:`, errorText);

        // Handle 429 (Too Many Requests) specifically
        if (userIdResponse.status === 429) {
          recordFailure("instagram", true); // Mark as rate limit failure
          const retryAfter = userIdResponse.headers.get("retry-after");
          const baseWait = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          const waitTime = Math.max(baseWait, getDynamicRateLimit() * 2); // Use at least 2x dynamic rate limit
          console.log(`🚫 [INSTAGRAM] Rate limited (429) on user ID lookup. Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`Instagram user ID lookup failed with status ${userIdResponse.status}: ${errorText}`);
      }

      const userIdData = await userIdResponse.json();
      console.log(`📊 [INSTAGRAM] User ID API Response Data:`, JSON.stringify(userIdData, null, 2));

      const userId = userIdData.UserID;

      if (!userId) {
        throw new Error(
          `No user ID found for @${username}. The username may be incorrect or the profile may not exist.`,
        );
      }

      // Step 2: Get profile info using profile_by_username endpoint for complete profile data with follower counts
      const profileApiUrl = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/profile_by_username?username=${username}`;
      console.log(`🌐 [INSTAGRAM] Queueing Profile Info API call to: ${profileApiUrl}`);

      const profileResponse = await queueRapidApiCall(`instagram_profile_${username}_${attempt}`, async () => {
        return await fetch(profileApiUrl, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
          },
        });
      });

      console.log(`📡 [INSTAGRAM] Profile Info API Response Status: ${profileResponse.status} ${profileResponse.statusText}`);

      let profileInfoData = null;
      if (profileResponse.ok) {
        profileInfoData = await profileResponse.json();
        console.log(`📊 [INSTAGRAM] Profile Info API Response Data:`, JSON.stringify(profileInfoData, null, 2));
      } else {
        console.log(`⚠️ [INSTAGRAM] Profile info call failed, will extract from reels data`);
      }

      // Step 3: Get reels by user ID (queued with global rate limiting)
      const reelsApiUrl = `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reels?user_id=${userId}&include_feed_video=true`;
      console.log(`🌐 [INSTAGRAM] Queueing Reels API call to: ${reelsApiUrl}`);

      const reelsResponse = await queueRapidApiCall(`instagram_reels_${userId}_${attempt}`, async () => {
        return await fetch(reelsApiUrl, {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": rapidApiKey,
            "X-RapidAPI-Host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
          },
        });
      });

      console.log(`📡 [INSTAGRAM] Reels API Response Status: ${reelsResponse.status} ${reelsResponse.statusText}`);

      if (!reelsResponse.ok) {
        const errorText = await reelsResponse.text();
        console.error(`❌ [INSTAGRAM] Reels API Error Response:`, errorText);

        // Handle 429 (Too Many Requests) specifically
        if (reelsResponse.status === 429) {
          recordFailure("instagram", true); // Mark as rate limit failure
          const retryAfter = reelsResponse.headers.get("retry-after");
          const baseWait = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          const waitTime = Math.max(baseWait, getDynamicRateLimit() * 2); // Use at least 2x dynamic rate limit
          console.log(`🚫 [INSTAGRAM] Rate limited (429) on reels fetch. Waiting ${waitTime}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        throw new Error(`Instagram reels fetch failed with status ${reelsResponse.status}: ${errorText}`);
      }

      const reelsData = await reelsResponse.json();
      console.log(`📊 [INSTAGRAM] Reels API Response Data:`, JSON.stringify(reelsData, null, 2));

      // Handle the new Instagram API response structure
      if (!reelsData.data || !reelsData.data.items || !Array.isArray(reelsData.data.items)) {
        console.error(`❌ [INSTAGRAM] No items array found in response. Response structure:`, Object.keys(reelsData));
        throw new Error(
          "No reels found in Instagram API response. The profile may be private or the username may be incorrect.",
        );
      }

      // Extract profile information - prioritize dedicated profile API, fallback to reels data
      let profileData: ProcessCreatorResponse["profileData"] = undefined;
      
      // First try to extract from dedicated profile info API
      if (profileInfoData) {
        console.log(`🔍 [INSTAGRAM] Extracting from profile info API data...`);
        // The profile_by_username endpoint returns data at root level, not nested
        const profileInfo = profileInfoData;
        
        if (profileInfo) {
          console.log(`🔍 [INSTAGRAM] Profile info available fields:`, Object.keys(profileInfo));
          console.log(`🔍 [INSTAGRAM] Profile follower data:`, {
            follower_count: profileInfo.follower_count,
            edge_followed_by: profileInfo.edge_followed_by?.count
          });
          console.log(`🔍 [INSTAGRAM] Profile following data:`, {
            following_count: profileInfo.following_count,
            edge_follow: profileInfo.edge_follow?.count
          });
          console.log(`🔍 [INSTAGRAM] Profile bio data:`, {
            biography: profileInfo.biography,
            external_url: profileInfo.external_url,
            business_category_name: profileInfo.business_category_name
          });

          // Extract website/external URL from bio or dedicated field
          let externalUrl = profileInfo.external_url;
          let bio = profileInfo.biography || '';
          
          // Try to extract URL from bio if not in external_url field
          if (!externalUrl && bio) {
            const urlMatch = bio.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              externalUrl = urlMatch[1];
            }
          }

          profileData = {
            profileImageUrl: profileInfo.hd_profile_pic_url_info?.url || profileInfo.profile_pic_url || undefined,
            displayName: profileInfo.full_name || username,
            bio: bio || undefined,
            followersCount: profileInfo.follower_count || profileInfo.edge_followed_by?.count || 0,
            followingCount: profileInfo.following_count || profileInfo.edge_follow?.count || 0,
            postsCount: profileInfo.media_count || profileInfo.edge_owner_to_timeline_media?.count || 0,
            isVerified: profileInfo.is_verified || false,
            isPrivate: profileInfo.is_private || false,
            externalUrl: externalUrl || undefined,
            category: profileInfo.category || profileInfo.business_category_name || undefined,
          };
          console.log(`📸 [INSTAGRAM] Extracted profile data from profile API:`, profileData);
        }
      }
      
      // Fallback to extracting from reels data if profile API didn't work
      if (!profileData && reelsData.data.items.length > 0) {
        console.log(`🔍 [INSTAGRAM] Falling back to extracting from reels data...`);
        const firstItem = reelsData.data.items[0];
        const userInfo = firstItem.media?.user || firstItem.user || firstItem.media?.owner;
        
        if (userInfo) {
          console.log(`🔍 [INSTAGRAM] Available user fields from reels:`, Object.keys(userInfo));
          
          profileData = {
            profileImageUrl: userInfo.profile_pic_url || userInfo.profile_picture || userInfo.profile_pic_url_hd || undefined,
            displayName: userInfo.full_name || userInfo.display_name || userInfo.name || username,
            bio: userInfo.biography || userInfo.bio || undefined,
            followersCount: userInfo.follower_count || userInfo.followers_count || userInfo.edge_followed_by?.count || 0,
            followingCount: userInfo.following_count || userInfo.followings_count || userInfo.edge_follow?.count || 0,
            postsCount: userInfo.media_count || userInfo.posts_count || userInfo.edge_owner_to_timeline_media?.count || 0,
            isVerified: userInfo.is_verified || userInfo.verified || false,
            isPrivate: userInfo.is_private || userInfo.private || false,
          };
          console.log(`📸 [INSTAGRAM] Extracted profile data from reels:`, profileData);
        } else {
          console.log(`⚠️ [INSTAGRAM] No user info found in reels data`);
        }
      }

      // Filter for video/reel items only
      const videoItems = reelsData.data.items.filter(
        (item: any) => item.media && item.media.media_type === 2, // 2 = video/reel
      );

      console.log(
        `📊 [INSTAGRAM] Found ${videoItems.length} video items out of ${reelsData.data.items.length} total items`,
      );

      // In profile-only mode, don't fail if no videos found - we already have profile data
      if (videoItems.length === 0 && !profileOnly) {
        throw new Error(`No video reels found for @${username}. The profile may be empty or private.`);
      }

      let processedVideos: VideoData[] = [];

      // Only process videos if we have video items and it's not profile-only mode
      if (videoItems.length > 0) {
        const maxReels = Math.min(videoItems.length, videoCount * 2);
        console.log(`🔄 [INSTAGRAM] Processing ${maxReels} reels out of ${videoItems.length} total`);

        for (let i = 0; i < maxReels; i++) {
          const item = videoItems[i];
          const reel = item.media; // The actual reel data is in the media object
          console.log(`🔍 [INSTAGRAM] Processing reel ${i + 1}/${maxReels}:`, {
            id: reel.pk,
            title: reel.caption?.text,
            video_url: reel.video_versions?.[0]?.url,
            view_count: reel.play_count,
            like_count: reel.like_count,
          });

          if (profileOnly) {
            // In profile-only mode, create video data without URL validation
            const videoData = extractInstagramReelDataProfileOnly(reel, username, i);
            if (videoData) {
              processedVideos.push(videoData);
              console.log(`✅ [INSTAGRAM] Successfully extracted reel ${i + 1} (profile-only mode)`);
            }
          } else {
            // Normal mode with URL validation
            const videoData = extractInstagramReelData(reel, username, i);
            if (videoData) {
              processedVideos.push(videoData);
              console.log(`✅ [INSTAGRAM] Successfully extracted reel ${i + 1}`);
            } else {
              console.log(`⚠️ [INSTAGRAM] Failed to extract reel ${i + 1}`);
            }
          }
        }

        // Only fail on video extraction in non-profile-only mode
        if (processedVideos.length === 0 && !profileOnly) {
          throw new Error(
            `No valid videos could be extracted from @${username}'s Instagram profile. All video URLs were invalid or inaccessible.`,
          );
        }
      }

      console.log(`✅ [INSTAGRAM] Successfully processed ${processedVideos.length} videos for @${username}`);
      recordSuccess("instagram");
      return { videos: processedVideos, profileData };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ [INSTAGRAM] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      // Record failure for circuit breaker on final attempt
      if (attempt === maxRetries) {
        recordFailure("instagram");
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter for Instagram (longer base delay)
        const baseDelay = 2000; // Start with 2 seconds for Instagram
        const backoffDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const delayMs = backoffDelay + jitter;

        console.log(`⏳ [INSTAGRAM] Retrying in ${Math.round(delayMs)}ms... (exponential backoff)`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // All retries failed
  throw new Error(
    `Failed to process Instagram profile @${username} after ${maxRetries} attempts. Last error: ${lastError?.message}`,
  );
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
    platform: "tiktok",
    video_url: videoUrl,
    thumbnail_url: video.thumbnail_url ?? video.cover,
    viewCount: parseInt(video.view_count ?? video.views ?? "0"),
    likeCount: parseInt(video.like_count ?? video.likes ?? "0"),
    quality: video.quality ?? "720p",
    title: video.title ?? video.description ?? `TikTok Video ${i + 1}`,
    description: video.description ?? "",
    author: video.author ?? username,
    duration: parseInt(video.duration ?? "30"),
  };
}

// Helper function for extracting Instagram reel data (profile-only mode - no URL validation)
function extractInstagramReelDataProfileOnly(reel: any, username: string, i: number): VideoData | null {
  try {
    // Get basic metadata without validating video URLs
    const videoVersions = reel.video_versions;
    const videoUrl = videoVersions && videoVersions.length > 0 ? videoVersions[0].url : `placeholder-${i}`;
    
    // Get thumbnail from image_versions2
    const imageVersions = reel.image_versions2?.candidates;
    const thumbnailUrl = imageVersions && imageVersions.length > 0 ? imageVersions[0].url : undefined;
    
    // Extract caption text
    const caption = reel.caption?.text ?? "";
    
    return {
      id: reel.pk ?? reel.id ?? `instagram_${username}_${i}_${Date.now()}`,
      platform: "instagram",
      video_url: videoUrl, // May be placeholder in profile-only mode
      thumbnail_url: thumbnailUrl,
      viewCount: parseInt(reel.play_count ?? reel.view_count ?? "0"),
      likeCount: parseInt(reel.like_count ?? "0"),
      quality: videoVersions && videoVersions[0] ? videoVersions[0].width + "x" + videoVersions[0].height : "unknown",
      title: caption || `Instagram Reel ${i + 1}`,
      description: caption,
      author: username,
      duration: parseInt(reel.video_duration ?? "30"),
    };
  } catch (error) {
    console.error(`❌ [INSTAGRAM] Error extracting reel data (profile-only):`, error);
    return null;
  }
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
  const caption = reel.caption?.text ?? "";

  return {
    id: reel.pk ?? reel.id ?? `instagram_${username}_${i}_${Date.now()}`,
    platform: "instagram",
    video_url: videoUrl,
    thumbnail_url: thumbnailUrl,
    viewCount: parseInt(reel.play_count ?? reel.view_count ?? "0"),
    likeCount: parseInt(reel.like_count ?? "0"),
    quality: videoVersions[0].width + "x" + videoVersions[0].height,
    title: caption || `Instagram Reel ${i + 1}`,
    description: caption,
    author: username,
    duration: parseInt(reel.video_duration ?? "30"),
  };
}

function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check if it's a valid HTTP/HTTPS URL
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}
