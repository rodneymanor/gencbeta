/**
 * Clipboard Detection Logic for TikTok/Instagram Links
 * 
 * This module provides the core functionality to detect social media links
 * in the clipboard and trigger appropriate actions. UI-agnostic so you can
 * use it with any alert/notification system.
 */

// Types
export interface ClipboardDetectionResult {
  url: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'linkedin' | 'other';
  isVideo: boolean;
  formattedUrl: string;
}

export interface ClipboardDetectionCallbacks {
  onDetected: (result: ClipboardDetectionResult) => void;
  onError: (error: string) => void;
  onPermissionDenied: () => void;
}

// Core detection functions
export const isSocialMediaUrl = (url: string): boolean => {
  const socialDomains = [
    'tiktok.com',
    'instagram.com',
    'youtube.com',
    'youtu.be',
    'twitter.com',
    'x.com',
    'facebook.com',
    'linkedin.com',
    'pinterest.com',
    'snapchat.com',
    'discord.com',
    'twitch.tv'
  ];
  
  try {
    const urlObj = new URL(url);
    return socialDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

export const isTikTokOrInstagramUrl = (url: string): boolean => {
  return url.includes('tiktok.com') || url.includes('instagram.com');
};

export const isVideoUrl = (url: string): boolean => {
  return url.includes('tiktok.com') || 
         url.includes('instagram.com') || 
         url.includes('youtube.com') || 
         url.includes('youtu.be');
};

export const detectPlatform = (url: string): ClipboardDetectionResult['platform'] => {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('tiktok.com')) return 'tiktok';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  
  return 'other';
};

export const formatUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname;
    
    // Truncate long URLs
    if (path.length > 30) {
      return `${hostname}${path.substring(0, 30)}...`;
    }
    
    return `${hostname}${path}`;
  } catch {
    return url.length > 50 ? `${url.substring(0, 50)}...` : url;
  }
};

// Main clipboard checking function
export const checkClipboardForSocialLinks = async (): Promise<ClipboardDetectionResult | null> => {
  try {
    // Check if clipboard API is available
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error('Clipboard API not available');
    }

    const clipboardText = await navigator.clipboard.readText();
    
    // Check if clipboard contains a social media URL
    if (clipboardText && isSocialMediaUrl(clipboardText.trim())) {
      const url = clipboardText.trim();
      const platform = detectPlatform(url);
      const isVideo = isVideoUrl(url);
      const formattedUrl = formatUrl(url);
      
      return {
        url,
        platform,
        isVideo,
        formattedUrl
      };
    }
    
    return null;
  } catch (error) {
    throw new Error(`Clipboard access failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Hook for React apps (optional - you can use the functions directly)
export const useClipboardDetection = (
  callbacks: ClipboardDetectionCallbacks,
  options: {
    enabled?: boolean;
    checkDelay?: number;
    checkOnMount?: boolean;
  } = {}
) => {
  const { enabled = true, checkDelay = 1000, checkOnMount = true } = options;

  const checkClipboard = async () => {
    if (!enabled) return;

    try {
      const result = await checkClipboardForSocialLinks();
      if (result) {
        callbacks.onDetected(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('not available') || errorMessage.includes('denied')) {
        callbacks.onPermissionDenied();
      } else {
        callbacks.onError(errorMessage);
      }
    }
  };

  // For React apps - automatically check on mount
  if (typeof window !== 'undefined' && checkOnMount) {
    const timer = setTimeout(checkClipboard, checkDelay);
    return () => clearTimeout(timer);
  }

  // Return the check function for manual use
  return checkClipboard;
};

// Platform-specific URL validators
export const validateTikTokUrl = (url: string): boolean => {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/\d+/,
    /vm\.tiktok\.com\/[A-Za-z0-9]+/,
    /tiktok\.com\/t\/[A-Za-z0-9]+/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

export const validateInstagramUrl = (url: string): boolean => {
  const patterns = [
    /instagram\.com\/p\/[A-Za-z0-9_-]+/,
    /instagram\.com\/reel\/[A-Za-z0-9_-]+/,
    /instagram\.com\/tv\/[A-Za-z0-9_-]+/,
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

// Extract IDs from URLs (useful for API calls)
export const extractTikTokVideoId = (url: string): string | null => {
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /tiktok\.com\/t\/([A-Za-z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const extractInstagramShortcode = (url: string): string | null => {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Utility function to create a simple alert message
export const createAlertMessage = (result: ClipboardDetectionResult): string => {
  const { platform, isVideo, formattedUrl } = result;
  
  if (platform === 'tiktok' || platform === 'instagram') {
    return `${isVideo ? 'Video' : 'Content'} link detected from ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${formattedUrl}`;
  }
  
  return `Social media link detected: ${formattedUrl}`;
};

// Example usage functions (you can customize these)
export const showSimpleAlert = (result: ClipboardDetectionResult) => {
  const message = createAlertMessage(result);
  
  // Use browser's native alert (replace with your custom alert system)
  if (typeof window !== 'undefined') {
    alert(message);
  }
};

export const logDetection = (result: ClipboardDetectionResult) => {
  console.log('🔍 [CLIPBOARD] Social media link detected:', {
    platform: result.platform,
    isVideo: result.isVideo,
    url: result.url,
    formatted: result.formattedUrl
  });
}; 