import { NextResponse } from "next/server";

import { uploadToBunnyStream } from "@/lib/bunny-stream";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata,
  extractAdditionalMetadata,
  downloadVideoFromVersions,
} from "@/lib/instagram-downloader";
import { transcribeVideoFile } from "@/lib/transcription";
import {
  downloadTikTokViaRapidAPI,
  downloadTikTokDirectFallback,
  downloadTikTokViaScraper,
} from "@/lib/video-downloader";

export interface DownloadResult {
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string };
  metrics?: { likes: number; views: number; shares: number; comments: number; saves: number };
  additionalMetadata?: { author: string; duration: number };
}

export interface CdnResult {
  cdnUrl: string;
  filename: string;
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
    const transcriptionResult = await transcribeVideoFile(file);

    return transcriptionResult;
  } catch (error) {
    console.error("❌ [DOWNLOAD] Transcription error:", error);
    return null;
  }
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

export async function downloadTikTokVideo(
  url: string,
): Promise<{ buffer: ArrayBuffer; size: number; mimeType: string; filename?: string } | null> {
  console.log("🎵 [DOWNLOAD] Downloading TikTok video...");

  const videoId = extractTikTokVideoId(url);
  if (!videoId) {
    console.error("❌ [DOWNLOAD] Could not extract TikTok video ID");
    return null;
  }

  console.log("🆔 [DOWNLOAD] TikTok video ID:", videoId);

  // Try different download methods
  const methods = [
    () => downloadTikTokViaRapidAPI(videoId),
    () => downloadTikTokDirectFallback(url, videoId),
    () => downloadTikTokViaScraper(url),
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result) {
        return result;
      }
    } catch (error) {
      console.log("❌ [DOWNLOAD] Method failed:", error);
    }
  }

  console.error("❌ [DOWNLOAD] All TikTok download methods failed");
  return null;
}

export function extractTikTokVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function extractInstagramShortcode(url: string): string | null {
  const match = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
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

    if (!metadata) {
      console.log("❌ [DOWNLOAD] No metadata returned, falling back to basic download");
      return await fallbackToBasicDownload();
    }

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
    console.error("❌ [DOWNLOAD] Instagram RapidAPI error:", error);
    console.log("🔄 [DOWNLOAD] Falling back to basic download...");
    return await fallbackToBasicDownload();
  }
}

async function fallbackToBasicDownload(): Promise<DownloadResult | null> {
  // Simplified fallback - just return null for now
  console.log("🔄 [DOWNLOAD] Basic download fallback not implemented");
  return null;
}
