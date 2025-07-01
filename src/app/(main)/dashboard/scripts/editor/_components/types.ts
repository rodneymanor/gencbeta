export interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system" | "error";
  content: string;
  timestamp: Date;
  metadata?: {
    processingStep?: string;
    videoUrl?: string;
    platform?: string;
    retryable?: boolean;
  };
}

export interface ScriptOption {
  id: string;
  title: string;
  content: string;
}

export interface RefinementControls {
  toneOfVoice: string;
  voiceEngine: string;
  scriptLength: string;
}

export type ViewMode = "ab-comparison" | "editor";

export interface UrlParams {
  idea?: string;
  videoUrl?: string;
  mode: string;
  length: string;
  source?: string;
  inputType: "text" | "video";
}

export interface VideoProcessingState {
  isProcessing: boolean;
  currentStep: string;
  error: string | null;
  retryable: boolean;
}

// Generate unique IDs
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function for CDN transcription
const transcribeFromCDN = async (cdnUrl: string, platform: string) => {
  const transcribeResponse = await fetch("/api/transcribe-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoUrl: cdnUrl,
      platform: platform,
    }),
  });

  if (!transcribeResponse.ok) {
    const errorData = await transcribeResponse.json();
    throw new Error(errorData.error ?? "Failed to transcribe video");
  }

  const transcribeData = await transcribeResponse.json();
  console.log("✅ [VIDEO_PROCESS] Transcription completed from CDN");

  return transcribeData.transcript;
};

// Helper function for fallback transcription
const transcribeFromBuffer = async (videoData: { buffer: ArrayBuffer; mimeType: string; filename?: string }) => {
  console.log("📁 [VIDEO_PROCESS] Using fallback transcription method...");

  const uint8Array = new Uint8Array(videoData.buffer);
  const blob = new Blob([uint8Array], { type: videoData.mimeType });
  const file = new File([blob], videoData.filename ?? "video.mp4", {
    type: videoData.mimeType,
  });

  // Check file size before sending
  const maxSize = 20 * 1024 * 1024; // 20MB limit
  if (file.size > maxSize) {
    throw new Error(`Video file is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 20MB.`);
  }

  const formData = new FormData();
  formData.append("video", file);

  const transcribeResponse = await fetch("/api/video/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!transcribeResponse.ok) {
    const errorData = await transcribeResponse.json();
    throw new Error(errorData.error ?? "Failed to transcribe video");
  }

  const transcribeData = await transcribeResponse.json();
  console.log("✅ [VIDEO_PROCESS] Fallback transcription completed");

  return transcribeData.transcript;
};

// Video processing utilities - Updated to use efficient processing pipeline
export const processVideoUrl = async (
  videoUrl: string,
): Promise<{ success: boolean; transcript?: string; error?: string }> => {
  try {
    console.log("🎬 [VIDEO_PROCESS] Starting efficient video processing...");

    // Use the efficient video processing pipeline that streams to CDN first
    const processResponse = await fetch("/api/video/download-and-prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!processResponse.ok) {
      const errorData = await processResponse.json();
      throw new Error(errorData.error ?? "Failed to process video");
    }

    const processData = await processResponse.json();
    console.log("✅ [VIDEO_PROCESS] Video processed and prepared");

    // Step 2: Transcribe using the CDN URL (much more efficient)
    console.log("🎙️ [VIDEO_PROCESS] Starting transcription from CDN...");

    let transcript: string;

    if (processData.hostedOnCDN && processData.cdnUrl) {
      transcript = await transcribeFromCDN(processData.cdnUrl, processData.platform);
    } else if (processData.videoData) {
      transcript = await transcribeFromBuffer(processData.videoData);
    } else {
      throw new Error("No video data available for transcription");
    }

    return {
      success: true,
      transcript,
    };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

export const detectPlatform = (url: string): string | null => {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes("tiktok.com")) return "tiktok";
  if (normalizedUrl.includes("instagram.com")) return "instagram";
  if (normalizedUrl.includes("youtube.com") || normalizedUrl.includes("youtu.be")) return "youtube";

  return null;
};
