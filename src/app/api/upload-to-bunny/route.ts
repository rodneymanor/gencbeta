import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🐰 [BUNNY] Starting video upload to Bunny.net...");

  try {
    const { videoBuffer, filename, mimeType } = await request.json();

    if (!videoBuffer || !filename) {
      return NextResponse.json({ error: "Missing video buffer or filename" }, { status: 400 });
    }

    // Convert array back to buffer
    const buffer = Buffer.from(videoBuffer);
    console.log(
      "📁 [BUNNY] Processing file:",
      filename,
      "Size:",
      Math.round((buffer.length / 1024 / 1024) * 100) / 100,
      "MB",
    );

    const bunnyResult = await uploadToBunnyNet(buffer, filename, mimeType);

    if (!bunnyResult) {
      console.error("❌ [BUNNY] Failed to upload to Bunny.net");
      return NextResponse.json({ error: "Failed to upload video to CDN" }, { status: 500 });
    }

    console.log("✅ [BUNNY] Video uploaded successfully:", bunnyResult.url);
    return NextResponse.json({
      success: true,
      cdnUrl: bunnyResult.url,
      filename: bunnyResult.filename,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [BUNNY] Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload video to CDN",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

async function uploadToBunnyNet(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<{ url: string; filename: string } | null> {
  try {
    // Bunny.net configuration
    const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
    const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION ?? "ny"; // Default to New York
    const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

    if (!BUNNY_STORAGE_ZONE || !BUNNY_ACCESS_KEY || !BUNNY_CDN_HOSTNAME) {
      console.error("❌ [BUNNY] Missing Bunny.net configuration");
      throw new Error("Bunny.net configuration missing");
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `videos/${timestamp}-${filename}`;

    // Bunny.net Storage API endpoint
    const uploadUrl = `https://${BUNNY_STORAGE_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${uniqueFilename}`;

    console.log("🚀 [BUNNY] Uploading to:", uploadUrl);

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_ACCESS_KEY,
        "Content-Type": mimeType || "video/mp4",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ [BUNNY] Upload failed:", uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    // Construct CDN URL
    const cdnUrl = `https://${BUNNY_CDN_HOSTNAME}/${uniqueFilename}`;

    console.log("✅ [BUNNY] Upload successful, CDN URL:", cdnUrl);

    return {
      url: cdnUrl,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error("❌ [BUNNY] Upload error:", error);
    return null;
  }
}
