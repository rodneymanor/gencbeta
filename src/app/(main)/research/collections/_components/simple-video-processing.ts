/**
 * Simplified video processing - uses comprehensive backend endpoint
 * Iframes handle their own thumbnails, no complex extraction needed
 */

import { getAuth } from "firebase/auth";

export interface VideoProcessResult {
  success: boolean;
  videoId?: string;
  iframe?: string;
  directUrl?: string;
  platform?: string;
  transcriptionStatus?: string;
  message?: string;
  error?: string;
  details?: string;
}

export async function processAndAddVideo(
  videoUrl: string,
  collectionId: string,
  title?: string,
): Promise<VideoProcessResult> {
  try {
    console.log("🎬 [PROCESS_VIDEO] Starting:", { videoUrl, collectionId, title });

    // Get authentication token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.error("❌ [PROCESS_VIDEO] User not authenticated");
      return {
        success: false,
        error: "Authentication required",
        details: "Please log in to add videos to collections"
      };
    }

    const idToken = await user.getIdToken();

    const response = await fetch("/api/video/process-and-add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        videoUrl: videoUrl.trim(),
        collectionId: collectionId.trim(),
        title: title?.trim() ?? undefined,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ [PROCESS_VIDEO] Server error:", result);
      return {
        success: false,
        error: result.error || "Server error",
        details: result.details || `HTTP ${response.status}`
      };
    }

    if (result.success) {
      console.log("✅ [PROCESS_VIDEO] Success:", result);
      return {
        success: true,
        videoId: result.videoId ?? undefined,
        iframe: result.iframe ?? undefined,
        directUrl: result.directUrl ?? undefined,
        platform: result.platform ?? undefined,
        transcriptionStatus: result.transcriptionStatus ?? undefined,
        message: result.message ?? undefined,
      };
    } else {
      console.error("❌ [PROCESS_VIDEO] Processing failed:", result);
      return {
        success: false,
        error: result.error ?? "Processing failed",
        details: result.details ?? undefined,
      };
    }
  } catch (error) {
    console.error("❌ [PROCESS_VIDEO] Network error:", error);
    
    let errorMessage = "Network error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error),
    };
  }
}

/**
 * Real-time transcription status checker
 */
export const checkTranscriptionStatus = async (videoId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transcript?: string;
  components?: any;
}> => {
  try {
    const response = await fetch(`/api/video/transcription-status/${videoId}`);
    
    if (!response.ok) {
      return { status: 'failed' };
    }
    
    return await response.json();
  } catch (error) {
    console.error("❌ [TRANSCRIPTION] Status check failed:", error);
    return { status: 'failed' };
  }
};

/**
 * URL validation
 */
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    return domain.includes('tiktok.com') || 
           domain.includes('instagram.com') || 
           domain.includes('youtube.com');
  } catch {
    return false;
  }
};

/**
 * Platform detection from URL
 */
export const detectPlatform = (url: string): 'tiktok' | 'instagram' | 'youtube' | 'unknown' => {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    if (domain.includes('tiktok.com')) return 'tiktok';
    if (domain.includes('instagram.com')) return 'instagram';
    if (domain.includes('youtube.com')) return 'youtube';
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}; 