"use client";

import { useState, useEffect, useCallback } from "react";

import { RefreshCw, AlertCircle, CheckCircle, Loader2, Video } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { VideoProcessingState, processVideoUrl, detectPlatform } from "./types";

interface VideoProcessorProps {
  videoUrl: string;
  onTranscriptReady: (transcript: string) => void;
  onError: (error: string) => void;
}

const processingSteps = [
  { id: "download", label: "Downloading video", duration: 3000 },
  { id: "transcribe", label: "Transcribing audio", duration: 8000 },
  { id: "complete", label: "Generating scripts", duration: 1000 },
];

export function VideoProcessor({ videoUrl, onTranscriptReady, onError }: VideoProcessorProps) {
  const [processingState, setProcessingState] = useState<VideoProcessingState>({
    isProcessing: false,
    currentStep: "",
    error: null,
    retryable: false,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const platform = detectPlatform(videoUrl);

  const startProcessing = useCallback(async () => {
    setProcessingState({
      isProcessing: true,
      currentStep: "download",
      error: null,
      retryable: false,
    });
    setCurrentStepIndex(0);
    setStepProgress(0);

    try {
      // Simulate step progression
      for (let i = 0; i < processingSteps.length; i++) {
        const step = processingSteps[i];
        setCurrentStepIndex(i);
        setProcessingState((prev) => ({ ...prev, currentStep: step.id }));

        // Simulate progress within step
        const progressInterval = setInterval(() => {
          setStepProgress((prev) => {
            const newProgress = prev + 100 / (step.duration / 200);
            return Math.min(newProgress, 100);
          });
        }, 200);

        if (step.id === "transcribe") {
          // Actually process the video during transcription step
          const result = await processVideoUrl(videoUrl);

          clearInterval(progressInterval);
          setStepProgress(100);

          if (!result.success) {
            throw new Error(result.error ?? "Failed to process video");
          }

          // Wait a moment to show completion
          await new Promise((resolve) => setTimeout(resolve, 500));

          setProcessingState({
            isProcessing: false,
            currentStep: "complete",
            error: null,
            retryable: false,
          });

          onTranscriptReady(result.transcript ?? "");
          return;
        } else {
          // Simulate other steps
          await new Promise((resolve) => setTimeout(resolve, step.duration));
          clearInterval(progressInterval);
          setStepProgress(100);

          if (i < processingSteps.length - 1) {
            setStepProgress(0);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      setProcessingState({
        isProcessing: false,
        currentStep: "error",
        error: errorMessage,
        retryable: true,
      });

      onError(errorMessage);
    }
  }, [videoUrl, onTranscriptReady, onError]);

  const handleRetry = () => {
    startProcessing();
  };

  useEffect(() => {
    startProcessing();
  }, [startProcessing]);

  if (processingState.error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to process video: {processingState.error}</span>
            {processingState.retryable && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4 gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!processingState.isProcessing && processingState.currentStep === "complete") {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Video processed successfully! Generated script options based on the video content.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Info */}
      <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-4">
        <Video className="text-muted-foreground h-5 w-5" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Processing video</span>
            {platform && (
              <Badge variant="outline" className="text-xs capitalize">
                {platform}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">{videoUrl}</p>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Processing Progress</h4>

        <div className="space-y-3">
          {processingSteps.map((step, index) => {
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;

            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isActive ? "font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {isActive && <span className="text-muted-foreground text-xs">{Math.round(stepProgress)}%</span>}
                  </div>

                  {isActive && <Progress value={stepProgress} className="mt-1 h-1" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="bg-muted/30 rounded-lg border p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">
            Step {currentStepIndex + 1} of {processingSteps.length}
          </span>
        </div>
        <Progress value={((currentStepIndex + stepProgress / 100) / processingSteps.length) * 100} className="mt-2" />
      </div>
    </div>
  );
}
