import { NextRequest, NextResponse } from "next/server";

import { streamToBunnyFromUrl } from "@/lib/bunny-stream";

function validateEnvironmentVariables(): { valid: boolean; error?: string } {
  if (!process.env.BUNNY_STREAM_LIBRARY_ID || !process.env.BUNNY_STREAM_API_KEY) {
    console.error("❌ [INSTAGRAM_TO_BUNNY] Missing Bunny Stream configuration");
    return { valid: false, error: "Bunny Stream not configured" };
  }

  if (!process.env.RAPIDAPI_KEY) {
    console.error("❌ [INSTAGRAM_TO_BUNNY] Missing RapidAPI key");
    return { valid: false, error: "RapidAPI not configured" };
  }

  return { valid: true };
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // In development, use the request's host to get the correct port
  const host = request.headers.get("host");
  if (host) {
    return `http://${host}`;
  }

  // Fallback to default
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 3001}`;
}

function validateInstagramUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    console.error("❌ [INSTAGRAM_TO_BUNNY] No URL provided");
    return { valid: false, error: "URL is required" };
  }

  if (!url.toLowerCase().includes("instagram.com")) {
    console.error("❌ [INSTAGRAM_TO_BUNNY] Only Instagram URLs supported");
    return { valid: false, error: "Only Instagram URLs are supported" };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  console.log("🚀 [INSTAGRAM_TO_BUNNY] Starting optimized Instagram workflow...");

  try {
    const { url } = await request.json();

    // Validate URL
    const urlValidation = validateInstagramUrl(url);
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error }, { status: 400 });
    }

    // Check environment variables
    const envValidation = validateEnvironmentVariables();
    if (!envValidation.valid) {
      return NextResponse.json({ error: envValidation.error }, { status: 500 });
    }

    console.log("🔍 [INSTAGRAM_TO_BUNNY] Processing Instagram URL:", url);

    // Step 1: Extract shortcode
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      console.error("❌ [INSTAGRAM_TO_BUNNY] Could not extract shortcode");
      return NextResponse.json({ error: "Invalid Instagram URL format" }, { status: 400 });
    }

    console.log("🆔 [INSTAGRAM_TO_BUNNY] Shortcode:", shortcode);

    // Step 2: Get video metadata and links from RapidAPI
    console.log("📱 [INSTAGRAM_TO_BUNNY] Fetching video data from RapidAPI...");
    const rapidApiData = await fetchInstagramData(shortcode);

    if (!rapidApiData.success) {
      console.error("❌ [INSTAGRAM_TO_BUNNY] RapidAPI failed:", rapidApiData.error);
      return NextResponse.json(
        {
          error: "Failed to fetch Instagram video data",
          details: rapidApiData.error,
        },
        { status: 500 },
      );
    }

    const { videoData, metadata } = rapidApiData;

    if (!videoData?.lowQualityUrl) {
      console.error("❌ [INSTAGRAM_TO_BUNNY] No video URL found in response");
      return NextResponse.json({ error: "No video URL found in Instagram data" }, { status: 500 });
    }

    // Step 3: Stream video directly to Bunny CDN (using low quality for speed)
    console.log("🌊 [INSTAGRAM_TO_BUNNY] Streaming to Bunny CDN...");
    const filename = `instagram-${shortcode}.mp4`;
    const bunnyIframeUrl = await streamToBunnyFromUrl(videoData.lowQualityUrl, filename);

    if (!bunnyIframeUrl) {
      console.error("❌ [INSTAGRAM_TO_BUNNY] Failed to stream to Bunny CDN");
      return NextResponse.json({ error: "Failed to upload video to CDN" }, { status: 500 });
    }

    console.log("✅ [INSTAGRAM_TO_BUNNY] Video successfully streamed to Bunny CDN");

    // Step 4: Background transcription handled by standard workflow
    console.log("✅ [INSTAGRAM_TO_BUNNY] Transcription will be handled by standard analysis workflow");

    // Step 5: Return immediate response with iframe and thumbnail
    return NextResponse.json({
      success: true,
      video: {
        iframeUrl: bunnyIframeUrl,
        thumbnailUrl: videoData.thumbnailUrl,
        filename,
        platform: "instagram",
      },
      metadata: {
        author: metadata.author,
        likes: metadata.likes,
        views: metadata.views,
        comments: metadata.comments,
        shares: metadata.shares,
        saves: metadata.saves,
        duration: metadata.duration,
        originalUrl: url,
        shortcode,
        processedAt: new Date().toISOString(),
      },
      processing: {
        streamedToBunny: true,
        transcriptionStarted: true,
        transcriptionStatus: "processing",
      },
    });
  } catch (error) {
    console.error("❌ [INSTAGRAM_TO_BUNNY] Workflow error:", error);
    return NextResponse.json(
      {
        error: "Instagram processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function fetchInstagramData(shortcode: string) {
  try {
    const response = await makeRapidApiRequest(shortcode);

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `RapidAPI error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return processInstagramResponse(data);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown RapidAPI error",
    };
  }
}

async function makeRapidApiRequest(shortcode: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const response = await fetch(
    `https://instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com/reel_by_shortcode?shortcode=${shortcode}`,
    {
      method: "GET",
      headers: {
        "x-rapidapi-key": process.env.RAPIDAPI_KEY ?? "7d8697833dmsh0919d85dc19515ap1175f7jsn0f8bb6dae84e",
        "x-rapidapi-host": "instagram-scrapper-posts-reels-stories-downloader.p.rapidapi.com",
      },
      signal: controller.signal,
    },
  );

  clearTimeout(timeoutId);
  return response;
}

function processInstagramResponse(data: any) {
  if (!data.video_versions || data.video_versions.length === 0) {
    return { success: false, error: "No video versions found in response" };
  }

  // Extract video URLs (prioritize low quality for faster streaming)
  const videoVersions = data.video_versions;
  const lowQualityUrl = videoVersions[videoVersions.length - 1]?.url; // Usually smallest/fastest
  const highQualityUrl = videoVersions[0]?.url; // Usually highest quality

  return {
    success: true,
    videoData: {
      lowQualityUrl,
      highQualityUrl,
      thumbnailUrl: data.thumbnail_url ?? generatePlaceholderThumbnail(),
      allVersions: videoVersions,
    },
    metadata: {
      platform: "instagram",
      author: data.owner?.username ?? data.username ?? "Unknown",
      likes: data.like_count ?? 0,
      views: data.play_count ?? 0,
      comments: data.comment_count ?? 0,
      shares: data.reshare_count ?? 0,
      saves: data.save_count ?? 0,
      duration: data.video_duration ?? data.duration ?? 0,
    },
  };
}

function generatePlaceholderThumbnail(): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="360" height="640" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#833AB4;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FCB045;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="360" height="640" fill="url(#grad)" />
      <text x="180" y="300" fill="white" text-anchor="middle" font-size="24">📹</text>
      <text x="180" y="340" fill="white" text-anchor="middle" font-size="16">INSTAGRAM</text>
      <text x="180" y="360" fill="white" text-anchor="middle" font-size="16">Video</text>
    </svg>`,
  ).toString("base64")}`;
}

function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reels?)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
