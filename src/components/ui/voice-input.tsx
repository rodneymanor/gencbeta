"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceInput({ onTranscription, onError, className, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processAudio(audioBlob);
        
        // Clean up the stream
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("🎤 [VOICE] Recording started");
    } catch (error) {
      console.error("❌ [VOICE] Error starting recording:", error);
      onError?.("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      console.log("⏹️ [VOICE] Recording stopped");
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      console.log("🔄 [VOICE] Processing audio...");
      
      // Convert blob to base64 for API transmission
      const base64Audio = await blobToBase64(audioBlob);
      
      // Send to our API endpoint for transcription
      const response = await fetch("/api/transcribe/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64Audio,
          format: "wav",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to transcribe audio");
      }

      const data = await response.json();
      
      if (data.success && data.transcription) {
        console.log("✅ [VOICE] Transcription successful");
        onTranscription(data.transcription);
      } else {
        throw new Error(data.error || "Failed to transcribe audio");
      }
    } catch (error) {
      console.error("❌ [VOICE] Error processing audio:", error);
      onError?.(error instanceof Error ? error.message : "Failed to process audio");
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
          const base64 = reader.result.split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Failed to convert blob to base64"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleClick = () => {
    if (disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        stopRecording();
      }
    };
  }, [isRecording]);

  const getIcon = () => {
    if (isProcessing) {
      return <Square className="h-4 w-4 animate-pulse" />;
    }
    if (isRecording) {
      return <MicOff className="h-4 w-4 text-red-500" />;
    }
    return <Mic className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isProcessing) return "Processing...";
    if (isRecording) return "Stop Recording";
    return "Start Recording";
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        isRecording && "animate-pulse",
        className,
      )}
    >
      {getIcon()}
      <span className="sr-only">{getButtonText()}</span>
    </Button>
  );
} 