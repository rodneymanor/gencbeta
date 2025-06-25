"use client";

import { useState, useCallback } from "react";

import { transcribeVideoFile, validateVideoFile } from "@/lib/transcription";
import { TranscriptionResponse } from "@/types/transcription";

export interface UseVideoTranscriptionReturn {
  transcription: TranscriptionResponse | null;
  isTranscribing: boolean;
  error: string | null;
  progress: number;
  transcribeVideo: (file: File) => Promise<void>;
  reset: () => void;
}

export function useVideoTranscription(): UseVideoTranscriptionReturn {
  const [transcription, setTranscription] = useState<TranscriptionResponse | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const transcribeVideo = useCallback(async (file: File) => {
    // Reset state
    setTranscription(null);
    setError(null);
    setProgress(0);

    // Validate file
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid video file");
      return;
    }

    setIsTranscribing(true);

    try {
      // Simulate progress updates
      setProgress(10);

      // Start transcription
      setProgress(30);
      const result = await transcribeVideoFile(file);

      setProgress(90);
      setTranscription(result);
      setProgress(100);

      console.log("✅ [HOOK] Video transcription completed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transcribe video";
      setError(errorMessage);
      console.error("❌ [HOOK] Video transcription failed:", errorMessage);
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscription(null);
    setError(null);
    setProgress(0);
    setIsTranscribing(false);
  }, []);

  return {
    transcription,
    isTranscribing,
    error,
    progress,
    transcribeVideo,
    reset,
  };
}
