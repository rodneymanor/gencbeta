async function testBunnyStreamConnectivity(): Promise<boolean> {
  try {
    console.log("🔍 [BUNNY] Testing connectivity to Bunny Stream API...");

    const testUrl = "https://video.bunnycdn.com";
    const response = await Promise.race([
      fetch(testUrl, {
        method: "HEAD",
        headers: {
          "User-Agent": "NextJS-App/1.0",
        },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Connectivity test timeout")), 10000)),
    ]);

    console.log("✅ [BUNNY] Connectivity test passed:", response.status);
    return true;
  } catch (error) {
    console.error("❌ [BUNNY] Connectivity test failed:", error);
    return false;
  }
}

async function createBunnyStreamVideo(
  libraryId: string,
  apiKey: string,
  filename: string,
  timeout: number,
): Promise<string | null> {
  const createVideoUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;

  console.log("🌐 [BUNNY] Making request to:", createVideoUrl);
  console.log("🔑 [BUNNY] Using API key (first 10 chars):", apiKey.substring(0, 10) + "...");

  const createResponse = await Promise.race([
    fetch(createVideoUrl, {
      method: "POST",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "NextJS-App/1.0",
      },
      body: JSON.stringify({
        title: filename.replace(/\.[^/.]+$/, ""), // Remove file extension for title
      }),
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout),
    ),
  ]);

  console.log("📥 [BUNNY] Create response status:", createResponse.status);

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error("❌ [BUNNY] Failed to create video object:", createResponse.status, errorText);
    return null;
  }

  const videoObject = await createResponse.json();
  const videoGuid = videoObject.guid;
  console.log("✅ [BUNNY] Video object created with GUID:", videoGuid);
  return videoGuid;
}

async function uploadBunnyStreamVideo(
  libraryId: string,
  apiKey: string,
  videoGuid: string,
  arrayBuffer: ArrayBuffer,
  timeout: number,
): Promise<boolean> {
  const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;

  console.log("🌐 [BUNNY] Upload URL:", uploadUrl);
  console.log("📊 [BUNNY] ArrayBuffer size:", arrayBuffer.byteLength, "bytes");

  const uploadResponse = await Promise.race([
    fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        Accept: "application/json",
        "Content-Type": "application/octet-stream",
        "User-Agent": "NextJS-App/1.0",
      },
      body: arrayBuffer,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Upload timeout after ${timeout}ms`)), timeout),
    ),
  ]);

  console.log("📥 [BUNNY] Upload response status:", uploadResponse.status);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("❌ [BUNNY] Upload failed:", uploadResponse.status, errorText);
    return false;
  }

  console.log("✅ [BUNNY] Video file uploaded successfully");
  return true;
}

async function attemptUpload(
  libraryId: string,
  apiKey: string,
  arrayBuffer: ArrayBuffer,
  filename: string,
  attempt: number,
  maxRetries: number,
): Promise<{ cdnUrl: string; filename: string } | null> {
  console.log(`🔄 [BUNNY] Attempt ${attempt}/${maxRetries}`);

  const timeout = 60000 + 30000 * (attempt - 1); // 60s, 90s, 120s
  console.log(`⏱️ [BUNNY] Using timeout: ${timeout}ms`);

  // Step 1: Create video object
  console.log("📝 [BUNNY] Creating video object...");
  const videoGuid = await createBunnyStreamVideo(libraryId, apiKey, filename, timeout);

  if (!videoGuid) {
    return null;
  }

  // Step 2: Upload video file
  console.log("📤 [BUNNY] Uploading video file...");
  const uploadSuccess = await uploadBunnyStreamVideo(libraryId, apiKey, videoGuid, arrayBuffer, timeout);

  if (!uploadSuccess) {
    return null;
  }

  // Step 3: Construct CDN URL for HLS streaming
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;
  const cdnUrl = `https://${cdnHostname}/${videoGuid}/playlist.m3u8`;
  console.log("🎯 [BUNNY] Stream CDN URL constructed:", cdnUrl);

  return {
    cdnUrl,
    filename: videoGuid,
  };
}

function validateBunnyConfig(): { isValid: boolean; config?: { libraryId: string; apiKey: string; hostname: string } } {
  const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID;
  const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY;
  const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

  console.log("🔧 [BUNNY] Stream configuration check:");
  console.log("  - Library ID:", BUNNY_STREAM_LIBRARY_ID);
  console.log("  - API Key present:", !!BUNNY_STREAM_API_KEY);
  console.log("  - CDN Hostname:", BUNNY_CDN_HOSTNAME);

  if (!BUNNY_STREAM_LIBRARY_ID || !BUNNY_STREAM_API_KEY || !BUNNY_CDN_HOSTNAME) {
    console.error("❌ [BUNNY] Missing Bunny Stream configuration");
    return { isValid: false };
  }

  return {
    isValid: true,
    config: {
      libraryId: BUNNY_STREAM_LIBRARY_ID,
      apiKey: BUNNY_STREAM_API_KEY,
      hostname: BUNNY_CDN_HOSTNAME,
    },
  };
}

async function performRetryLoop(
  config: { libraryId: string; apiKey: string; hostname: string },
  arrayBuffer: ArrayBuffer,
  filename: string,
): Promise<{ cdnUrl: string; filename: string } | null> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await attemptUpload(config.libraryId, config.apiKey, arrayBuffer, filename, attempt, MAX_RETRIES);

      if (result) {
        return result;
      }

      if (attempt < MAX_RETRIES) {
        console.log(`⏳ [BUNNY] Waiting ${2000 * attempt}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }
    } catch (error) {
      console.error(`❌ [BUNNY] Attempt ${attempt} failed:`, error);

      if (attempt === MAX_RETRIES) {
        console.error("❌ [BUNNY] All retry attempts exhausted");
        return null;
      }

      console.log(`⏳ [BUNNY] Waiting ${3000 * attempt}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }

  return null;
}

export async function uploadToBunnyStream(
  buffer: Buffer,
  filename: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mimeType: string,
): Promise<{ cdnUrl: string; filename: string } | null> {
  try {
    console.log("🚀 [BUNNY] Starting upload to Bunny Stream...");

    // Convert Buffer to ArrayBuffer as required by the guide
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    console.log("🔄 [BUNNY] Converted Buffer to ArrayBuffer:", arrayBuffer.byteLength, "bytes");

    // Test connectivity first
    const isConnected = await testBunnyStreamConnectivity();
    if (!isConnected) {
      console.error("❌ [BUNNY] Failed connectivity test, aborting upload");
      return null;
    }

    // Validate configuration
    const configResult = validateBunnyConfig();
    if (!configResult.isValid || !configResult.config) {
      return null;
    }

    // Perform retry loop
    return await performRetryLoop(configResult.config, arrayBuffer, filename);
  } catch (error) {
    console.error("❌ [BUNNY] Stream upload error:", error);
    return null;
  }
}

export function isBunnyStreamConfigured(): boolean {
  return (
    !!process.env.BUNNY_STREAM_LIBRARY_ID && !!process.env.BUNNY_STREAM_API_KEY && !!process.env.BUNNY_CDN_HOSTNAME
  );
}
