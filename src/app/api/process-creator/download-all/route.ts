import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";

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

interface DownloadAllRequest {
  videos: VideoData[];
  creatorUsername: string;
  platform: "tiktok" | "instagram";
}

interface DownloadAllResponse {
  success: boolean;
  processedVideos: VideoData[];
  totalProcessed: number;
  totalFailed: number;
  message: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateApiKey(request);

    // Check if authResult is a NextResponse (error)
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log("🎬 [DOWNLOAD_ALL] Starting batch video processing...");

    const body: DownloadAllRequest = await request.json();
    const { videos, creatorUsername, platform } = body;

    // Validate input
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Videos array is required and must not be empty" 
        },
        { status: 400 }
      );
    }

    if (!creatorUsername || !platform) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Creator username and platform are required" 
        },
        { status: 400 }
      );
    }

    console.log(`🎬 [DOWNLOAD_ALL] Processing ${videos.length} videos for @${creatorUsername} on ${platform}`);

    const processedVideos: VideoData[] = [];
    let totalFailed = 0;

    // Process videos sequentially to avoid overwhelming the APIs
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      console.log(`🎬 [DOWNLOAD_ALL] Processing video ${i + 1}/${videos.length}: ${video.id}`);

      try {
        // Step 1: Download the video
        const updatedVideo = await downloadVideo(video);
        
        // Step 2: Transcribe the video (if download was successful)
        if (updatedVideo.downloadStatus === "completed" && updatedVideo.downloadUrl) {
          const finalVideo = await transcribeVideo(updatedVideo);
          processedVideos.push(finalVideo);
        } else {
          processedVideos.push(updatedVideo);
          totalFailed++;
        }

        // Add delay between requests to be respectful to APIs
        if (i < videos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }

      } catch (error) {
        console.error(`❌ [DOWNLOAD_ALL] Failed to process video ${video.id}:`, error);
        
        const failedVideo: VideoData = {
          ...video,
          downloadStatus: "failed",
          transcriptionStatus: "failed"
        };
        
        processedVideos.push(failedVideo);
        totalFailed++;
      }
    }

    const totalProcessed = processedVideos.length - totalFailed;

    console.log(`✅ [DOWNLOAD_ALL] Completed processing. ${totalProcessed} successful, ${totalFailed} failed`);

    const response: DownloadAllResponse = {
      success: true,
      processedVideos,
      totalProcessed,
      totalFailed,
      message: `Successfully processed ${totalProcessed} videos for @${creatorUsername}. ${totalFailed} videos failed.`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("🔥 [DOWNLOAD_ALL] Failed to process videos:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process videos"
      },
      { status: 500 }
    );
  }
}

async function downloadVideo(video: VideoData): Promise<VideoData> {
  try {
    console.log(`📥 [DOWNLOAD] Downloading video: ${video.id}`);
    
    const updatedVideo: VideoData = {
      ...video,
      downloadStatus: "downloading"
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/video/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || 'internal_key'}` // Use internal key for server-to-server calls
      },
      body: JSON.stringify({
        url: video.video_url
      })
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const downloadResult = await response.json();
    
    if (downloadResult.success && downloadResult.videoData) {
      return {
        ...updatedVideo,
        downloadStatus: "completed",
        downloadUrl: downloadResult.videoData.cdnUrl || downloadResult.videoData.url
      };
    } else {
      throw new Error(downloadResult.error || "Download failed");
    }

  } catch (error) {
    console.error(`❌ [DOWNLOAD] Failed to download video ${video.id}:`, error);
    return {
      ...video,
      downloadStatus: "failed"
    };
  }
}

async function transcribeVideo(video: VideoData): Promise<VideoData> {
  try {
    console.log(`🎤 [TRANSCRIBE] Transcribing video: ${video.id}`);
    
    const updatedVideo: VideoData = {
      ...video,
      transcriptionStatus: "transcribing"
    };

    if (!video.downloadUrl) {
      throw new Error("No download URL available for transcription");
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/video/transcribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTERNAL_API_KEY || 'internal_key'}` // Use internal key for server-to-server calls
      },
      body: JSON.stringify({
        videoUrl: video.downloadUrl,
        platform: video.platform
      })
    });

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    const transcriptionResult = await response.json();
    
    if (transcriptionResult.success) {
      return {
        ...updatedVideo,
        transcriptionStatus: "completed",
        transcriptionId: transcriptionResult.transcriptionId || `trans_${video.id}`
      };
    } else {
      throw new Error(transcriptionResult.error || "Transcription failed");
    }

  } catch (error) {
    console.error(`❌ [TRANSCRIBE] Failed to transcribe video ${video.id}:`, error);
    return {
      ...video,
      transcriptionStatus: "failed"
    };
  }
} 