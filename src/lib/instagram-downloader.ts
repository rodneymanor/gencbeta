export async function fetchInstagramMetadata(shortcode: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  console.log("🌐 [DOWNLOAD] Calling Instagram RapidAPI with 30s timeout...");

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
    console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", response.status);
    return null;
  }

  const data = await response.json();
  console.log("🔍 [DEBUG] Full Instagram API response:", JSON.stringify(data, null, 2));
  return data;
}

export function extractMetricsFromMetadata(metadata: any) {
  console.log("🔍 [DEBUG] Full metadata object keys:", Object.keys(metadata));
  console.log("🔍 [DEBUG] Metadata like_count:", metadata.like_count);
  console.log("🔍 [DEBUG] Metadata play_count:", metadata.play_count);
  console.log("🔍 [DEBUG] Metadata reshare_count:", metadata.reshare_count);
  console.log("🔍 [DEBUG] Metadata comment_count:", metadata.comment_count);
  console.log("🔍 [DEBUG] Metadata save_count:", metadata.save_count);
  console.log("🔍 [DEBUG] Metadata video_duration:", metadata.video_duration);
  console.log("🔍 [DEBUG] Metadata duration:", metadata.duration);
  console.log("🔍 [DEBUG] Metadata owner:", metadata.owner);
  console.log("🔍 [DEBUG] Metadata user:", metadata.user);
  console.log("🔍 [DEBUG] Metadata username:", metadata.username);

  // Check if metadata has the structure we expect
  if (typeof metadata === "object" && metadata !== null) {
    console.log("🔍 [DEBUG] Metadata is valid object");
    console.log("🔍 [DEBUG] First 500 chars of metadata:", JSON.stringify(metadata).substring(0, 500));
  }

  const metrics = {
    likes: metadata.like_count ?? 0,
    views: metadata.play_count ?? 0,
    shares: metadata.reshare_count ?? 0,
    comments: metadata.comment_count ?? 0,
    saves: metadata.save_count ?? 0,
  };

  console.log("📊 [DOWNLOAD] Extracted metrics:", metrics);
  return metrics;
}

export function extractAdditionalMetadata(metadata: any) {
  const author = getAuthorFromMetadata(metadata);
  const duration = getDurationFromMetadata(metadata);

  const captionText = metadata.caption?.text || metadata.caption_text || metadata.edge_media_to_caption?.edges?.[0]?.node?.text || "";

  // Extract hashtags from caption text
  const hashtags = Array.from(new Set((captionText.match(/#[A-Za-z0-9_]+/g) || []).map((h: string) => h.substring(1))))
    .slice(0, 30); // limit

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
  return (
    metadata.owner?.username ??
    metadata.user?.username ??
    metadata.username ??
    metadata.owner?.full_name ??
    metadata.user?.full_name ??
    "Unknown"
  );
}

function getDurationFromMetadata(metadata: any): number {
  return metadata.video_duration ?? metadata.duration ?? 0;
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
