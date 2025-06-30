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

// Video processing utilities
export const processVideoUrl = async (
  videoUrl: string,
): Promise<{ success: boolean; transcript?: string; error?: string }> => {
  try {
    // Step 1: Download video
    console.log("🎬 [VIDEO_PROCESS] Starting video download...");
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

    // Step 2: Transcribe video using the downloaded buffer
    console.log("🎙️ [VIDEO_PROCESS] Starting transcription...");

    // Convert video buffer to File for transcription
    const uint8Array = new Uint8Array(downloadData.videoData.buffer);
    const blob = new Blob([uint8Array], { type: downloadData.videoData.mimeType });
    const file = new File([blob], downloadData.videoData.filename ?? "video.mp4", {
      type: downloadData.videoData.mimeType,
    });

    // Send video file to transcription API
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
    console.log("✅ [VIDEO_PROCESS] Transcription completed");

    return {
      success: true,
      transcript: transcribeData.transcript,
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
