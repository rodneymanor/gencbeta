import { useState, useEffect, useRef } from "react";

interface PreemptiveBufferManagementProps {
  videoRef: React.RefObject<HTMLIFrameElement>;
  isPlaying: boolean;
}

export const usePreemptiveBufferManagement = ({ videoRef, isPlaying }: PreemptiveBufferManagementProps) => {
  const [bufferHealth, setBufferHealth] = useState<"healthy" | "low" | "critical">("healthy");
  const [bufferAhead, setBufferAhead] = useState(0);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const checkBuffer = () => {
      if (!videoRef.current) return;

      try {
        const iframe = videoRef.current;
        const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
        const videoElement = iframeDoc?.querySelector("video");

        if (!videoElement) return;

        const buffered = videoElement.buffered;
        const currentTime = videoElement.currentTime;

        // Calculate total buffer ahead
        let totalBufferAhead = 0;
        for (let i = 0; i < buffered.length; i++) {
          const start = buffered.start(i);
          const end = buffered.end(i);

          if (end > currentTime) {
            totalBufferAhead += end - Math.max(start, currentTime);
          }
        }

        setBufferAhead(totalBufferAhead);

        // Set buffer health status
        if (totalBufferAhead < 5) {
          setBufferHealth("critical");
          console.warn("🚨 [Buffer Management] Critical buffer level:", totalBufferAhead.toFixed(2), "seconds");
        } else if (totalBufferAhead < 15) {
          setBufferHealth("low");
          console.warn("⚠️ [Buffer Management] Low buffer level:", totalBufferAhead.toFixed(2), "seconds");
        } else {
          setBufferHealth("healthy");
        }
      } catch {
        console.log("🔍 [Buffer Management] Cannot access buffer info due to CORS");
      }
    };

    checkInterval.current = setInterval(checkBuffer, 2000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [isPlaying, videoRef]);

  return {
    bufferHealth,
    bufferAhead,
  };
};
