"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Play, FileText, CheckCircle, XCircle, Clock } from "lucide-react";

interface VideoData {
  id: string;
  platform: "tiktok" | "instagram";
  video_url: string;
  thumbnail_url?: string;
  viewCount: number;
  likeCount: number;
  quality: string;
  title?: string;
  description?: string;
  author?: string;
  duration?: number;
  downloadStatus?: "pending" | "downloading" | "completed" | "failed";
  transcriptionStatus?: "pending" | "transcribing" | "completed" | "failed";
  downloadUrl?: string;
  transcriptionId?: string;
}

interface ProcessCreatorResponse {
  success: boolean;
  extractedVideos: VideoData[];
  totalFound: number;
  message: string;
  error?: string;
}

interface DownloadAllResponse {
  success: boolean;
  processedVideos: VideoData[];
  totalProcessed: number;
  totalFailed: number;
  message: string;
  error?: string;
}

export default function CreatorVideosPage() {
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [videoCount, setVideoCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [processedVideos, setProcessedVideos] = useState<VideoData[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleExtractVideos = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/process-creator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          platform,
          videoCount,
        }),
      });

      const data: ProcessCreatorResponse = await response.json();

      if (data.success) {
        setVideos(data.extractedVideos);
        setSuccess(data.message);
      } else {
        setError(data.error ?? "Failed to extract videos");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (videos.length === 0) {
      setError("No videos to process. Please extract videos first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/process-creator/download-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videos,
          creatorUsername: username,
          platform,
        }),
      });

      const data: DownloadAllResponse = await response.json();

      if (data.success) {
        setProcessedVideos(data.processedVideos);
        setSuccess(data.message);
      } else {
        setError(data.error ?? "Failed to process videos");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "downloading":
      case "transcribing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "downloading":
      case "transcribing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Creator Videos</h1>
          <p className="text-muted-foreground">
            Extract and process videos from TikTok and Instagram creators
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Extract Creator Videos</CardTitle>
          <CardDescription>
            Enter a creator's username to extract their videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={platform} onValueChange={(value: "tiktok" | "instagram") => setPlatform(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoCount">Video Count</Label>
              <Input
                id="videoCount"
                type="number"
                min="1"
                max="200"
                value={videoCount}
                onChange={(e) => setVideoCount(parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleExtractVideos} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Extract Videos
            </Button>
            
            {videos.length > 0 && (
              <Button 
                onClick={handleDownloadAll} 
                disabled={isProcessing}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Download & Transcribe All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Videos</CardTitle>
            <CardDescription>
              Downloading and transcribing videos...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={33} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              This may take several minutes depending on the number of videos
            </p>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      {(videos.length > 0 || processedVideos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Videos</CardTitle>
            <CardDescription>
              {processedVideos.length > 0 
                ? `${processedVideos.length} videos processed` 
                : `${videos.length} videos extracted`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(processedVideos.length > 0 ? processedVideos : videos).map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  {video.thumbnail_url && (
                    <div className="aspect-video bg-muted">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="capitalize">
                        {video.platform}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(video.downloadStatus || "pending")}
                        {getStatusIcon(video.transcriptionStatus || "pending")}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {video.title || `Video ${video.id}`}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span>👁️ {formatNumber(video.viewCount)}</span>
                      <span>❤️ {formatNumber(video.likeCount)}</span>
                      <span>⏱️ {video.duration}s</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Download:</span>
                        <Badge className={`text-xs ${getStatusColor(video.downloadStatus || "pending")}`}>
                          {video.downloadStatus || "pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Transcribe:</span>
                        <Badge className={`text-xs ${getStatusColor(video.transcriptionStatus || "pending")}`}>
                          {video.transcriptionStatus || "pending"}
                        </Badge>
                      </div>
                    </div>
                    
                    {video.downloadUrl && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="w-full">
                          <Play className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      </div>
                    )}
                    
                    {video.transcriptionId && (
                      <div className="mt-2">
                        <Button size="sm" variant="outline" className="w-full">
                          <FileText className="h-3 w-3 mr-1" />
                          View Transcript
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 