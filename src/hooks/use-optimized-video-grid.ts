import { useState, useEffect, useRef, useMemo } from "react";

interface Video {
  id?: string;
  [key: string]: unknown;
}

interface UseOptimizedVideoGridProps {
  videos: Video[];
  containerRef?: React.RefObject<HTMLElement>;
  threshold?: number;
}

export function useOptimizedVideoGrid({ videos, containerRef, threshold = 0.1 }: UseOptimizedVideoGridProps) {
  const [visibleVideos, setVisibleVideos] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Memoize video chunks for better performance
  const videoChunks = useMemo(() => {
    const chunkSize = 20; // Load videos in chunks of 20
    const chunks = [];
    for (let i = 0; i < videos.length; i += chunkSize) {
      chunks.push(videos.slice(i, i + chunkSize));
    }
    return chunks;
  }, [videos]);

  // Initialize intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef?.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute("data-video-id");
          if (videoId) {
            if (entry.isIntersecting) {
              setVisibleVideos((prev) => new Set([...prev, videoId]));
            } else {
              // Keep videos visible once loaded to prevent flickering
              // setVisibleVideos((prev) => {
              //   const newSet = new Set(prev);
              //   newSet.delete(videoId);
              //   return newSet;
              // });
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: "50px",
        threshold,
      },
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef, threshold]);

  // Observe video elements
  const observeVideo = (element: HTMLElement | null, videoId: string) => {
    if (!element || !observerRef.current) return;

    element.setAttribute("data-video-id", videoId);
    observerRef.current.observe(element);
  };

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    visibleVideos,
    videoChunks,
    observeVideo,
    isVideoVisible: (videoId: string) => visibleVideos.has(videoId),
  };
}
