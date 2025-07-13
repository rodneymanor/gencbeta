/**
 * useVideoProcessing Hook
 * Centralized video processing hook for consistent video operations
 */

"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useVideoService } from "@/core/video";

export interface VideoProcessingOptions {
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

export interface VideoProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
  error: string | null;
  result: any | null;
  jobId: string | null;
}

export interface VideoProcessingControls {
  startProcessing: (videoUrl: string, options?: VideoProcessingOptions) => Promise<void>;
  cancelProcessing: () => void;
  retryProcessing: () => Promise<void>;
  reset: () => void;
}

export function useVideoProcessing(
  initialOptions: VideoProcessingOptions = {}
): [VideoProcessingState, VideoProcessingControls] {
  const [state, setState] = useState<VideoProcessingState>({
    isProcessing: false,
    progress: 0,
    message: "",
    error: null,
    result: null,
    jobId: null,
  });

  const { user } = useAuth();
  const { detectPlatform, downloadVideo, transcribeVideo, analyzeVideo } = useVideoService();

  const updateProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({ ...prev, progress, message }));
    initialOptions.onProgress?.(progress, message);
  }, [initialOptions]);

  const handleComplete = useCallback((result: any) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      progress: 100, 
      message: "Processing complete",
      result 
    }));
    initialOptions.onComplete?.(result);
  }, [initialOptions]);

  const handleError = useCallback((error: string) => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      error 
    }));
    initialOptions.onError?.(error);
  }, [initialOptions]);

  const startProcessing = useCallback(async (
    videoUrl: string, 
    options: VideoProcessingOptions = {}
  ) => {
    if (!user) {
      handleError("User not authenticated");
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 0, 
      message: "Initializing...",
      error: null,
      result: null 
    }));

    try {
      // Detect platform
      updateProgress(10, "Detecting platform...");
      const platform = detectPlatform(videoUrl);
      
      // Download video
      updateProgress(20, "Downloading video...");
      const videoPath = await downloadVideo(videoUrl, platform);
      
      // Transcribe video
      updateProgress(50, "Transcribing audio...");
      const transcript = await transcribeVideo(videoPath);
      
      // Analyze video
      updateProgress(80, "Analyzing content...");
      const analysis = await analyzeVideo(videoPath, transcript);
      
      // Complete
      updateProgress(100, "Processing complete");
      const result = {
        platform,
        videoPath,
        transcript,
        analysis,
        url: videoUrl,
      };
      
      handleComplete(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Processing failed";
      handleError(errorMessage);
    }
  }, [user, detectPlatform, downloadVideo, transcribeVideo, analyzeVideo, updateProgress, handleComplete, handleError]);

  const cancelProcessing = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      message: "Processing cancelled" 
    }));
  }, []);

  const retryProcessing = useCallback(async () => {
    if (state.jobId) {
      // Retry with existing job ID
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        progress: 0,
        message: "Retrying..." 
      }));
      
      // Implementation would depend on backend retry mechanism
      // For now, just reset and let user start again
      reset();
    }
  }, [state.jobId]);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: 0,
      message: "",
      error: null,
      result: null,
      jobId: null,
    });
  }, []);

  const controls: VideoProcessingControls = {
    startProcessing,
    cancelProcessing,
    retryProcessing,
    reset,
  };

  return [state, controls];
}

// Specialized hook for video URL processing
export function useVideoUrlProcessing(options: VideoProcessingOptions = {}) {
  return useVideoProcessing(options);
}

// Hook for batch video processing
export interface BatchVideoProcessingState {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  results: Array<{ url: string; result?: any; error?: string }>;
}

export function useBatchVideoProcessing() {
  const [batchState, setBatchState] = useState<BatchVideoProcessingState>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    results: [],
  });

  const [individualStates, setIndividualStates] = useState<Map<string, VideoProcessingState>>(new Map());

  const processBatch = useCallback(async (videoUrls: string[]) => {
    setBatchState({
      total: videoUrls.length,
      completed: 0,
      failed: 0,
      inProgress: videoUrls.length,
      results: [],
    });

    const results = await Promise.allSettled(
      videoUrls.map(async (url) => {
        try {
          // Process each video individually
          const [state, controls] = useVideoProcessing();
          await controls.startProcessing(url);
          
          return {
            url,
            result: state.result,
            error: state.error,
          };
        } catch (error) {
          return {
            url,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const processedResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          url: videoUrls[index],
          error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        };
      }
    });

    const completed = processedResults.filter(r => r.result).length;
    const failed = processedResults.filter(r => r.error).length;

    setBatchState({
      total: videoUrls.length,
      completed,
      failed,
      inProgress: 0,
      results: processedResults,
    });
  }, []);

  return {
    batchState,
    individualStates,
    processBatch,
  };
} 