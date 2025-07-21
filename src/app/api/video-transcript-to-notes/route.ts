import { NextRequest, NextResponse } from "next/server";

import { authenticateApiKey } from "@/lib/api-key-auth";
import { notesService } from "@/lib/services/notes-service";
import { VideoTranscriber } from "@/core/video/transcriber";

interface VideoTranscriptRequest {
  videoUrl: string;
  title?: string;
  includeTimestamps?: boolean;
}

interface VideoTranscriptResponse {
  success: boolean;
  noteId?: string;
  videoData?: {
    iframeUrl: string;
    platform: string;
    metadata: any;
  };
  transcriptData?: {
    transcript: string;
    components: {
      hook: string;
      bridge: string;
      nugget: string;
      wta: string;
    };
    metadata: any;
  };
  error?: string;
}

/**
 * Downloads video, transcribes it, and creates separate video and transcript notes
 */
async function processVideoForTranscription(videoUrl: string, userId: string, title?: string) {
  console.log("🎥 [Video Transcript API] Processing video:", videoUrl);

  try {
    // Step 1: Download video (leverage existing video downloader)
    const downloadResponse = await fetch(buildInternalUrl("/api/video/downloader"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: videoUrl }),
    });

    if (!downloadResponse.ok) {
      throw new Error("Failed to download video");
    }

    const downloadResult = await downloadResponse.json();
    if (!downloadResult.success) {
      throw new Error(downloadResult.details || "Video download failed");
    }

    console.log("✅ [Video Transcript API] Video downloaded successfully");

    // Step 2: Stream to Bunny CDN (leverage existing streaming functionality)
    const streamResponse = await fetch(buildInternalUrl("/api/video/stream"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoData: downloadResult.data.videoData,
        platform: downloadResult.data.platform,
      }),
    });

    if (!streamResponse.ok) {
      throw new Error("Failed to stream video to CDN");
    }

    const streamResult = await streamResponse.json();
    if (!streamResult.success) {
      throw new Error(streamResult.error || "Video streaming failed");
    }

    console.log("✅ [Video Transcript API] Video streamed to CDN");

    // Step 3: Transcribe the video
    console.log("🎙️ [Video Transcript API] Starting transcription...");

    const transcriptionResult = await VideoTranscriber.transcribeFromUrl(
      streamResult.data.iframeUrl,
      downloadResult.data.platform,
      {
        author: downloadResult.data.additionalMetadata?.author,
        description: downloadResult.data.additionalMetadata?.description,
        hashtags: downloadResult.data.additionalMetadata?.hashtags || [],
      },
    );

    if (!transcriptionResult.success) {
      throw new Error("Transcription failed");
    }

    console.log("✅ [Video Transcript API] Transcription completed");

    // Step 4: Create video note with iframe
    const videoNoteTitle =
      title || `${downloadResult.data.platform} Video - ${downloadResult.data.additionalMetadata?.author || "Unknown"}`;

    const videoNoteId = await notesService.createNote(userId, {
      title: videoNoteTitle,
      content: `<iframe src="${streamResult.data.iframeUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
      tags: [downloadResult.data.platform, "video", "media"],
      type: "text",
      source: "import",
      starred: false,
      metadata: {
        videoId:
          downloadResult.data.platform === "instagram"
            ? downloadResult.data.metadata?.shortcode
            : downloadResult.data.metadata?.videoId,
        channelName: downloadResult.data.additionalMetadata?.author,
        videoUrl: videoUrl,
        thumbnailUrl: downloadResult.data.thumbnailUrl,
        duration: downloadResult.data.additionalMetadata?.duration,
        platform: downloadResult.data.platform,
        iframeUrl: streamResult.data.iframeUrl,
        directUrl: streamResult.data.directUrl,
        guid: streamResult.data.guid,
      },
    });

    // Step 5: Create transcript note
    const transcriptNoteTitle = `${videoNoteTitle} - Transcript`;

    const transcriptNoteId = await notesService.createNote(userId, {
      title: transcriptNoteTitle,
      content: transcriptionResult.transcript,
      tags: [downloadResult.data.platform, "transcript", "text"],
      type: "text",
      source: "import",
      starred: false,
      metadata: {
        relatedVideoNoteId: videoNoteId,
        platform: downloadResult.data.platform,
        components: transcriptionResult.components,
        contentMetadata: transcriptionResult.contentMetadata,
        transcriptionMetadata: transcriptionResult.transcriptionMetadata,
        visualContext: transcriptionResult.visualContext,
      },
    });

    return {
      success: true,
      videoNoteId,
      transcriptNoteId,
      videoData: {
        iframeUrl: streamResult.data.iframeUrl,
        platform: downloadResult.data.platform,
        metadata: downloadResult.data.metadata,
      },
      transcriptData: {
        transcript: transcriptionResult.transcript,
        components: transcriptionResult.components,
        metadata: transcriptionResult.contentMetadata,
      },
    };
  } catch (error) {
    console.error("❌ [Video Transcript API] Processing failed:", error);
    throw error;
  }
}

/**
 * Helper function to build internal API URLs
 */
function buildInternalUrl(path: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}${path}`;
}

/**
 * POST /api/video-transcript-to-notes
 * Downloads video, transcribes it, and creates two separate notes:
 * 1. Video note with iframe embed
 * 2. Transcript note with full text and components
 */
export async function POST(request: NextRequest): Promise<NextResponse<VideoTranscriptResponse>> {
  try {
    console.log("🚀 [Video Transcript API] Starting video transcript to notes processing");

    // Step 1: Authentication
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<VideoTranscriptResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    console.log(`✅ [Video Transcript API] Authentication successful for user: ${user.email}`);

    // Step 2: Parse request body
    const body: VideoTranscriptRequest = await request.json();
    const { videoUrl, title, includeTimestamps = false } = body;

    if (!videoUrl?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Video URL is required",
        },
        { status: 400 },
      );
    }

    // Step 3: Validate platform (Instagram/TikTok only)
    const urlLower = videoUrl.toLowerCase();
    const isInstagram = urlLower.includes("instagram.com");
    const isTikTok = urlLower.includes("tiktok.com");

    if (!isInstagram && !isTikTok) {
      return NextResponse.json(
        {
          success: false,
          error: "Only Instagram and TikTok videos are supported",
        },
        { status: 400 },
      );
    }

    console.log(`🎯 [Video Transcript API] Processing ${isInstagram ? "Instagram" : "TikTok"} video`);

    // Step 4: Process video and create notes
    const result = await processVideoForTranscription(videoUrl, userId, title);

    console.log(`✅ [Video Transcript API] Successfully created notes:`, {
      videoNoteId: result.videoNoteId,
      transcriptNoteId: result.transcriptNoteId,
    });

    return NextResponse.json({
      success: true,
      noteId: result.transcriptNoteId, // Return transcript note ID as primary
      videoData: result.videoData,
      transcriptData: result.transcriptData,
    });
  } catch (error) {
    console.error("❌ [Video Transcript API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process video transcript",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/video-transcript-to-notes
 * Returns API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: "/api/video-transcript-to-notes",
    description: "Downloads Instagram/TikTok videos, transcribes them, and creates separate video and transcript notes",
    methods: ["POST"],
    authentication: "API Key (x-api-key header or Bearer token)",
    requestBody: {
      videoUrl: "string (required) - Instagram or TikTok video URL",
      title: "string (optional) - Custom title for the notes",
      includeTimestamps: "boolean (optional, default: false) - Include timestamps in transcript",
    },
    response: {
      success: "boolean",
      noteId: "string - ID of the transcript note",
      videoData: {
        iframeUrl: "string - CDN iframe URL",
        platform: "string - instagram or tiktok",
        metadata: "object - Platform-specific metadata",
      },
      transcriptData: {
        transcript: "string - Full transcript text",
        components: {
          hook: "string - Opening/hook component",
          bridge: "string - Transition component",
          nugget: "string - Main content component",
          wta: "string - Call-to-action component",
        },
        metadata: "object - Transcription metadata",
      },
    },
    example: {
      videoUrl: "https://www.instagram.com/reels/ABC123/",
      title: "My Custom Video Title",
      includeTimestamps: false,
    },
  });
}
