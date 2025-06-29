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

// Script generation utility
export const generateScriptContent = (idea: string, approach: string, length: string): string => {
  const isShort = length === "20";

  if (approach === "hook-focused") {
    return isShort
      ? `HOOK: Did you know that ${idea.toLowerCase()}? Here's the truth nobody talks about...

MAIN POINT: [Main insight or advice related to the idea]

CLOSER: And that's how you [benefit/outcome]. Try it and see the difference.`
      : `HOOK: If you've ever wondered about ${idea.toLowerCase()}, you're not alone. Here's what I discovered...

STORY: Last week, I [personal anecdote related to the idea]...

REVELATION: But here's what changed everything for me...

MAIN POINT: [Detailed insight or step-by-step advice]

CALL TO ACTION: Comment below if you've experienced this too, and follow for more insights like this.`;
  } else {
    return isShort
      ? `SCENE: Picture this - ${idea.toLowerCase()}.

CONFLICT: But here's the problem most people face...

SOLUTION: [Quick solution or insight]

RESULT: And that's the difference it makes.`
      : `OPENING: Let me tell you a story about ${idea.toLowerCase()}...

SETUP: [Background context and character introduction]

CONFLICT: But then something unexpected happened...

JOURNEY: [The process of overcoming the challenge]

RESOLUTION: [The outcome and lesson learned]

TAKEAWAY: The lesson? [Key insight for the audience]

ENGAGEMENT: What's your experience with this? Share in the comments!`;
  }
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

    console.log("✅ [VIDEO_PROCESS] Video downloaded successfully");

    // Step 2: Transcribe video
    console.log("🎙️ [VIDEO_PROCESS] Starting transcription...");
    const transcribeResponse = await fetch("/api/video/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
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
