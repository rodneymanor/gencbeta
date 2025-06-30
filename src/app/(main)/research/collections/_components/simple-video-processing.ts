// Production-ready simplified video processing using comprehensive endpoint
interface VideoProcessResult {
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

/**
 * Complete video processing workflow using the comprehensive endpoint
 * Handles: URL decoding, download, Bunny streaming, collection addition, transcription
 */
export const processAndAddVideo = async (
  videoUrl: string, 
  collectionId: string, 
  title?: string
): Promise<VideoProcessResult> => {
  console.log("🚀 [VIDEO_PROCESS] Starting comprehensive video processing...");
  console.log("🔗 [VIDEO_PROCESS] URL:", videoUrl);
  console.log("📂 [VIDEO_PROCESS] Collection:", collectionId);
  
  try {
    const response = await fetch("/api/video/process-and-add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        videoUrl, 
        collectionId, 
        title 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [VIDEO_PROCESS] Processing failed:", data);
      return {
        success: false,
        error: data.error || "Video processing failed",
        details: data.details
      };
    }

    console.log("✅ [VIDEO_PROCESS] Processing successful:", data);
    return {
      success: true,
      videoId: data.videoId,
      iframe: data.iframe,
      directUrl: data.directUrl,
      platform: data.platform,
      transcriptionStatus: data.transcriptionStatus,
      message: data.message
    };

  } catch (error) {
    console.error("❌ [VIDEO_PROCESS] Network error:", error);
    return {
      success: false,
      error: "Network error during video processing",
      details: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

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