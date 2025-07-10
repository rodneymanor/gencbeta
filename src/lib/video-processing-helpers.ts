import { uploadToBunnyStream } from "@/lib/bunny-stream";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata,
  extractAdditionalMetadata,
  downloadVideoFromVersions,
} from "@/lib/instagram-downloader";
import { downloadTikTokVideo as downloadTikTokVideoFromAPI, extractTikTokVideoId } from "@/lib/tiktok-downloader";
import { transcribeVideoFile } from "@/lib/transcription";

export interface DownloadResult {
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string };
  metrics?: { likes: number; views: number; shares: number; comments: number; saves: number };
  additionalMetadata?: { author: string; duration: number };
}

export interface CdnResult {
  success: boolean;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  error?: string;
}

export interface TranscriptionResult {
  success: boolean;
  transcript: string;
  platform: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext: string;
  transcriptionMetadata: {
    method: string;
    fileSize: number;
    fileName: string;
    processedAt: string;
  };
}

export function detectPlatform(url: string): string {
  const urlLower = url.toLowerCase();
  console.log("🔍 [PLATFORM] Analyzing URL for platform detection:", urlLower);

  if (urlLower.includes("tiktok.com")) {
    console.log("✅ [PLATFORM] Platform identified: TikTok");
    return "tiktok";
  }
  if (urlLower.includes("instagram.com")) {
    console.log("✅ [PLATFORM] Platform identified: Instagram");
    return "instagram";
  }

  console.log("⚠️ [PLATFORM] Platform unknown for URL:", urlLower);
  return "unknown";
}

export async function transcribeVideoData(
  videoData: {
    buffer: ArrayBuffer;
    size: number;
    mimeType: string;
    filename?: string;
  },
  platform: string,
): Promise<TranscriptionResult | null> {
  try {
    console.log("🎬 [DOWNLOAD] Converting video data to file for transcription...");

    const uint8Array = new Uint8Array(videoData.buffer);
    const blob = new Blob([uint8Array], { type: videoData.mimeType });
    const file = new File([blob], videoData.filename ?? `${platform}-video.mp4`, {
      type: videoData.mimeType,
    });

    console.log("🎬 [DOWNLOAD] Transcribing video file...");
    // Use localhost for server-side transcription calls
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3001}`;
    const transcriptionResult = await transcribeVideoFile(file, baseUrl);

    return transcriptionResult;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Transcription error:", error);
    console.log("🔄 [DOWNLOAD] Using fallback transcription due to API error");

    // Return fallback transcription so video can still be added to collection
    return createFallbackTranscription(platform);
  }
}

function createFallbackTranscription(platform: string): TranscriptionResult {
  return {
    success: true,
    transcript:
      "Transcription temporarily unavailable. Video content analysis will be available once transcription service is configured.",
    platform: platform,
    components: {
      hook: "Video content analysis pending",
      bridge: "Transcription service configuration needed",
      nugget: "Main content insights will be available after transcription",
      wta: "Configure Gemini API key to enable full video analysis",
    },
    contentMetadata: {
      platform: platform,
      author: "Unknown",
      description: "Video added successfully - transcription pending service configuration",
      source: "other",
      hashtags: [],
    },
    visualContext: "Visual analysis will be available once transcription service is configured",
    transcriptionMetadata: {
      method: "fallback",
      fileSize: 0,
      fileName: "fallback-transcription",
      processedAt: new Date().toISOString(),
    },
  };
}

export async function uploadToBunnyCDN(videoData: {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
}): Promise<CdnResult | null> {
  try {
    console.log("🐰 [DOWNLOAD] Uploading to CDN...");

    if (videoData.buffer.byteLength === 0) {
      console.error("❌ [DOWNLOAD] No video buffer data available");
      return null;
    }

    const buffer = Buffer.from(videoData.buffer);
    const result = await uploadToBunnyStream(buffer, videoData.filename ?? "video.mp4", videoData.mimeType);

    if (result) {
      console.log("✅ [DOWNLOAD] CDN upload successful");
    } else {
      console.error("❌ [DOWNLOAD] CDN upload failed");
    }

    return result;
  } catch (error) {
    console.error("❌ [DOWNLOAD] CDN upload error:", error);
    return null;
  }
}

// Simple wrapper for TikTok downloads using the new module
export async function downloadTikTokVideo(
  url: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  return await downloadTikTokVideoFromAPI(url);
}

// Export TikTok utilities for backwards compatibility
export { extractTikTokVideoId };

export function extractInstagramShortcode(url: string): string | null {
  // Decode URL first in case it's URL-encoded
  const decodedUrl = decodeURIComponent(url);
  console.log("🔍 [INSTAGRAM] Original URL:", url);
  console.log("🔍 [INSTAGRAM] Decoded URL:", decodedUrl);

  const match = decodedUrl.match(/(?:instagram\.com|instagr\.am)\/(?:p|reels?)\/([A-Za-z0-9_-]+)/);
  const shortcode = match ? match[1] : null;

  console.log("🆔 [INSTAGRAM] Extracted shortcode:", shortcode);
  return shortcode;
}

export async function downloadInstagramVideoWithMetrics(url: string): Promise<DownloadResult | null> {
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    console.error("❌ [DOWNLOAD] Could not extract Instagram shortcode");
    return null;
  }

  console.log("🆔 [DOWNLOAD] Instagram shortcode:", shortcode);

  try {
    console.log("📱 [DOWNLOAD] Fetching Instagram metadata...");
    const metadata = await fetchInstagramMetadata(shortcode);

    console.log("📊 [DOWNLOAD] Extracting metrics from metadata...");
    const metrics = extractMetricsFromMetadata(metadata);
    const additionalMetadata = extractAdditionalMetadata(metadata);

    console.log("🎥 [DOWNLOAD] Downloading video from versions...");
    const videoData = await downloadVideoFromVersions(metadata.video_versions, shortcode);

    if (!videoData) {
      console.log("❌ [DOWNLOAD] Failed to download video data");
      return null;
    }

    console.log("✅ [DOWNLOAD] Successfully downloaded Instagram video with metrics:", metrics);
    console.log("📋 [DOWNLOAD] Additional metadata:", additionalMetadata);
    return { videoData, metrics, additionalMetadata };
  } catch (error) {
    console.error("❌ [DOWNLOAD] Instagram download failed:", error);
    // Re-throw the error to provide clear feedback to the user
    throw error;
  }
}
