interface VideoDownloadResponse {
  success: boolean;
  platform: string;
  hostedOnCDN: boolean;
  // CDN-hosted video properties
  cdnUrl?: string;
  filename?: string;
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

export const downloadVideo = async (videoUrl: string): Promise<VideoDownloadResponse> => {
  const response = await fetch("/api/download-video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Failed to download video");
  }

  const data = await response.json();
  console.log("📥 [ADD_VIDEO] Download response received:", data);
  console.log("🔍 [DEBUG] Download metrics:", data.metrics);
  return data;
};

export const transcribeVideo = async (downloadResponse: VideoDownloadResponse): Promise<TranscriptionResponse> => {
  // If transcription is already included in the download response, return it
  if (downloadResponse.transcription) {
    console.log("✅ [ADD_VIDEO] Using existing transcription from download response");
    return downloadResponse.transcription;
  }

  // Otherwise, transcribe as before (fallback for older workflow)
  if (downloadResponse.hostedOnCDN && downloadResponse.cdnUrl) {
    // For CDN-hosted videos, send the URL to transcription service
    console.log("🎥 [ADD_VIDEO] Transcribing CDN-hosted video:", downloadResponse.cdnUrl);

    const response = await fetch("/api/transcribe-video", {
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

    const response = await fetch("/api/transcribe-video", {
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

      video.src = downloadResponse.cdnUrl;
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
  // Create a simple canvas-based placeholder thumbnail
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 360;
  canvas.height = 640; // 9:16 aspect ratio

  if (ctx) {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 360, 640);
    if (platform === "instagram") {
      gradient.addColorStop(0, "#833AB4");
      gradient.addColorStop(0.5, "#FD1D1D");
      gradient.addColorStop(1, "#FCB045");
    } else {
      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(1, "#FF0050");
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 360, 640);

    // Add platform icon/text
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("📹", 180, 300);
    ctx.font = "16px Arial";
    ctx.fillText(platform.toUpperCase(), 180, 340);
    ctx.fillText("Video", 180, 360);
  }

  return canvas.toDataURL("image/jpeg", 0.8);
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

export const createVideoObject = (
  downloadResponse: VideoDownloadResponse,
  transcriptionResponse: TranscriptionResponse,
  thumbnailUrl: string,
  originalUrl: string,
): Record<string, unknown> => {
  const engagementRate = calculateEngagementRate(downloadResponse.metrics);

  const videoObject: Record<string, unknown> = {
    url: getVideoUrl(downloadResponse, originalUrl),
    platform: downloadResponse.platform,
    thumbnailUrl: thumbnailUrl,
    title: getVideoTitle(transcriptionResponse),
    author: getVideoAuthor(downloadResponse, transcriptionResponse),
    transcript: transcriptionResponse.transcript,
    components: transcriptionResponse.components,
    contentMetadata: transcriptionResponse.contentMetadata,
    visualContext: transcriptionResponse.visualContext,
    insights: {
      likes: downloadResponse.metrics.likes,
      comments: downloadResponse.metrics.comments,
      shares: downloadResponse.metrics.shares,
      views: downloadResponse.metrics.views,
      saves: downloadResponse.metrics.saves,
      engagementRate,
    },
    addedAt: new Date().toISOString(),
    fileSize: downloadResponse.videoData?.size ?? 0,
    duration: downloadResponse.additionalMetadata.duration,
    hostedOnCDN: downloadResponse.hostedOnCDN,
    originalUrl: originalUrl,
  };

  // If not hosted on CDN, include video data for direct playback
  if (!downloadResponse.hostedOnCDN && downloadResponse.videoData) {
    videoObject.videoData = downloadResponse.videoData;
  }

  return videoObject;
};

export const validateUrl = (url: string): boolean => {
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) return false;

  const supportedPlatforms = ["tiktok.com", "instagram.com"];
  return supportedPlatforms.some((platform) => url.toLowerCase().includes(platform));
};

export type { VideoDownloadResponse, TranscriptionResponse };
