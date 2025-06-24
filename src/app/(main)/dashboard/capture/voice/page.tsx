"use client";

import { useState, useEffect } from "react";

import { Mic, Play, Square, Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function VoiceRecordingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [hasRecording, setHasRecording] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setWaveformData((prev) => [...prev, Math.random() * 100]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setWaveformData([]);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
  };

  const resetRecording = () => {
    setIsRecording(false);
    setHasRecording(false);
    setRecordingTime(0);
    setWaveformData([]);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Voice Recording</h1>
        <p className="text-muted-foreground">Capture your ideas with audio recording</p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Button
                size="lg"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-24 w-24 rounded-full text-white ${
                  isRecording ? "animate-pulse bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              {isRecording && <div className="absolute inset-0 animate-ping rounded-full border-4 border-red-300" />}
            </div>

            <div className="space-y-2 text-center">
              <div className="font-mono text-lg">{formatTime(recordingTime)}</div>
              <Badge variant={isRecording ? "destructive" : "secondary"}>
                {isRecording ? "Recording..." : "Ready to Record"}
              </Badge>
            </div>

            {waveformData.length > 0 && (
              <div className="w-full max-w-md">
                <div className="bg-muted/30 flex h-16 items-end justify-center gap-1 rounded-lg p-4">
                  {waveformData.slice(-20).map((height, index) => (
                    <div
                      key={index}
                      className="bg-primary rounded-full transition-all duration-200"
                      style={{
                        height: `${Math.max(height * 0.4, 4)}px`,
                        width: "3px",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasRecording && !isRecording && (
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Play
                </Button>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Transcribe
                </Button>
                <Button variant="outline" onClick={resetRecording}>
                  Reset
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
