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
  console.log("🔍 [DEBUG] Full response structure:", JSON.stringify(data, null, 2));
  return data;
};

export const transcribeVideo = async (downloadResponse: VideoDownloadResponse): Promise<TranscriptionResponse> => {
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
    // For CDN-hosted videos, generate thumbnail from URL
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

export const createVideoObject = (
  downloadResponse: VideoDownloadResponse,
  transcriptionResponse: TranscriptionResponse,
  thumbnailUrl: string,
  originalUrl: string,
) => {
  const engagementRate =
    downloadResponse.metrics.views > 0
      ? ((downloadResponse.metrics.likes + downloadResponse.metrics.comments + downloadResponse.metrics.shares) /
          downloadResponse.metrics.views) *
        100
      : 0;

  return {
    url: downloadResponse.hostedOnCDN && downloadResponse.cdnUrl ? downloadResponse.cdnUrl : originalUrl,
    platform: downloadResponse.platform,
    thumbnailUrl: thumbnailUrl,
    title: transcriptionResponse.contentMetadata.description || "Untitled Video",
    author: downloadResponse.additionalMetadata.author || transcriptionResponse.contentMetadata.author || "Unknown",
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
    originalUrl: originalUrl, // Keep the original social media URL for reference
  };
};

export const validateUrl = (url: string): boolean => {
  const urlPattern = /^https?:\/\/.+/;
  if (!urlPattern.test(url)) return false;

  const supportedPlatforms = ["tiktok.com", "instagram.com"];
  return supportedPlatforms.some((platform) => url.toLowerCase().includes(platform));
};

export type { VideoDownloadResponse, TranscriptionResponse };
