/**
 * Video Downloader Service
 * Centralized video downloading for TikTok, Instagram, YouTube, and other platforms
 */

import { uploadToBunnyStream } from "@/lib/bunny-stream";
import {
  fetchInstagramMetadata,
  extractMetricsFromMetadata,
  extractAdditionalMetadata,
  downloadVideoFromVersions,
} from "@/lib/instagram-downloader";
import {
  downloadTikTokVideo as downloadTikTokVideoFromAPI,
  getTikTokAdditionalMetadata,
  getTikTokMetrics,
} from "@/lib/tiktok-downloader";

import { detectPlatform, type Platform } from "./platform-detector";

export interface VideoData {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename?: string;
}

export interface VideoMetrics {
  likes: number;
  views: number;
  shares: number;
  comments: number;
  saves: number;
}

export interface VideoMetadata {
  author: string;
  duration: number;
  description?: string;
  hashtags?: string[];
}

export interface DownloadResult {
  videoData: VideoData;
  metrics?: VideoMetrics;
  additionalMetadata?: VideoMetadata;
}

export interface CdnResult {
  success: boolean;
  iframeUrl?: string;
  directUrl?: string;
  guid?: string;
  error?: string;
}

/**
 * Downloads video from any supported platform
 * @param url - Video URL to download
 * @returns DownloadResult with video data, metrics, and metadata
 */
export async function downloadVideo(url: string): Promise<DownloadResult | null> {
  const platformInfo = detectPlatform(url);

  if (!platformInfo.platform || platformInfo.platform === "unknown") {
    throw new Error(`Unsupported platform for URL: ${url}`);
  }

  console.log(`🎥 [DOWNLOADER] Downloading from ${platformInfo.platform}...`);

  switch (platformInfo.platform) {
    case "tiktok":
      return await downloadTikTokVideo(url);
    case "instagram":
      return await downloadInstagramVideo(url);
    case "youtube":
      return await downloadYouTubeVideo(url);
    default:
      throw new Error(`Platform ${platformInfo.platform} not yet implemented`);
  }
}

/**
 * VideoDownloader service object for consistent API
 */
export const VideoDownloader = {
  /**
   * Downloads video from any supported platform
   * @param url - Video URL to download
   * @returns DownloadResult with video data, metrics, and metadata
   */
  async download(url: string): Promise<DownloadResult | null> {
    return downloadVideo(url);
  },

  /**
   * Detects the platform from a URL
   * @param url - Video URL to analyze
   * @returns Detected platform
   */
  detect(url: string) {
    const platformInfo = detectPlatform(url);
    return platformInfo.platform;
  },

  /**
   * Downloads and uploads video to CDN in one operation
   * @param url - Video URL to download
   * @returns Object with download result and CDN result
   */
  async downloadAndUpload(url: string) {
    return downloadAndUploadToCDN(url);
  },
};

/**
 * Downloads TikTok video with metadata
 * @param url - TikTok video URL
 * @returns DownloadResult with video data and TikTok-specific metadata
 */
export async function downloadTikTokVideo(url: string): Promise<DownloadResult | null> {
  try {
    console.log("📱 [DOWNLOADER] Downloading TikTok video...");

    const videoData = await downloadTikTokVideoFromAPI(url);
    if (!videoData) {
      console.error("❌ [DOWNLOADER] Failed to download TikTok video");
      return null;
    }

    // Get additional metadata in parallel
    const [additionalMetadata, metrics] = await Promise.allSettled([
      getTikTokAdditionalMetadata(url),
      getTikTokMetrics(url),
    ]);

    return {
      videoData,
      additionalMetadata: additionalMetadata.status === "fulfilled" ? additionalMetadata.value : undefined,
      metrics: metrics.status === "fulfilled" ? metrics.value : undefined,
    };
  } catch (error) {
    console.error("❌ [DOWNLOADER] TikTok download failed:", error);
    throw error;
  }
}

/**
 * Downloads Instagram video with metrics
 * @param url - Instagram video URL
 * @returns DownloadResult with video data and Instagram-specific metadata
 */
export async function downloadInstagramVideo(url: string): Promise<DownloadResult | null> {
  try {
    console.log("📱 [DOWNLOADER] Downloading Instagram video...");

    const { shortcode } = detectPlatform(url);
    if (!shortcode) {
      throw new Error("Could not extract Instagram shortcode from URL");
    }

    console.log("🆔 [DOWNLOADER] Instagram shortcode:", shortcode);

    // Fetch metadata first
    const metadata = await fetchInstagramMetadata(shortcode);
    const metrics = extractMetricsFromMetadata(metadata);
    const additionalMetadata = extractAdditionalMetadata(metadata);

    // Download video
    const videoData = await downloadVideoFromVersions(metadata.video_versions, shortcode);
    if (!videoData) {
      throw new Error("Failed to download video data from Instagram");
    }

    console.log("✅ [DOWNLOADER] Successfully downloaded Instagram video");
    return { videoData, metrics, additionalMetadata };
  } catch (error) {
    console.error("❌ [DOWNLOADER] Instagram download failed:", error);
    throw error;
  }
}

/**
 * Downloads YouTube video (placeholder for future implementation)
 * @param url - YouTube video URL
 * @returns DownloadResult with video data
 */
export async function downloadYouTubeVideo(url: string): Promise<DownloadResult | null> {
  // TODO: Implement YouTube video download
  throw new Error("YouTube video download not yet implemented");
}

/**
 * Uploads video data to CDN
 * @param videoData - Video data to upload
 * @returns CdnResult with upload status and URLs
 */
export async function uploadToCDN(videoData: VideoData): Promise<CdnResult> {
  try {
    console.log("🐰 [DOWNLOADER] Uploading to CDN...");

    if (videoData.buffer.byteLength === 0) {
      console.error("❌ [DOWNLOADER] No video buffer data available");
      return {
        success: false,
        error: "No video buffer data available",
      };
    }

    const buffer = Buffer.from(videoData.buffer);
    const result = await uploadToBunnyStream(buffer, videoData.filename ?? "video.mp4", videoData.mimeType);

    if (result) {
      console.log("✅ [DOWNLOADER] CDN upload successful");
      // Transform the bunny stream result into CdnResult format
      return {
        success: true,
        iframeUrl: result.cdnUrl,
        directUrl: result.cdnUrl, // For now, use the same URL
        guid: result.filename, // The filename is actually the GUID from Bunny
      };
    } else {
      console.error("❌ [DOWNLOADER] CDN upload failed");
      return {
        success: false,
        error: "Failed to upload to Bunny Stream",
      };
    }
  } catch (error) {
    console.error("❌ [DOWNLOADER] CDN upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

/**
 * Downloads and uploads video to CDN in one operation
 * @param url - Video URL to download
 * @returns Object with download result and CDN result
 */
export async function downloadAndUploadToCDN(url: string): Promise<{
  downloadResult: DownloadResult;
  cdnResult: CdnResult;
}> {
  const downloadResult = await downloadVideo(url);
  if (!downloadResult) {
    throw new Error("Failed to download video");
  }

  const cdnResult = await uploadToCDN(downloadResult.videoData);

  return {
    downloadResult,
    cdnResult,
  };
}

/**
 * Validates video data
 * @param videoData - Video data to validate
 * @returns True if video data is valid
 */
export function validateVideoData(videoData: VideoData): boolean {
  return (
    videoData.buffer &&
    videoData.buffer.byteLength > 0 &&
    videoData.size > 0 &&
    videoData.mimeType &&
    videoData.mimeType.startsWith("video/")
  );
}

/**
 * Gets video file size in MB
 * @param videoData - Video data
 * @returns File size in MB
 */
export function getVideoSizeMB(videoData: VideoData): number {
  return Math.round((videoData.size / 1024 / 1024) * 100) / 100;
}
