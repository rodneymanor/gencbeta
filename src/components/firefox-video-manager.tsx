"use client";

import { useEffect, useRef, useCallback } from "react";

interface FirefoxVideoManagerProps {
  onVideoStateChange?: (videoId: string, isPlaying: boolean) => void;
}

export const FirefoxVideoManager = ({ onVideoStateChange }: FirefoxVideoManagerProps) => {
  const isFirefox = useRef(false);
  const activeVideos = useRef<Set<string>>(new Set());
  const videoElements = useRef<Map<string, HTMLVideoElement>>(new Map());
  const iframeElements = useRef<Map<string, HTMLIFrameElement>>(new Map());

  // Detect Firefox browser
  useEffect(() => {
    isFirefox.current = navigator.userAgent.includes("Firefox");
    if (isFirefox.current) {
      console.log("🦊 [Firefox Video Manager] Firefox detected - enabling enhanced video management");
    }
  }, []);

  // Function to pause all videos except the specified one
  const pauseAllOtherVideos = useCallback(
    (currentVideoId: string) => {
      if (!isFirefox.current) return;

      console.log("🦊 [Firefox Video Manager] Pausing all other videos for:", currentVideoId);

      // Pause all HTML5 video elements
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((video) => {
        const videoId = video.getAttribute("data-video-id");
        if (videoId && videoId !== currentVideoId && !video.paused) {
          console.log("🦊 [Firefox Video Manager] Pausing HTML5 video:", videoId);
          video.pause();
          activeVideos.current.delete(videoId);
          onVideoStateChange?.(videoId, false);
        }
      });

      // Send pause messages to all iframes
      const allIframes = document.querySelectorAll("iframe[data-video-id]");
      allIframes.forEach((iframe) => {
        const iframeVideoId = iframe.getAttribute("data-video-id");
        if (iframeVideoId && iframeVideoId !== currentVideoId) {
          try {
            console.log("🦊 [Firefox Video Manager] Sending pause message to iframe:", iframeVideoId);
            iframe.contentWindow?.postMessage({ command: "pause" }, "*");
            activeVideos.current.delete(iframeVideoId);
            onVideoStateChange?.(iframeVideoId, false);
          } catch (error) {
            console.log("🦊 [Firefox Video Manager] Cannot send message to iframe due to CORS");
          }
        }
      });

      // Add current video to active set
      activeVideos.current.add(currentVideoId);
      onVideoStateChange?.(currentVideoId, true);
    },
    [onVideoStateChange],
  );

  // Function to handle video play events
  const handleVideoPlay = useCallback(
    (event: Event) => {
      if (!isFirefox.current) return;

      const video = event.target as HTMLVideoElement;
      const videoId = video.getAttribute("data-video-id");

      if (videoId) {
        console.log("🦊 [Firefox Video Manager] Video play event detected for:", videoId);
        pauseAllOtherVideos(videoId);
      }
    },
    [pauseAllOtherVideos],
  );

  // Function to handle iframe messages
  const handleIframeMessage = useCallback(
    (event: MessageEvent) => {
      if (!isFirefox.current) return;

      const { data } = event;

      // Handle play events from iframes
      if (data && data.type === "video-play" && data.videoId) {
        console.log("🦊 [Firefox Video Manager] Iframe play event received for:", data.videoId);
        pauseAllOtherVideos(data.videoId);
      }

      // Handle pause events from iframes
      if (data && data.type === "video-pause" && data.videoId) {
        console.log("🦊 [Firefox Video Manager] Iframe pause event received for:", data.videoId);
        activeVideos.current.delete(data.videoId);
        onVideoStateChange?.(data.videoId, false);
      }
    },
    [pauseAllOtherVideos, onVideoStateChange],
  );

  // Function to handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (!isFirefox.current) return;

    if (document.hidden) {
      console.log("🦊 [Firefox Video Manager] Page hidden - pausing all videos");
      // Pause all videos when page becomes hidden
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((video) => {
        if (!video.paused) {
          video.pause();
        }
      });

      // Send pause messages to all iframes
      const allIframes = document.querySelectorAll("iframe[data-video-id]");
      allIframes.forEach((iframe) => {
        try {
          iframe.contentWindow?.postMessage({ command: "pause" }, "*");
        } catch (error) {
          console.log("🦊 [Firefox Video Manager] Cannot send pause message to iframe");
        }
      });

      activeVideos.current.clear();
    }
  }, []);

  // Set up global event listeners
  useEffect(() => {
    if (!isFirefox.current) return;

    console.log("🦊 [Firefox Video Manager] Setting up global event listeners");

    // Add global event listeners
    window.addEventListener("message", handleIframeMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set up mutation observer to watch for new video elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            // Check for new video elements
            const videos = element.querySelectorAll("video[data-video-id]");
            videos.forEach((video) => {
              const videoId = video.getAttribute("data-video-id");
              if (videoId && !videoElements.current.has(videoId)) {
                console.log("🦊 [Firefox Video Manager] New video element detected:", videoId);
                videoElements.current.set(videoId, video);
                video.addEventListener("play", handleVideoPlay);
              }
            });

            // Check for new iframe elements
            const iframes = element.querySelectorAll("iframe[data-video-id]");
            iframes.forEach((iframe) => {
              const iframeId = iframe.getAttribute("data-video-id");
              if (iframeId && !iframeElements.current.has(iframeId)) {
                console.log("🦊 [Firefox Video Manager] New iframe element detected:", iframeId);
                iframeElements.current.set(iframeId, iframe);
              }
            });
          }
        });
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Set up existing video elements
    const existingVideos = document.querySelectorAll("video[data-video-id]");
    existingVideos.forEach((video) => {
      const videoId = video.getAttribute("data-video-id");
      if (videoId) {
        videoElements.current.set(videoId, video);
        video.addEventListener("play", handleVideoPlay);
      }
    });

    // Set up existing iframe elements
    const existingIframes = document.querySelectorAll("iframe[data-video-id]");
    existingIframes.forEach((iframe) => {
      const iframeId = iframe.getAttribute("data-video-id");
      if (iframeId) {
        iframeElements.current.set(iframeId, iframe);
      }
    });

    return () => {
      // Cleanup event listeners
      window.removeEventListener("message", handleIframeMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Remove video event listeners
      videoElements.current.forEach((video, videoId) => {
        video.removeEventListener("play", handleVideoPlay);
      });

      // Disconnect observer
      observer.disconnect();
    };
  }, [handleVideoPlay, handleIframeMessage, handleVisibilityChange]);

  // This component doesn't render anything
  return null;
};
