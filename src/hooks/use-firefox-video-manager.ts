import { useEffect, useRef, useCallback } from 'react';

interface FirefoxVideoManagerProps {
  videoId: string;
  isPlaying: boolean;
  onVideoStop?: () => void;
}

export const useFirefoxVideoManager = ({ videoId, isPlaying, onVideoStop }: FirefoxVideoManagerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isFirefox = useRef(false);

  // Detect Firefox browser
  useEffect(() => {
    isFirefox.current = navigator.userAgent.includes('Firefox');
  }, []);

  // Function to pause all other videos on the page
  const pauseAllOtherVideos = useCallback((currentVideoId: string) => {
    if (!isFirefox.current) return;

    console.log("🦊 [Firefox Video Manager] Pausing all other videos for:", currentVideoId);

    // Method 1: Pause all HTML5 video elements
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      if (video && !video.paused) {
        console.log("🦊 [Firefox Video Manager] Pausing HTML5 video");
        video.pause();
      }
    });

    // Method 2: Send pause messages to all iframes
    const allIframes = document.querySelectorAll('iframe[data-video-id]');
    allIframes.forEach((iframe) => {
      const iframeVideoId = iframe.getAttribute('data-video-id');
      if (iframeVideoId && iframeVideoId !== currentVideoId) {
        try {
          console.log("🦊 [Firefox Video Manager] Sending pause message to iframe:", iframeVideoId);
          iframe.contentWindow?.postMessage({ command: 'pause' }, '*');
        } catch (error) {
          console.log("🦊 [Firefox Video Manager] Cannot send message to iframe due to CORS");
        }
      }
    });

    // Method 3: Force pause via iframe src manipulation (nuclear option)
    allIframes.forEach((iframe) => {
      const iframeVideoId = iframe.getAttribute('data-video-id');
      if (iframeVideoId && iframeVideoId !== currentVideoId) {
        const currentSrc = iframe.src;
        if (currentSrc && !currentSrc.includes('autoplay=false')) {
          console.log("🦊 [Firefox Video Manager] Force reloading iframe without autoplay:", iframeVideoId);
          // Temporarily change src to force reload without autoplay
          const newSrc = currentSrc.replace(/autoplay=true/g, 'autoplay=false');
          iframe.src = newSrc;
        }
      }
    });
  }, []);

  // Function to handle video play events
  const handleVideoPlay = useCallback((event: Event) => {
    if (!isFirefox.current) return;

    const video = event.target as HTMLVideoElement;
    console.log("🦊 [Firefox Video Manager] Video play event detected");
    
    // Pause all other videos when this one starts playing
    pauseAllOtherVideos(videoId);
  }, [videoId, pauseAllOtherVideos]);

  // Function to handle iframe messages
  const handleIframeMessage = useCallback((event: MessageEvent) => {
    if (!isFirefox.current) return;

    // Listen for play events from iframes
    if (event.data && event.data.type === 'video-play') {
      console.log("🦊 [Firefox Video Manager] Iframe play event received");
      pauseAllOtherVideos(event.data.videoId || videoId);
    }
  }, [videoId, pauseAllOtherVideos]);

  // Set up event listeners when component mounts
  useEffect(() => {
    if (!isFirefox.current) return;

    console.log("🦊 [Firefox Video Manager] Setting up Firefox-specific video management");

    // Add global event listener for iframe messages
    window.addEventListener('message', handleIframeMessage);

    // Find and set up video element if it exists
    const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement;
    if (videoElement) {
      videoRef.current = videoElement;
      videoElement.addEventListener('play', handleVideoPlay);
    }

    // Find and set up iframe element if it exists
    const iframeElement = document.querySelector(`iframe[data-video-id="${videoId}"]`) as HTMLIFrameElement;
    if (iframeElement) {
      iframeRef.current = iframeElement;
    }

    return () => {
      // Cleanup event listeners
      window.removeEventListener('message', handleIframeMessage);
      
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', handleVideoPlay);
      }
    };
  }, [videoId, handleVideoPlay, handleIframeMessage]);

  // Handle play state changes
  useEffect(() => {
    if (!isFirefox.current) return;

    if (isPlaying) {
      console.log("🦊 [Firefox Video Manager] Video started playing, pausing others");
      pauseAllOtherVideos(videoId);
    }
  }, [isPlaying, videoId, pauseAllOtherVideos]);

  // Function to force stop all videos (for manual control)
  const forceStopAllVideos = useCallback(() => {
    if (!isFirefox.current) return;

    console.log("🦊 [Firefox Video Manager] Force stopping all videos");

    // Stop all HTML5 videos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      if (video && !video.paused) {
        video.pause();
      }
    });

    // Send stop messages to all iframes
    const allIframes = document.querySelectorAll('iframe[data-video-id]');
    allIframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage({ command: 'pause' }, '*');
      } catch (error) {
        console.log("🦊 [Firefox Video Manager] Cannot send stop message to iframe");
      }
    });

    // Call the onVideoStop callback if provided
    if (onVideoStop) {
      onVideoStop();
    }
  }, [onVideoStop]);

  return {
    forceStopAllVideos,
    isFirefox: isFirefox.current
  };
}; 