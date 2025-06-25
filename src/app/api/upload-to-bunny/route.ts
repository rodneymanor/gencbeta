import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("🐰 [BUNNY] Starting video upload to Bunny.net...");

  try {
    const { videoBuffer, filename, mimeType } = await request.json();
    console.log("📋 [BUNNY] Request details:");
    console.log("  - Filename:", filename);
    console.log("  - MIME type:", mimeType);
    console.log("  - Video buffer length:", videoBuffer?.length);

    if (!videoBuffer || !filename) {
      console.error("❌ [BUNNY] Missing required data - videoBuffer:", !!videoBuffer, "filename:", !!filename);
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

    // Check environment variables
    console.log("🔧 [BUNNY] Environment check:");
    console.log("  - BUNNY_STORAGE_ZONE:", !!process.env.BUNNY_STORAGE_ZONE);
    console.log("  - BUNNY_ACCESS_KEY:", !!process.env.BUNNY_ACCESS_KEY);
    console.log("  - BUNNY_STORAGE_REGION:", process.env.BUNNY_STORAGE_REGION ?? "ny");
    console.log("  - BUNNY_CDN_HOSTNAME:", !!process.env.BUNNY_CDN_HOSTNAME);

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
    console.error("❌ [BUNNY] Upload error stack:", error instanceof Error ? error.stack : "No stack");
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
    console.log("🚀 [BUNNY] Starting uploadToBunnyNet function...");
    
    // Bunny.net configuration
    const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
    const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;
    const BUNNY_STORAGE_REGION = process.env.BUNNY_STORAGE_REGION ?? "ny"; // Default to New York
    const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

    console.log("🔧 [BUNNY] Configuration values:");
    console.log("  - Storage Zone:", BUNNY_STORAGE_ZONE);
    console.log("  - Access Key present:", !!BUNNY_ACCESS_KEY);
    console.log("  - Storage Region:", BUNNY_STORAGE_REGION);
    console.log("  - CDN Hostname:", BUNNY_CDN_HOSTNAME);

    if (!BUNNY_STORAGE_ZONE || !BUNNY_ACCESS_KEY || !BUNNY_CDN_HOSTNAME) {
      console.error("❌ [BUNNY] Missing Bunny.net configuration");
      console.error("  - Missing BUNNY_STORAGE_ZONE:", !BUNNY_STORAGE_ZONE);
      console.error("  - Missing BUNNY_ACCESS_KEY:", !BUNNY_ACCESS_KEY);
      console.error("  - Missing BUNNY_CDN_HOSTNAME:", !BUNNY_CDN_HOSTNAME);
      throw new Error("Bunny.net configuration missing");
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueFilename = `videos/${timestamp}-${filename}`;
    console.log("📝 [BUNNY] Generated unique filename:", uniqueFilename);

    // Bunny.net Storage API endpoint
    const uploadUrl = `https://${BUNNY_STORAGE_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${uniqueFilename}`;
    console.log("🌐 [BUNNY] Upload URL:", uploadUrl);
    console.log("📊 [BUNNY] Upload details:");
    console.log("  - Buffer size:", buffer.length, "bytes");
    console.log("  - MIME type:", mimeType);

    console.log("🚀 [BUNNY] Making PUT request to Bunny.net...");
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_ACCESS_KEY,
        "Content-Type": mimeType ?? "video/mp4",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer,
    });

    console.log("📥 [BUNNY] Upload response received:");
    console.log("  - Status:", uploadResponse.status);
    console.log("  - Status Text:", uploadResponse.statusText);
    console.log("  - Headers:", Object.fromEntries(uploadResponse.headers.entries()));

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("❌ [BUNNY] Upload failed:");
      console.error("  - Status:", uploadResponse.status);
      console.error("  - Status Text:", uploadResponse.statusText);
      console.error("  - Error Response:", errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    // Construct CDN URL
    const cdnUrl = `https://${BUNNY_CDN_HOSTNAME}/${uniqueFilename}`;
    console.log("🎯 [BUNNY] CDN URL constructed:", cdnUrl);

    console.log("✅ [BUNNY] Upload successful, returning result");
    return {
      url: cdnUrl,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error("❌ [BUNNY] Upload error in uploadToBunnyNet:", error);
    console.error("❌ [BUNNY] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });
    return null;
  }
}
