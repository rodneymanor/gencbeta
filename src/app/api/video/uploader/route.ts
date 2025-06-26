import { NextRequest, NextResponse } from "next/server";

import { isBunnyStreamConfigured } from "@/lib/bunny-stream";
import { uploadToBunnyCDN } from "@/lib/video-processing-helpers";

export async function POST(request: NextRequest) {
  console.log("📤 [UPLOADER] Starting video upload service...");

  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      return await handleFileUpload(request);
    } else if (contentType?.includes("application/json")) {
      return await handleJsonUpload(request);
    } else {
      return NextResponse.json(
        {
          error: "Content-Type must be multipart/form-data or application/json",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("❌ [UPLOADER] Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload video to CDN",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function handleFileUpload(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video") as File;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!file) {
    console.error("❌ [UPLOADER] No video file provided");
    return NextResponse.json({ error: "Video file is required" }, { status: 400 });
  }

  console.log("📁 [UPLOADER] File upload details:");
  console.log("  - Name:", file.name);
  console.log("  - Size:", Math.round((file.size / 1024 / 1024) * 100) / 100, "MB");
  console.log("  - Type:", file.type);

  const arrayBuffer = await file.arrayBuffer();
  const videoData = {
    buffer: arrayBuffer,
    size: file.size,
    mimeType: file.type,
    filename: file.name,
  };

  return await uploadToConfiguredCDN(videoData);
}

async function handleJsonUpload(request: NextRequest) {
  const { videoBuffer, filename, mimeType } = await request.json();

  if (!videoBuffer || !filename) {
    console.error("❌ [UPLOADER] Missing required data - videoBuffer:", !!videoBuffer, "filename:", !!filename);
    return NextResponse.json({ error: "Missing video buffer or filename" }, { status: 400 });
  }

  console.log("📋 [UPLOADER] JSON upload details:");
  console.log("  - Filename:", filename);
  console.log("  - MIME type:", mimeType);
  console.log("  - Video buffer length:", videoBuffer?.length);

  // Convert array back to buffer
  const buffer = Buffer.from(videoBuffer);
  const videoData = {
    buffer: buffer.buffer,
    size: buffer.length,
    mimeType: mimeType ?? "video/mp4",
    filename,
  };

  return await uploadToConfiguredCDN(videoData);
}

async function uploadToConfiguredCDN(videoData: {
  buffer: ArrayBuffer;
  size: number;
  mimeType: string;
  filename: string;
}) {
  console.log("🔍 [UPLOADER] Checking CDN configuration...");
  console.log("  - Bunny Stream configured:", isBunnyStreamConfigured());

  if (!isBunnyStreamConfigured()) {
    console.log("⚠️ [UPLOADER] No CDN configured, returning error");
    return NextResponse.json(
      {
        error: "CDN not configured - please set up Bunny Stream environment variables",
      },
      { status: 503 },
    );
  }

  console.log("🚀 [UPLOADER] Uploading to Bunny Stream CDN...");
  const cdnResult = await uploadToBunnyCDN(videoData);

  if (!cdnResult) {
    console.error("❌ [UPLOADER] Failed to upload to CDN");
    return NextResponse.json({ error: "Failed to upload video to CDN" }, { status: 500 });
  }

  console.log("✅ [UPLOADER] Video uploaded successfully:", cdnResult.cdnUrl);

  return NextResponse.json({
    success: true,
    cdnUrl: cdnResult.cdnUrl,
    filename: cdnResult.filename,
    uploadedAt: new Date().toISOString(),
    metadata: {
      originalFilename: videoData.filename,
      size: videoData.size,
      mimeType: videoData.mimeType,
    },
  });
}
