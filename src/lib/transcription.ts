import { TranscriptionResponse, TranscriptionError } from "@/types/transcription";

/**
 * Transcribe a video file using the Gemini AI API
 */
export async function transcribeVideoFile(file: File, baseUrl?: string): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append("video", file);

  // Use absolute URL for server-side calls, relative for client-side
  const url = baseUrl ? `${baseUrl}/api/video/transcribe` : "/api/video/transcribe";

  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error: TranscriptionError = await response.json();
    throw new Error(error.error || "Failed to transcribe video");
  }

  return response.json();
}

/**
 * Validate video file for transcription
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
 * Format file size for display
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
 * Get video duration from file (requires browser File API)
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
 * Extract platform from video metadata or filename
 */
export function detectPlatformFromFile(file: File): string {
  const filename = file.name.toLowerCase();

  if (filename.includes("tiktok")) return "TikTok";
  if (filename.includes("instagram") || filename.includes("insta")) return "Instagram";
  if (filename.includes("youtube") || filename.includes("yt")) return "YouTube";

  return "Unknown";
}
