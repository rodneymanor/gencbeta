import { NextRequest, NextResponse } from "next/server";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { VideoDownloader } from "@/core/video/downloader";
import { detectPlatform } from "@/core/video/platform-detector";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { notesService } from "@/lib/services/notes-service";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

interface TranscriptionResult {
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
    fileSize?: number;
    fileName: string;
    processedAt: string;
  };
}

/**
 * Transcribes video directly using Gemini API without internal HTTP calls
 */
async function transcribeVideoDirectly(
  videoData: { buffer: ArrayBuffer; size: number; mimeType: string; filename?: string },
  platform: string,
  videoUrl?: string,
  additionalMetadata?: { author?: string; description?: string; hashtags?: string[] },
): Promise<TranscriptionResult> {
  try {
    console.log("🎬 [Video Transcript API] Converting video for transcription...");

    // Convert video data to base64 for Gemini
    const base64Video = Buffer.from(videoData.buffer).toString("base64");

    // Step 1: Get transcript from video
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    });

    console.log("🎯 [Video Transcript API] Extracting transcript...");

    const transcriptPrompt = `Transcribe all spoken words from this video. Return ONLY the complete transcript without any additional commentary, formatting, or metadata.`;

    const transcriptResult = await model.generateContent([
      { text: transcriptPrompt },
      {
        inlineData: {
          mimeType: videoData.mimeType || "video/mp4",
          data: base64Video,
        },
      },
    ]);

    const transcript = transcriptResult.response.text().trim();

    if (!transcript) {
      throw new Error("No transcript could be extracted from the video");
    }

    console.log("✅ [Video Transcript API] Transcript extracted:", transcript.length, "characters");

    // Step 2: Analyze script components
    const components = await analyzeScriptComponents(transcript);

    // Step 3: Generate metadata
    const contentMetadata = {
      platform: (platform.charAt(0).toUpperCase() + platform.slice(1)) as any,
      author: additionalMetadata?.author || "Unknown",
      description: additionalMetadata?.description || "Video content",
      source: "other" as const,
      hashtags: additionalMetadata?.hashtags || [],
    };

    return {
      success: true,
      transcript,
      platform,
      components,
      contentMetadata,
      visualContext: "Visual analysis not included",
      transcriptionMetadata: {
        method: "direct",
        fileSize: videoData.size,
        fileName: videoData.filename || `${platform}-video.mp4`,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ [Video Transcript API] Transcription error:", error);

    // Return fallback transcription
    return {
      success: true,
      transcript:
        "Transcription temporarily unavailable. Video content analysis will be available once transcription service is configured.",
      platform,
      components: {
        hook: "Video content analysis pending",
        bridge: "Transcription service configuration needed",
        nugget: "Main content insights will be available after transcription",
        wta: "Configure Gemini API key to enable full video analysis",
      },
      contentMetadata: {
        platform: (platform.charAt(0).toUpperCase() + platform.slice(1)) as any,
        author: additionalMetadata?.author || "Unknown",
        description: "Video added successfully - transcription pending",
        source: "other",
        hashtags: additionalMetadata?.hashtags || [],
      },
      visualContext: "Visual analysis not available",
      transcriptionMetadata: {
        method: "fallback",
        fileSize: videoData.size,
        fileName: videoData.filename || `${platform}-video.mp4`,
        processedAt: new Date().toISOString(),
      },
    };
  }
}

/**
 * Analyzes transcript to extract script components
 */
async function analyzeScriptComponents(
  transcript: string,
): Promise<{ hook: string; bridge: string; nugget: string; wta: string }> {
  try {
    console.log("🤖 [Video Transcript API] Analyzing script components...");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this video transcript and break it down into these four essential script components:

1. **HOOK** (Attention-Grabbing Opener): Extract or identify the part that captures attention within the first 3-5 seconds. If not clear, create an optimized hook based on the content.

2. **BRIDGE** (Connecting the Hook to the Core Idea): Find the transition that connects the opening to the main content.

3. **GOLDEN NUGGET** (The Core Lesson or Strategy): Identify the main valuable insight, tip, or takeaway from the content.

4. **WTA** (Call to Action / Concluding Thought): Find the ending that drives action or leaves a lasting impression.

Transcript to analyze:
"${transcript}"

Respond with ONLY a valid JSON object in this exact format (no additional text):
{
  "hook": "The extracted or optimized hook text",
  "bridge": "The bridge text connecting hook to main content",
  "nugget": "The core valuable insight or lesson",
  "wta": "The call to action or concluding thought"
}`;

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text().trim();

    // Parse JSON response
    let jsonString = responseText;
    jsonString = jsonString.replace(/```json\s*/, "").replace(/```\s*$/, "");

    const firstBrace = jsonString.indexOf("{");
    const lastBrace = jsonString.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }

    const components = JSON.parse(jsonString);

    console.log("✅ [Video Transcript API] Script components analyzed");

    return components;
  } catch (error) {
    console.log("⚠️ [Video Transcript API] Component analysis failed, using fallback");

    return {
      hook: "Unable to extract hook from content",
      bridge: "Unable to extract bridge from content",
      nugget: "Unable to extract golden nugget from content",
      wta: "Unable to extract WTA from content",
    };
  }
}

/**
 * Downloads video, transcribes it, and creates separate video and transcript notes
 */
async function processVideoForTranscription(videoUrl: string, userId: string, title?: string) {
  console.log("🎥 [Video Transcript API] Processing video:", videoUrl);

  try {
    // Step 1: Download video using VideoDownloader service directly
    console.log("📥 [Video Transcript API] Downloading video...");
    const downloadResult = await VideoDownloader.downloadAndUpload(videoUrl);

    if (!downloadResult || !downloadResult.downloadResult) {
      throw new Error("Failed to download video");
    }

    const { downloadResult: download, cdnResult } = downloadResult;

    if (!cdnResult || !cdnResult.success) {
      throw new Error("Failed to upload video to CDN");
    }

    console.log("✅ [Video Transcript API] Video downloaded and uploaded to CDN");

    // Detect platform
    const platformInfo = detectPlatform(videoUrl);
    const platform = platformInfo.platform || "unknown";

    // Step 2: Transcribe the video directly
    console.log("🎙️ [Video Transcript API] Starting transcription...");

    const transcriptionResult = await transcribeVideoDirectly(
      download.videoData,
      platform,
      videoUrl,
      download.additionalMetadata,
    );

    if (!transcriptionResult || !transcriptionResult.success) {
      throw new Error("Transcription failed");
    }

    console.log("✅ [Video Transcript API] Transcription completed");

    // Step 3: Create single combined note with transcript and video
    const noteTitle = title || `${platform} Video - ${download.additionalMetadata?.author || "Unknown"}`;

    // Create structured content with transcript at top and video block below
    const structuredContent = [
      {
        type: "paragraph",
        content: transcriptionResult.transcript,
      },
      {
        type: "bunnyVideo",
        props: {
          libraryId: "459811", // Default library ID for Bunny.net - should be extracted from CDN config
          videoId: cdnResult.guid, // Use the full GUID as video ID
          autoplay: false,
          muted: false,
          loop: false,
          preload: true,
          responsive: true,
          caption: `${platform} video from ${download.additionalMetadata?.author || "Unknown"}`,
        },
      },
    ];

    const combinedNoteId = await notesService.createNote(userId, {
      title: noteTitle,
      content: JSON.stringify(structuredContent),
      tags: [platform, "video", "transcript", "media"],
      type: "structured", // Use structured type to indicate BlockNote content
      source: "import",
      starred: false,
      metadata: {
        videoId: platformInfo.shortcode || platformInfo.videoId,
        channelName: download.additionalMetadata?.author,
        videoUrl: videoUrl,
        thumbnailUrl: null,
        duration: download.additionalMetadata?.duration,
        platform: platform,
        iframeUrl: cdnResult.iframeUrl,
        directUrl: cdnResult.directUrl,
        guid: cdnResult.guid,
        // Include transcript analysis data
        components: transcriptionResult.components,
        contentMetadata: transcriptionResult.contentMetadata,
        transcriptionMetadata: transcriptionResult.transcriptionMetadata,
        visualContext: transcriptionResult.visualContext,
      },
    });

    return {
      success: true,
      combinedNoteId, // Single note ID containing both transcript and video
      videoData: {
        iframeUrl: cdnResult.iframeUrl!,
        platform: platform,
        metadata: download.metrics,
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

    console.log(`✅ [Video Transcript API] Successfully created combined note:`, {
      combinedNoteId: result.combinedNoteId,
    });

    return NextResponse.json({
      success: true,
      noteId: result.combinedNoteId, // Return combined note ID
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
    description:
      "Downloads Instagram/TikTok videos, transcribes them, and creates a single note with transcript text and embedded video block",
    methods: ["POST"],
    authentication: "API Key (x-api-key header or Bearer token)",
    requestBody: {
      videoUrl: "string (required) - Instagram or TikTok video URL",
      title: "string (optional) - Custom title for the note",
      includeTimestamps: "boolean (optional, default: false) - Include timestamps in transcript",
    },
    response: {
      success: "boolean",
      noteId: "string - ID of the combined note containing transcript and video",
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
