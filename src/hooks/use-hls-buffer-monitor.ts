import { useState, useCallback, useEffect, useRef } from "react";

interface HLSBufferMonitorProps {
  videoRef: React.RefObject<HTMLIFrameElement>;
  isPlaying: boolean;
  onBufferIssue: (issueType: string) => void;
}

export const useHLSBufferMonitor = ({ videoRef, isPlaying, onBufferIssue }: HLSBufferMonitorProps) => {
  const [lastCurrentTime, setLastCurrentTime] = useState(0);
  const [stallCount, setStallCount] = useState(0);
  const progressCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const bufferCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Method 1: Monitor currentTime progression
  const checkPlaybackProgress = useCallback(() => {
    if (!videoRef.current || !isPlaying) return;

    const iframe = videoRef.current;
    try {
      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const videoElement = iframeDoc.querySelector("video");
      if (!videoElement) return;

      const currentTime = videoElement.currentTime;
      const timeDiff = currentTime - lastCurrentTime;

      // If currentTime hasn't progressed for 3 seconds while playing
      if (timeDiff < 0.1 && isPlaying) {
        setStallCount((prev) => prev + 1);

        if (stallCount >= 3) {
          // 3 consecutive stalls
          console.warn("🚨 [HLS Monitor] Playback stalled - no time progression");
          onBufferIssue("stalled");
          setStallCount(0);
        }
      } else {
        setStallCount(0);
      }

      setLastCurrentTime(currentTime);
    } catch {
      // Cross-origin restrictions
      console.log("🔍 [HLS Monitor] Cannot access iframe content due to CORS");
    }
  }, [lastCurrentTime, stallCount, isPlaying, onBufferIssue, videoRef]);

  // Method 2: Monitor buffer health
  const checkBufferHealth = useCallback(() => {
    if (!videoRef.current || !isPlaying) return;

    const iframe = videoRef.current;
    try {
      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const videoElement = iframeDoc.querySelector("video");
      if (!videoElement) return;

      const buffered = videoElement.buffered;
      const currentTime = videoElement.currentTime;

      // Check if we're at the end of buffered content
      for (let i = 0; i < buffered.length; i++) {
        const start = buffered.start(i);
        const end = buffered.end(i);

        const inRange = currentTime >= start && currentTime < end;
        const isInBufferGap = !inRange;

        if (isInBufferGap && isPlaying) {
          console.warn("🚨 [HLS Monitor] Buffer gap detected at:", currentTime);
          onBufferIssue("buffer_gap");
        }
      }
    } catch {
      console.log("🔍 [HLS Monitor] Cannot access buffer info due to CORS");
    }
  }, [isPlaying, onBufferIssue, videoRef]);

  // Method 3: Listen for media events
  const setupMediaEventListeners = useCallback(() => {
    if (!videoRef.current) return;

    const iframe = videoRef.current;
    try {
      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const videoElement = iframeDoc.querySelector("video");
      if (!videoElement) return;

      // Event listeners for various stall conditions
      const events = {
        stalled: () => {
          console.warn("🚨 [HLS Monitor] Video stalled event fired");
          onBufferIssue("stalled");
        },
        waiting: () => {
          console.warn("🚨 [HLS Monitor] Video waiting event fired");
          onBufferIssue("waiting");
        },
        suspend: () => {
          console.warn("🚨 [HLS Monitor] Video suspend event fired");
          onBufferIssue("suspend");
        },
        error: (event: Event) => {
          console.error("🚨 [HLS Monitor] Video error event:", event);
          onBufferIssue("error");
        },
      };

      Object.entries(events).forEach(([eventType, handler]) => {
        videoElement.addEventListener(eventType, handler);
      });

      // Cleanup function
      return () => {
        Object.entries(events).forEach(([eventType, handler]) => {
          videoElement.removeEventListener(eventType, handler);
        });
      };
    } catch {
      console.log("🔍 [HLS Monitor] Cannot setup event listeners due to CORS");
    }
  }, [onBufferIssue, videoRef]);

  // Start monitoring when playing
  useEffect(() => {
    if (isPlaying) {
      // Check playback progress every 2 seconds
      progressCheckInterval.current = setInterval(checkPlaybackProgress, 2000);

      // Check buffer health every 1 second
      bufferCheckInterval.current = setInterval(checkBufferHealth, 1000);

      // Setup media event listeners
      const cleanup = setupMediaEventListeners();

      return () => {
        if (progressCheckInterval.current) {
          clearInterval(progressCheckInterval.current);
        }
        if (bufferCheckInterval.current) {
          clearInterval(bufferCheckInterval.current);
        }
        if (cleanup) cleanup();
      };
    }
  }, [isPlaying, checkPlaybackProgress, checkBufferHealth, setupMediaEventListeners]);

  // Reset monitoring state
  useEffect(() => {
    setLastCurrentTime(0);
    setStallCount(0);
  }, [videoRef.current?.src]);

  return {
    lastCurrentTime,
    stallCount,
  };
};
