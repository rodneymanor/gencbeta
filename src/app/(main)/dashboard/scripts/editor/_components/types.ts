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

export interface ScriptElements {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

export interface ScriptOption {
  id: string;
  title: string;
  content: string;
  elements?: ScriptElements;
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

// Helper function for fallback transcription
const transcribeFromBuffer = async (videoData: { buffer: ArrayBuffer; mimeType: string; filename?: string }) => {
  console.log("📁 [VIDEO_PROCESS] Using buffer transcription method...");

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
  console.log("✅ [VIDEO_PROCESS] Buffer transcription completed");

  return transcribeData.transcript;
};

// Video processing utilities - Simplified direct approach for script workflow
export const processVideoUrl = async (
  videoUrl: string,
): Promise<{ success: boolean; transcript?: string; error?: string }> => {
  try {
    console.log("🎬 [VIDEO_PROCESS] Starting direct video processing for scripts...");

    // Step 1: Download video directly (same as collections workflow)
    console.log("📥 [VIDEO_PROCESS] Step 1: Downloading video...");
    const downloadResponse = await fetch("/api/video/downloader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!downloadResponse.ok) {
      const errorData = await downloadResponse.json();
      throw new Error(errorData.error ?? "Failed to download video");
    }

    const downloadData = await downloadResponse.json();
    console.log("✅ [VIDEO_PROCESS] Video downloaded successfully");

    // Step 2: Transcribe using the video buffer directly
    console.log("🎙️ [VIDEO_PROCESS] Step 2: Starting transcription...");
    const transcript = await transcribeFromBuffer(downloadData.videoData);

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
