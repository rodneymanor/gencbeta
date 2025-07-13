// Simplified video processing using the comprehensive endpoint
interface VideoProcessResult {
  success: boolean;
  videoId?: string;
  iframe?: string;
  directUrl?: string;
  platform?: string;
  transcriptionStatus?: string;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Complete video processing workflow using the comprehensive endpoint
 * Handles: URL decoding, download, Bunny streaming, collection addition, transcription
 */
export const processAndAddVideo = async (
  videoUrl: string,
  collectionId: string,
  title?: string,
): Promise<VideoProcessResult> => {
  console.log("🚀 [VIDEO_PROCESS] Starting comprehensive video processing...");
  console.log("🔗 [VIDEO_PROCESS] URL:", videoUrl);
  console.log("📂 [VIDEO_PROCESS] Collection:", collectionId);

  try {
    const response = await fetch("/api/video/process-and-add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl,
        collectionId,
        title,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [VIDEO_PROCESS] Processing failed:", data);
      return {
        success: false,
        error: data.error ?? "Video processing failed",
        details: data.details,
      };
    }

    console.log("✅ [VIDEO_PROCESS] Processing successful:", data);
    return {
      success: true,
      videoId: data.videoId,
      iframe: data.iframe,
      directUrl: data.directUrl,
      platform: data.platform,
      transcriptionStatus: data.transcriptionStatus,
      message: data.message,
    };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Network error:", error);
    return {
      success: false,
      error: "Network error during video processing",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Keep existing interfaces for backwards compatibility
interface VideoDownloadResponse {
  success: boolean;
  platform: string;
  hostedOnCDN: boolean;
  // CDN-hosted video properties
  cdnUrl?: string;
  filename?: string;
  thumbnailUrl?: string;
  // Fallback: local video data
  videoData?: {
    buffer: number[];
    size: number;
    mimeType: string;
    filename: string;
  };
  // Transcription data (included if already transcribed)
  transcription?: TranscriptionResponse;
  metrics: {
    likes: number;
    views: number;
    shares: number;
    comments: number;
    saves: number;
  };
  additionalMetadata: {
    author: string;
    duration: number;
  };
  metadata: {
    originalUrl: string;
    platform: string;
    downloadedAt: string;
    readyForTranscription: boolean;
    transcriptionStatus?: "pending" | "completed" | "failed";
  };
}

interface TranscriptionResponse {
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

// Keep legacy functions for backwards compatibility but mark as deprecated
export const transcribeVideo = async (downloadResponse: VideoDownloadResponse): Promise<TranscriptionResponse> => {
  console.warn("⚠️ [DEPRECATED] transcribeVideo is deprecated. Use processAndAddVideo instead.");
  console.log("🔍 [ADD_VIDEO] Checking download response for transcription:", !!downloadResponse.transcription);
  console.log("🔍 [ADD_VIDEO] Transcription status:", downloadResponse.metadata.transcriptionStatus);
  console.log("🔍 [ADD_VIDEO] Download response keys:", Object.keys(downloadResponse));

  // If transcription is already included in the download response, return it
  if (downloadResponse.transcription) {
    console.log("✅ [ADD_VIDEO] Using existing transcription from download response");
    return downloadResponse.transcription;
  }

  // If transcription is pending (background processing), return a placeholder
  if (downloadResponse.metadata.transcriptionStatus === "pending") {
    console.log("⏳ [ADD_VIDEO] Transcription is processing in background, using placeholder");
    const { createPlaceholderTranscription } = await import("./video-processing-utils");
    return createPlaceholderTranscription(downloadResponse.platform, downloadResponse.additionalMetadata.author);
  }

  // Otherwise, transcribe as before (fallback for older workflow)
  if (downloadResponse.hostedOnCDN && downloadResponse.cdnUrl) {
    // For CDN-hosted videos, send the URL to transcription service
    console.log("🎥 [ADD_VIDEO] Transcribing CDN-hosted video:", downloadResponse.cdnUrl);

    const response = await fetch("/api/video/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoUrl: downloadResponse.cdnUrl,
        platform: downloadResponse.platform,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to transcribe video");
    }

    return response.json();
  } else if (downloadResponse.videoData) {
    // Fallback: handle local video data
    console.log("📁 [ADD_VIDEO] Transcribing local video data");

    const uint8Array = new Uint8Array(downloadResponse.videoData.buffer);
    const blob = new Blob([uint8Array], { type: downloadResponse.videoData.mimeType });
    const file = new File([blob], downloadResponse.videoData.filename, { type: downloadResponse.videoData.mimeType });

    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch("/api/video/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? "Failed to transcribe video");
    }

    return response.json();
  } else {
    throw new Error("No video data available for transcription");
  }
};

export const extractVideoThumbnail = async (downloadResponse: VideoDownloadResponse): Promise<string> => {
  console.warn(
    "⚠️ [DEPRECATED] extractVideoThumbnail is deprecated. Thumbnails are handled automatically in processAndAddVideo.",
  );

  console.log("🖼️ [ADD_VIDEO] Extracting thumbnail - checking for real thumbnail URL...");
  console.log("🖼️ [ADD_VIDEO] Thumbnail URL from API:", downloadResponse.thumbnailUrl ? "✅ Found" : "❌ Not found");

  // First priority: Use real thumbnail URL from the download response (Instagram API)
  if (downloadResponse.thumbnailUrl) {
    console.log("✅ [ADD_VIDEO] Using real thumbnail from API response:", downloadResponse.thumbnailUrl);
    return downloadResponse.thumbnailUrl;
  }

  // Fallback: Generate thumbnail from video
  console.log("⚠️ [ADD_VIDEO] No real thumbnail found, generating from video...");
  console.log("🖼️ [ADD_VIDEO] Hosted on CDN:", downloadResponse.hostedOnCDN);
  console.log("🖼️ [ADD_VIDEO] CDN URL:", downloadResponse.cdnUrl);

  if (downloadResponse.hostedOnCDN && downloadResponse.cdnUrl) {
    // For iframe URLs (like Bunny Stream), return a placeholder thumbnail
    if (downloadResponse.cdnUrl.includes("iframe.mediadelivery.net/embed")) {
      console.log("🖼️ [ADD_VIDEO] Using placeholder thumbnail for iframe URL");
      return generatePlaceholderThumbnail(downloadResponse.platform);
    }

    // For direct video URLs, generate thumbnail from URL
    console.log("🖼️ [ADD_VIDEO] Generating thumbnail from CDN URL");

    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.crossOrigin = "anonymous";
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
          resolve(thumbnailUrl);
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };

      video.onerror = () => {
        reject(new Error("Failed to load video from CDN"));
      };

      video.src = downloadResponse.cdnUrl!;
    });
  } else if (downloadResponse.videoData) {
    // Fallback: generate thumbnail from local video data
    console.log("📁 [ADD_VIDEO] Generating thumbnail from local video data");

    return new Promise((resolve, reject) => {
      const uint8Array = new Uint8Array(downloadResponse.videoData!.buffer);
      const blob = new Blob([uint8Array], { type: downloadResponse.videoData!.mimeType });
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
          URL.revokeObjectURL(video.src);
          resolve(thumbnailUrl);
        } else {
          reject(new Error("Failed to get canvas context"));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Failed to load video"));
      };

      video.src = URL.createObjectURL(blob);
    });
  } else {
    throw new Error("No video data available for thumbnail generation");
  }
};

const generatePlaceholderThumbnail = (platform: string): string => {
  const placeholders = {
    tiktok: "/images/tiktok-placeholder.jpg",
    instagram: "/images/instagram-placeholder.jpg",
    youtube: "/images/youtube-placeholder.jpg",
  };

  return placeholders[platform as keyof typeof placeholders] || "/images/video-placeholder.jpg";
};

const calculateEngagementRate = (metrics: VideoDownloadResponse["metrics"]): number => {
  if (metrics.views <= 0) return 0;
  return ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100;
};

const getVideoUrl = (downloadResponse: VideoDownloadResponse, originalUrl: string): string => {
  return downloadResponse.hostedOnCDN && downloadResponse.cdnUrl ? downloadResponse.cdnUrl : originalUrl;
};

const getVideoTitle = (transcriptionResponse: TranscriptionResponse): string => {
  return transcriptionResponse.contentMetadata.description || "Untitled Video";
};

const getVideoAuthor = (
  downloadResponse: VideoDownloadResponse,
  transcriptionResponse: TranscriptionResponse,
): string => {
  return downloadResponse.additionalMetadata.author || transcriptionResponse.contentMetadata.author || "Unknown";
};

// Legacy createVideoObject function - deprecated in favor of processAndAddVideo
export const createVideoObject = (
  downloadResponse: VideoDownloadResponse,
  transcriptionResponse: TranscriptionResponse,
  thumbnailUrl: string,
  originalUrl: string,
): Record<string, unknown> => {
  console.warn(
    "⚠️ [DEPRECATED] createVideoObject is deprecated. Video objects are created automatically in processAndAddVideo.",
  );

  return {
    url: originalUrl,
    title: transcriptionResponse.contentMetadata.description.substring(0, 100) ?? "Untitled Video",
    iframe: downloadResponse.cdnUrl ?? "",
    platform: downloadResponse.platform,
    author: downloadResponse.additionalMetadata.author,
    thumbnail: thumbnailUrl,
    transcript: transcriptionResponse.transcript,
    addedAt: new Date().toISOString(),
  };
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    return domain.includes("tiktok.com") || domain.includes("instagram.com") || domain.includes("youtube.com");
  } catch {
    return false;
  }
};

export type { VideoDownloadResponse, TranscriptionResponse };
