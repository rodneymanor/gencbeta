export async function fetchInstagramMetadata(shortcode: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  console.log("🌐 [DOWNLOAD] Calling Instagram RapidAPI with 30s timeout...");

  try {
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

    if (!response.ok) {
      console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", response.status, response.statusText);

      // Try multiple fallback endpoints
      const fallbackData = await tryMultipleFallbacks(shortcode);
      if (fallbackData) {
        return fallbackData;
      }

      return null;
    }

    const data = await response.json();
    console.log("🔍 [DEBUG] Full Instagram API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Instagram RapidAPI fetch error:", error);

    // Try fallbacks even on network errors
    const fallbackData = await tryMultipleFallbacks(shortcode);
    if (fallbackData) {
      return fallbackData;
    }

    return null;
  }
}

async function tryMultipleFallbacks(shortcode: string) {
  const fallbackEndpoints = [
    `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
    `https://www.instagram.com/p/${shortcode}/?__a=1`,
    `https://www.instagram.com/api/v1/media/${shortcode}/info/`,
  ];

  for (let i = 0; i < fallbackEndpoints.length; i++) {
    const endpoint = fallbackEndpoints[i];
    console.log(`🌐 [FALLBACK] Trying endpoint ${i + 1}/${fallbackEndpoints.length}:`, endpoint);

    try {
      const igResponse = await fetch(endpoint, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 10000,
      });

      if (igResponse.ok) {
        const igData = await igResponse.json();
        console.log(`🔍 [FALLBACK] Successfully fetched via endpoint ${i + 1}`);
        console.log("🔍 [FALLBACK] Response structure:", Object.keys(igData));

        // Normalize the response structure
        const normalized = normalizeInstagramResponse(igData, i);
        if (normalized) {
          return normalized;
        }
      } else {
        console.error(`❌ [FALLBACK] Endpoint ${i + 1} error:`, igResponse.status, igResponse.statusText);
      }
    } catch (fallbackErr) {
      console.error(`❌ [FALLBACK] Endpoint ${i + 1} failed:`, fallbackErr);
    }
  }

  console.error("❌ [FALLBACK] All fallback endpoints failed");
  return null;
}

function normalizeInstagramResponse(data: any, endpointIndex: number) {
  try {
    // Different endpoints return different structures
    switch (endpointIndex) {
      case 0: // ?__a=1&__d=dis
        return data.graphql?.shortcode_media ?? data.items?.[0] ?? data;
      case 1: // ?__a=1
        return data.graphql?.shortcode_media ?? data.items?.[0] ?? data;
      case 2: // /api/v1/media/{shortcode}/info/
        return data.items?.[0] ?? data;
      default:
        return data;
    }
  } catch (error) {
    console.error("❌ [FALLBACK] Error normalizing response:", error);
    return data;
  }
}

export function extractMetricsFromMetadata(metadata: any) {
  console.log("🔍 [DEBUG] Full metadata object keys:", Object.keys(metadata));

  // Handle different response structures
  const mediaData = metadata.media ?? metadata;

  // Try multiple possible field names for each metric
  const likes =
    mediaData.like_count ??
    mediaData.edge_media_preview_like?.count ??
    mediaData.edge_liked_by?.count ??
    mediaData.likes ??
    0;
  const views = mediaData.play_count ?? mediaData.video_view_count ?? mediaData.view_count ?? mediaData.views ?? 0;
  const shares = mediaData.reshare_count ?? mediaData.edge_media_to_share?.count ?? mediaData.shares ?? 0;
  const comments = mediaData.comment_count ?? mediaData.edge_media_to_comment?.count ?? mediaData.comments ?? 0;

  // Saves can appear under different fields depending on media type / API version
  const saves =
    mediaData.save_count ??
    mediaData.saved_count ??
    mediaData.saved ??
    mediaData.total_viewer_save_count ??
    mediaData.edge_media_to_collection?.count ??
    0;

  console.log("🔍 [DEBUG] Raw metric values:", { likes, views, shares, comments, saves });
  console.log("🔍 [DEBUG] Metadata like_count:", mediaData.like_count);
  console.log("🔍 [DEBUG] Metadata play_count:", mediaData.play_count);
  console.log("🔍 [DEBUG] Metadata reshare_count:", mediaData.reshare_count);
  console.log("🔍 [DEBUG] Metadata comment_count:", mediaData.comment_count);
  console.log("🔍 [DEBUG] Metadata save_count:", mediaData.save_count);
  console.log("🔍 [DEBUG] Metadata video_duration:", mediaData.video_duration);
  console.log("🔍 [DEBUG] Metadata duration:", mediaData.duration);
  console.log("🔍 [DEBUG] Metadata owner:", mediaData.owner);
  console.log("🔍 [DEBUG] Metadata user:", mediaData.user);
  console.log("🔍 [DEBUG] Metadata username:", mediaData.username);

  const metrics = {
    likes,
    views,
    shares,
    comments,
    saves,
  };

  console.log("📊 [DOWNLOAD] Extracted metrics:", metrics);
  return metrics;
}

export function extractAdditionalMetadata(metadata: any) {
  const mediaData = metadata.media ?? metadata;

  const author = getAuthorFromMetadata(mediaData);
  const duration = getDurationFromMetadata(mediaData);

  // Try multiple caption field structures
  const captionText =
    mediaData.caption?.text ||
    mediaData.caption_text ||
    mediaData.edge_media_to_caption?.edges?.[0]?.node?.text ||
    mediaData.text ||
    "";

  // Extract hashtags from caption text
  const hashtags = Array.from(
    new Set((captionText.match(/#[A-Za-z0-9_]+/g) || []).map((h: string) => h.substring(1))),
  ).slice(0, 30); // limit

  const additionalData = {
    author,
    duration,
    description: captionText,
    hashtags,
  };

  console.log("📋 [DOWNLOAD] Extracted additional metadata:", additionalData);
  return additionalData;
}

export function extractThumbnailUrl(metadata: any): string | undefined {
  try {
    // Instagram API provides thumbnails in image_versions2 field
    if (metadata.image_versions2?.candidates?.length > 0) {
      const thumbnail = metadata.image_versions2.candidates[0].url;
      console.log("🖼️ [DOWNLOAD] Extracted Instagram thumbnail from image_versions2:", thumbnail);
      return thumbnail;
    }

    // Also check additional_candidates for better quality options
    if (metadata.image_versions2?.additional_candidates?.first_frame?.url) {
      const thumbnail = metadata.image_versions2.additional_candidates.first_frame.url;
      console.log("🖼️ [DOWNLOAD] Extracted Instagram thumbnail from first_frame:", thumbnail);
      return thumbnail;
    }

    console.log("⚠️ [DOWNLOAD] No thumbnail found in Instagram metadata");
    return undefined;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Error extracting thumbnail URL:", error);
    return undefined;
  }
}

function getAuthorFromMetadata(metadata: any): string {
  // Try multiple possible author field structures
  const author =
    metadata.owner?.username ??
    metadata.user?.username ??
    metadata.username ??
    metadata.owner?.full_name ??
    metadata.user?.full_name ??
    metadata.owner?.display_name ??
    metadata.user?.display_name ??
    metadata.author?.username ??
    metadata.author?.full_name ??
    "Unknown";

  console.log("👤 [DOWNLOAD] Extracted author:", author);
  return author;
}

function getDurationFromMetadata(metadata: any): number {
  const duration = metadata.video_duration ?? metadata.duration ?? metadata.media_duration ?? metadata.length ?? 0;

  console.log("⏱️ [DOWNLOAD] Extracted duration:", duration);
  return duration;
}

export async function downloadVideoFromVersions(videoVersions: any[], shortcode: string) {
  if (!videoVersions?.length) {
    console.error("❌ [DOWNLOAD] No video versions found in Instagram RapidAPI response");
    return null;
  }

  console.log("🔗 [DOWNLOAD] Instagram video versions found:", videoVersions.length, "options");

  // Try video versions, starting with the smallest
  for (let i = videoVersions.length - 1; i >= 0; i--) {
    const videoVersion = videoVersions[i];
    const videoUrl = videoVersion.url;

    if (!videoUrl) {
      console.log(`⚠️ [DOWNLOAD] Video version ${i + 1} has no URL, skipping`);
      continue;
    }

    const result = await tryDownloadFromUrl(videoUrl, i + 1);
    if (result) {
      return {
        ...result,
        filename: `instagram-${shortcode}.mp4`,
      };
    }
  }

  return null;
}

// Helper function to extract video versions from different response structures
export function extractVideoVersions(metadata: any): any[] {
  const mediaData = metadata.media ?? metadata;

  // Try different possible video version field structures
  const videoVersions =
    mediaData.video_versions ?? mediaData.video_urls ?? mediaData.video_url ?? mediaData.video ?? [];

  console.log("🎥 [DOWNLOAD] Extracted video versions:", videoVersions.length);

  // If we have a single video URL, wrap it in an array
  if (typeof videoVersions === "string") {
    return [{ url: videoVersions }];
  }

  // If we have an object with a url property, wrap it in an array
  if (videoVersions && typeof videoVersions === "object" && videoVersions.url) {
    return [videoVersions];
  }

  return Array.isArray(videoVersions) ? videoVersions : [];
}

async function tryDownloadFromUrl(videoUrl: string, version: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const size = buffer.byteLength;
      const mimeType = response.headers.get("content-type") ?? "video/mp4";

      console.log(`✅ [DOWNLOAD] Successfully downloaded from Instagram version ${version}`);

      return { buffer, size, mimeType };
    }
  } catch (error) {
    console.log(`❌ [DOWNLOAD] Instagram version ${version} failed:`, error);
  }

  return null;
}
