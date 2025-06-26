"use client";

import { useState, useEffect, useRef } from "react";

import { Mic, Square, Play, Pause, Download, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface VoiceRecorderProps {
  onSave: (audioBlob: Blob, duration: number, transcript?: string) => void;
  onCancel: () => void;
}

// eslint-disable-next-line complexity
export function VoiceRecorder({ onSave, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Stop all tracks to release microphone
      stream.getTracks().forEach((track) => track.stop());
    };
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
      // Generate mock waveform data
      setWaveformData((prev) => [...prev, Math.random() * 100]);
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupMediaRecorder(stream);

      mediaRecorderRef.current!.start();
      setIsRecording(true);
      setRecordingTime(0);
      setWaveformData([]);
      startTimer();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        // Resume timer
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
          setWaveformData((prev) => [...prev, Math.random() * 100]);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio(audioUrl);
        audioElementRef.current.onended = () => setIsPlaying(false);
      }

      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSave = () => {
    if (audioUrl && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      onSave(audioBlob, recordingTime);
    }
  };

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    setWaveformData([]);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Voice Note Recorder</h3>
            <p className="text-muted-foreground text-sm">Record your ideas with audio</p>
          </div>

          <div className="relative">
            <Button
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={audioUrl !== null && !isRecording}
              className={`h-20 w-20 rounded-full text-white ${
                isRecording && !isPaused
                  ? "animate-pulse bg-red-500 hover:bg-red-600"
                  : isRecording && isPaused
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            {isRecording && !isPaused && (
              <div className="absolute inset-0 animate-ping rounded-full border-4 border-red-300" />
            )}
          </div>

          <div className="space-y-2 text-center">
            <div className="font-mono text-xl">{formatTime(recordingTime)}</div>
            <Badge variant={isRecording ? (isPaused ? "secondary" : "destructive") : "outline"}>
              {isRecording ? (isPaused ? "Paused" : "Recording...") : audioUrl ? "Ready to Save" : "Ready to Record"}
            </Badge>
          </div>

          {isRecording && (
            <Button variant="outline" onClick={pauseRecording} className="gap-2">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
          )}

          {waveformData.length > 0 && (
            <div className="w-full max-w-md">
              <div className="bg-muted/30 flex h-16 items-end justify-center gap-1 rounded-lg p-4">
                {waveformData.slice(-30).map((height, index) => (
                  <div
                    key={index}
                    className="bg-primary rounded-full transition-all duration-200"
                    style={{
                      height: `${Math.max(height * 0.4, 4)}px`,
                      width: "2px",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={playAudio} className="gap-2">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>

              <Button onClick={handleSave} className="gap-2">
                <Download className="h-4 w-4" />
                Save Voice Note
              </Button>

              <Button variant="outline" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
