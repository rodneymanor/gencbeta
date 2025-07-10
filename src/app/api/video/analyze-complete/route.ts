import { NextRequest, NextResponse } from "next/server";

import { buildInternalUrl } from "@/lib/utils/url";

interface AnalysisResult {
  transcript: string;
  components: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata: {
    platform: "TikTok" | "Instagram" | "YouTube" | "Unknown";
    author: string;
    description: string;
    source: "educational" | "entertainment" | "tutorial" | "lifestyle" | "business" | "other";
    hashtags: string[];
  };
  visualContext: string;
}

export async function POST(request: NextRequest) {
  console.log("🎯 [COMPLETE_ANALYSIS] Starting comprehensive video analysis...");

  try {
    const { videoData, videoUrl, fileName, fileSize } = await processRequestInput(request);

    console.log(
      "📊 [COMPLETE_ANALYSIS] Video size:",
      Math.round((videoData.byteLength / 1024 / 1024) * 100) / 100,
      "MB",
    );

    const result = await performCompleteAnalysis(videoData, videoUrl);

    return createAnalysisResponse(result, videoUrl, fileName, fileSize);
  } catch (error) {
    console.error("❌ [COMPLETE_ANALYSIS] Complete analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to complete video analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function processRequestInput(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return await processUrlInput(request);
  } else {
    return await processFileInput(request);
  }
}

async function processUrlInput(request: NextRequest) {
  const { videoUrl } = await request.json();
  if (!videoUrl) {
    throw new Error("Video URL is required");
  }

  console.log("🌐 [COMPLETE_ANALYSIS] Processing video from URL:", videoUrl);

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
  }

  const videoData = await response.arrayBuffer();
  return { videoData, videoUrl, fileName: undefined, fileSize: undefined };
}

async function processFileInput(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video") as File;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!file) {
    throw new Error("Video file is required");
  }

  console.log("📁 [COMPLETE_ANALYSIS] Processing video file:", file.name);

  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Video file is too large (max 20MB)");
  }

  const videoData = await file.arrayBuffer();
  return { videoData, videoUrl: undefined, fileName: file.name, fileSize: file.size };
}

async function performCompleteAnalysis(videoData: ArrayBuffer, videoUrl?: string): Promise<AnalysisResult> {
  console.log("🚀 [COMPLETE_ANALYSIS] Starting transcription task...");

  const transcriptRaw = await callTranscribeService(videoData, videoUrl);
  const transcript = transcriptRaw ?? "Transcription failed - unable to extract spoken content from video";

  // Visual analysis disabled
  const visualContext = "";

  console.log("🔄 [COMPLETE_ANALYSIS] Starting text-based analysis tasks...");

  // Detect platform from URL if available
  const platformFromUrl = detectPlatformFromUrl(videoUrl);

  const [scriptResult, metadataResult] = await Promise.allSettled([
    callScriptAnalysisService(transcript),
    callMetadataAnalysisService(transcript, videoUrl, platformFromUrl),
  ]);

  const components = getScriptResult(scriptResult);
  const contentMetadata = getMetadataResult(metadataResult);

  console.log("🎉 [COMPLETE_ANALYSIS] All analyses completed successfully");
  console.log("📊 [COMPLETE_ANALYSIS] Results summary:");
  console.log("  - Transcript length:", transcript.length, "characters");
  console.log("  - Platform detected:", contentMetadata.platform);
  // Visual context disabled

  return { transcript, components, contentMetadata, visualContext };
}

function detectPlatformFromUrl(videoUrl?: string): string | undefined {
  if (!videoUrl) return undefined;

  const url = videoUrl.toLowerCase();
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";

  return undefined;
}

function getTranscriptResult(transcriptResult: PromiseSettledResult<string | null>): string {
  if (transcriptResult.status === "fulfilled" && transcriptResult.value) {
    console.log("✅ [COMPLETE_ANALYSIS] Transcription completed");
    return transcriptResult.value;
  } else {
    console.log("⚠️ [COMPLETE_ANALYSIS] Transcription failed, using fallback");
    return "Transcription failed - unable to extract spoken content from video";
  }
}

function getVisualResult(visualResult: PromiseSettledResult<string | null>): string {
  if (visualResult.status === "fulfilled" && visualResult.value) {
    console.log("✅ [COMPLETE_ANALYSIS] Visual analysis completed");
    return visualResult.value;
  } else {
    console.log("⚠️ [COMPLETE_ANALYSIS] Visual analysis failed, using fallback");
    return "Visual analysis failed - unable to extract visual context from video";
  }
}

function getScriptResult(
  scriptResult: PromiseSettledResult<AnalysisResult["components"] | null>,
): AnalysisResult["components"] {
  if (scriptResult.status === "fulfilled" && scriptResult.value) {
    console.log("✅ [COMPLETE_ANALYSIS] Script analysis completed");
    return scriptResult.value;
  } else {
    console.log("⚠️ [COMPLETE_ANALYSIS] Script analysis failed, using fallback");
    return {
      hook: "Unable to extract hook from content",
      bridge: "Unable to extract bridge from content",
      nugget: "Unable to extract golden nugget from content",
      wta: "Unable to extract WTA from content",
    };
  }
}

function getMetadataResult(
  metadataResult: PromiseSettledResult<AnalysisResult["contentMetadata"] | null>,
): AnalysisResult["contentMetadata"] {
  if (metadataResult.status === "fulfilled" && metadataResult.value) {
    console.log("✅ [COMPLETE_ANALYSIS] Metadata analysis completed");
    return metadataResult.value;
  } else {
    console.log("⚠️ [COMPLETE_ANALYSIS] Metadata analysis failed, using fallback");
    return {
      platform: "Unknown",
      author: "Unknown",
      description: "Video content analysis - metadata extraction failed",
      source: "other",
      hashtags: [],
    };
  }
}

function createAnalysisResponse(result: AnalysisResult, videoUrl?: string, fileName?: string, fileSize?: number) {
  return NextResponse.json({
    success: true,
    ...result,
    platform: result.contentMetadata.platform, // For backward compatibility
    transcriptionMetadata: {
      method: videoUrl ? "url" : "file",
      fileName,
      fileSize,
      videoUrl,
      processedAt: new Date().toISOString(),
    },
  });
}

async function callTranscribeService(videoData: ArrayBuffer, videoUrl?: string): Promise<string | null> {
  try {
    const response = await fetch(buildInternalUrl(`/api/video/transcribe`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Transcribe service error:", error);
    return null;
  }
}

async function callScriptAnalysisService(transcript: string): Promise<AnalysisResult["components"] | null> {
  try {
    const response = await fetch(buildInternalUrl(`/api/video/analyze-script`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.components;
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Script analysis service error:", error);
    return null;
  }
}

async function callMetadataAnalysisService(
  transcript: string,
  videoUrl?: string,
  platform?: string,
): Promise<AnalysisResult["contentMetadata"] | null> {
  try {
    const response = await fetch(buildInternalUrl(`/api/video/analyze-metadata`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, videoUrl, platform }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.metadata;
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Metadata analysis service error:", error);
    return null;
  }
}

async function callVisualAnalysisService(videoData: ArrayBuffer): Promise<string | null> {
  try {
    const formData = new FormData();
    const blob = new Blob([videoData], { type: "video/mp4" });
    formData.append("video", blob, "video.mp4");

    const response = await fetch(buildInternalUrl("/api/video/analyze-visuals"), {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.visualContext;
  } catch (error) {
    console.error("❌ [ORCHESTRATOR] Visual analysis service error:", error);
    return null;
  }
}
