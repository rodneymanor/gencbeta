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

/**
 * Create a placeholder transcription response for videos being processed in background
 */
export function createPlaceholderTranscription(platform: string, author: string): TranscriptionResponse {
  return {
    success: true,
    transcript: "🔄 Transcription is being processed in the background. The video analysis will be available shortly.",
    platform: platform,
    components: {
      hook: "⏳ Analyzing video hook...",
      bridge: "⏳ Extracting bridge content...",
      nugget: "⏳ Identifying key insights...",
      wta: "⏳ Determining call-to-action...",
    },
    contentMetadata: {
      platform: platform as "TikTok" | "Instagram" | "YouTube" | "Unknown",
      author: author || "Unknown",
      description: "Video transcription in progress",
      source: "other",
      hashtags: [],
    },
    visualContext: "⏳ Visual analysis in progress - full details will be available once transcription completes.",
    transcriptionMetadata: {
      method: "background-pending",
      fileSize: 0,
      fileName: "background-transcription",
      processedAt: new Date().toISOString(),
    },
  };
}
