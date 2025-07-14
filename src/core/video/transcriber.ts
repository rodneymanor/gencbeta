/**
 * Video Transcriber Service
 * Centralized video transcription using Gemini/OpenAI APIs
 */

import { transcribeVideoFile } from "@/lib/transcription";

import type { VideoData } from "./downloader";
import type { Platform } from "./platform-detector";

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

export interface TranscriptionError {
  error: string;
  details?: string;
}

/**
 * Transcribes video data using AI services
 * @param videoData - Video data to transcribe
 * @param platform - Platform the video is from
 * @returns TranscriptionResult with transcript and analysis
 */
export async function transcribeVideoData(
  videoData: VideoData,
  platform: Platform,
): Promise<TranscriptionResult | null> {
  try {
    console.log("🎬 [TRANSCRIBER] Converting video data to file for transcription...");

    const uint8Array = new Uint8Array(videoData.buffer);
    const blob = new Blob([uint8Array], { type: videoData.mimeType });
    const file = new File([blob], videoData.filename ?? `${platform}-video.mp4`, {
      type: videoData.mimeType,
    });

    console.log("🎬 [TRANSCRIBER] Transcribing video file...");

    // Use localhost for server-side transcription calls
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${process.env.PORT ?? 3001}`;

    const transcriptionResult = await transcribeVideoFile(file, baseUrl);

    return transcriptionResult;
  } catch (error) {
    console.error("❌ [TRANSCRIBER] Transcription error:", error);
    console.log("🔄 [TRANSCRIBER] Using fallback transcription due to API error");

    // Return fallback transcription so video can still be added to collection
    return createFallbackTranscription(platform);
  }
}

/**
 * VideoTranscriber service object for consistent API
 */
export const VideoTranscriber = {
  /**
   * Transcribes video data using AI services
   * @param videoData - Video data to transcribe
   * @param platform - Platform the video is from
   * @returns TranscriptionResult with transcript and analysis
   */
  async transcribe(videoData: VideoData, platform: Platform): Promise<TranscriptionResult | null> {
    return transcribeVideoData(videoData, platform);
  },

  /**
   * Transcribes video from a URL
   * @param url - Video URL to transcribe
   * @param platform - Platform the video is from
   * @returns TranscriptionResult with transcript and analysis
   */
  async transcribeFromUrl(url: string, platform: Platform): Promise<TranscriptionResult | null> {
    // TODO: Implement URL-based transcription
    // This would download the video first, then transcribe it
    console.log(`[VideoTranscriber] Transcribing from URL: ${url}`);
    throw new Error("URL-based transcription not yet implemented");
  },

  /**
   * Validates video file for transcription
   * @param file - Video file to validate
   * @returns Validation result
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    return validateVideoFile(file);
  },
};

/**
 * Creates a fallback transcription when AI transcription fails
 * @param platform - Platform the video is from
 * @returns Fallback transcription result
 */
function createFallbackTranscription(platform: Platform): TranscriptionResult {
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

/**
 * Validates video file for transcription
 * @param file - Video file to validate
 * @returns Validation result
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ["video/mp4", "video/webm", "video/mov", "video/avi", "video/quicktime"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only MP4, WebM, MOV, and AVI video files are supported",
    };
  }

  // Check file size (20MB limit)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Video file must be smaller than 20MB",
    };
  }

  return { valid: true };
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const size = sizes[i];
  if (!size) return "0 Bytes";

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + size;
}

/**
 * Gets video duration from file (requires browser File API)
 * @param file - Video file
 * @returns Promise resolving to duration in seconds
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Extracts platform from video metadata or filename
 * @param file - Video file
 * @returns Detected platform
 */
export function detectPlatformFromFile(file: File): Platform {
  const filename = file.name.toLowerCase();

  if (filename.includes("tiktok")) return "tiktok";
  if (filename.includes("instagram") || filename.includes("insta")) return "instagram";
  if (filename.includes("youtube") || filename.includes("yt")) return "youtube";

  return "unknown";
}

/**
 * Analyzes transcript for content components (Hook, Bridge, Nugget, WTA)
 * @param transcript - Raw transcript text
 * @returns Extracted content components
 */
export function analyzeTranscriptComponents(transcript: string): {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
} {
  // Simple analysis - in production, this would use AI to extract components
  const lines = transcript.split("\n").filter((line) => line.trim());

  return {
    hook: lines[0] || "Hook not detected",
    bridge: lines[1] || "Bridge not detected",
    nugget: lines.slice(2, -1).join(" ") || "Main content not detected",
    wta: lines[lines.length - 1] ?? "Call to action not detected",
  };
}

/**
 * Extracts hashtags from transcript or description
 * @param text - Text to extract hashtags from
 * @returns Array of hashtags
 */
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  return text.match(hashtagRegex) || [];
}
