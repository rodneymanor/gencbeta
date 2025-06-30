// Production-ready video processing and collection addition endpoint
import { NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getAdminDb, isAdminInitialized } from "@/lib/firebase-admin";
import { uploadToBunnyStream } from "@/lib/bunny-stream";

export async function POST(request: NextRequest) {
  console.log("🚀 [VIDEO_PROCESS] Starting complete video processing workflow...");

  try {
    const { videoUrl, collectionId, title } = await request.json();

    if (!videoUrl || !collectionId) {
      return NextResponse.json({ 
        error: "videoUrl and collectionId are required" 
      }, { status: 400 });
    }

    // Decode URL if it's URL-encoded
    const decodedUrl = decodeURIComponent(videoUrl);
    console.log("🔍 [VIDEO_PROCESS] Original URL:", videoUrl);
    console.log("🔍 [VIDEO_PROCESS] Decoded URL:", decodedUrl);

    const baseUrl = getBaseUrl(request);

    // Step 1: Download video using existing working endpoint
    console.log("📥 [VIDEO_PROCESS] Step 1: Downloading video...");
    const downloadResult = await downloadVideo(baseUrl, decodedUrl);
    
    if (!downloadResult.success) {
      return NextResponse.json({
        error: "Failed to download video",
        details: downloadResult.error
      }, { status: 500 });
    }

    // Step 2: Stream to Bunny CDN and get iframe URL
    console.log("🎬 [VIDEO_PROCESS] Step 2: Streaming to Bunny CDN...");
    const streamResult = await streamToBunny(downloadResult.data);
    
    if (!streamResult.success) {
      return NextResponse.json({
        error: "Failed to stream video to CDN",
        details: streamResult.error
      }, { status: 500 });
    }

    // Step 3: Add video to collection with iframe URL
    console.log("💾 [VIDEO_PROCESS] Step 3: Adding video to collection...");
    const videoData = {
      url: decodedUrl,
      title: title || `${downloadResult.data.platform} Video - ${new Date().toLocaleDateString()}`,
      platform: downloadResult.data.platform,
      iframe: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      bunnyGuid: streamResult.guid,
      thumbnailUrl: streamResult.thumbnailUrl || downloadResult.data.thumbnailUrl,
      metrics: downloadResult.data.metrics || {},
      addedAt: new Date().toISOString(),
      transcriptionStatus: 'pending'
    };

    const addResult = await addVideoToCollection(collectionId, videoData);
    
    if (!addResult.success) {
      return NextResponse.json({
        error: "Failed to add video to collection",
        details: addResult.error
      }, { status: 500 });
    }

    // Step 4: Start background transcription (real-time updates)
    console.log("🎙️ [VIDEO_PROCESS] Step 4: Starting background transcription...");
    startBackgroundTranscription(
      baseUrl,
      downloadResult.data.videoData,
      addResult.videoId,
      collectionId,
      downloadResult.data.platform
    );

    console.log("✅ [VIDEO_PROCESS] Complete workflow successful!");
    
    return NextResponse.json({
      success: true,
      videoId: addResult.videoId,
      iframe: streamResult.iframeUrl,
      directUrl: streamResult.directUrl,
      platform: downloadResult.data.platform,
      transcriptionStatus: 'processing',
      message: "Video added successfully. Transcription in progress."
    });

  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Workflow error:", error);
    return NextResponse.json({
      error: "Video processing failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function getBaseUrl(request: NextRequest): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const host = request.headers.get("host");
  return host ? `http://${host}` : "http://localhost:3000";
}

async function downloadVideo(baseUrl: string, url: string) {
  try {
    console.log("🔄 [VIDEO_PROCESS] Calling downloader service...");
    
    const response = await fetch(`${baseUrl}/api/video/downloader`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [VIDEO_PROCESS] Download failed:", response.status, errorText);
      return { success: false, error: `Download failed: ${errorText}` };
    }

    const data = await response.json();
    console.log("✅ [VIDEO_PROCESS] Download successful");
    return { success: true, data };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Download error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Download failed" };
  }
}

async function streamToBunny(downloadData: any) {
  try {
    console.log("🐰 [VIDEO_PROCESS] Streaming to Bunny CDN...");
    
    const buffer = Buffer.from(downloadData.videoData.buffer);
    const filename = downloadData.videoData.filename || `${downloadData.platform}-video.mp4`;
    const mimeType = downloadData.videoData.mimeType || 'video/mp4';

    const result = await uploadToBunnyStream(buffer, filename, mimeType);
    
    if (!result || !result.success) {
      console.error("❌ [VIDEO_PROCESS] Bunny stream failed");
      return { success: false, error: "Failed to upload to Bunny CDN" };
    }

    console.log("✅ [VIDEO_PROCESS] Bunny stream successful:", result.iframeUrl);
    return { 
      success: true, 
      iframeUrl: result.iframeUrl,
      directUrl: result.directUrl,
      guid: result.guid,
      thumbnailUrl: result.thumbnailUrl
    };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Bunny stream error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Bunny stream failed" };
  }
}

async function addVideoToCollection(collectionId: string, videoData: any) {
  try {
    console.log("💾 [VIDEO_PROCESS] Adding video to Firestore collection...");
    
    if (!isAdminInitialized) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error("Admin database not available");
    }

    // Add video to collection
    const videoRef = adminDb.collection('videos').doc();
    await videoRef.set({
      ...videoData,
      collectionId,
      id: videoRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Update collection video count
    const collectionRef = adminDb.collection('collections').doc(collectionId);
    await adminDb.runTransaction(async (transaction) => {
      const collectionDoc = await transaction.get(collectionRef);
      if (collectionDoc.exists) {
        const currentCount = collectionDoc.data()?.videoCount || 0;
        transaction.update(collectionRef, {
          videoCount: currentCount + 1,
          updatedAt: new Date().toISOString()
        });
      }
    });

    console.log("✅ [VIDEO_PROCESS] Video added to collection:", videoRef.id);
    return { success: true, videoId: videoRef.id };
  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Firestore error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Database error" };
  }
}

function startBackgroundTranscription(
  baseUrl: string,
  videoData: any,
  videoId: string,
  collectionId: string,
  platform: string
) {
  // Use setTimeout to ensure response is sent before starting background work
  setTimeout(async () => {
    try {
      console.log("🎙️ [BACKGROUND] Starting transcription for video:", videoId);

      // Convert buffer array back to proper format for transcription
      const buffer = Buffer.from(videoData.buffer);
      const blob = new Blob([buffer], { type: videoData.mimeType });
      const formData = new FormData();
      formData.append('video', blob, videoData.filename);

      const response = await fetch(`${baseUrl}/api/video/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const transcriptionResult = await response.json();
        console.log("✅ [BACKGROUND] Transcription completed");
        
        // Update video with transcription results
        await updateVideoTranscription(videoId, transcriptionResult);
        
        // Real-time update could be sent via WebSocket here if implemented
        console.log("📡 [BACKGROUND] Transcription ready for video:", videoId);
      } else {
        console.error("❌ [BACKGROUND] Transcription failed:", response.status);
        await updateVideoTranscriptionStatus(videoId, 'failed');
      }
    } catch (error) {
      console.error("❌ [BACKGROUND] Transcription error:", error);
      await updateVideoTranscriptionStatus(videoId, 'failed');
    }
  }, 100);
}

async function updateVideoTranscription(videoId: string, transcriptionData: any) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    await adminDb.collection('videos').doc(videoId).update({
      transcript: transcriptionData.transcript,
      components: transcriptionData.components,
      contentMetadata: transcriptionData.contentMetadata,
      visualContext: transcriptionData.visualContext,
      transcriptionStatus: 'completed',
      transcriptionCompletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log("✅ [BACKGROUND] Video transcription updated:", videoId);
  } catch (error) {
    console.error("❌ [BACKGROUND] Failed to update transcription:", error);
  }
}

async function updateVideoTranscriptionStatus(videoId: string, status: string) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return;

    await adminDb.collection('videos').doc(videoId).update({
      transcriptionStatus: status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ [BACKGROUND] Failed to update transcription status:", error);
  }
} 