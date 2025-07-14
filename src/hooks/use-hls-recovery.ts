import { useState, useCallback, useEffect } from "react";

interface HLSRecoveryProps {
  videoRef: React.RefObject<HTMLIFrameElement>;
  videoId: string;
  url: string;
}

export const useHLSRecovery = ({ videoRef, videoId, url }: HLSRecoveryProps) => {
  const [recoveryAttempts, setRecoveryAttempts] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);

  const recoveryStrategies = [
    {
      name: "iframe_reload",
      description: "Reload iframe with cache-busting",
      action: () => {
        console.log("🔄 [Recovery] Strategy 1: Iframe reload with cache-busting");
        if (videoRef.current) {
          const currentSrc = videoRef.current.src;
          const separator = currentSrc.includes("?") ? "&" : "?";
          const cacheBuster = `${separator}t=${Date.now()}`;
          videoRef.current.src = currentSrc + cacheBuster;
        }
      },
    },
    {
      name: "iframe_recreation",
      description: "Force iframe recreation",
      action: () => {
        console.log("🔄 [Recovery] Strategy 2: Force iframe recreation");
        // This would trigger iframe key increment
        return "recreate_iframe";
      },
    },
    {
      name: "url_refresh",
      description: "Refresh with new URL parameters",
      action: () => {
        console.log("🔄 [Recovery] Strategy 3: URL refresh with parameters");
        if (videoRef.current) {
          const baseUrl = url.split("?")[0];
          const newParams = new URLSearchParams();
          newParams.set("autoplay", "true");
          newParams.set("t", Date.now().toString());
          newParams.set("retry", recoveryAttempts.toString());
          videoRef.current.src = `${baseUrl}?${newParams.toString()}`;
        }
      },
    },
    {
      name: "progressive_delay",
      description: "Wait and retry with progressive delay",
      action: () => {
        console.log("🔄 [Recovery] Strategy 4: Progressive delay retry");
        const delay = Math.min(1000 * Math.pow(2, recoveryAttempts), 10000);
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.src = url;
            }
            resolve();
          }, delay);
        });
      },
    },
  ];

  const attemptRecovery = useCallback(
    async (issueType: string) => {
      if (isRecovering) return;

      setIsRecovering(true);
      const currentStrategy = recoveryStrategies[recoveryAttempts % recoveryStrategies.length];

      console.log(`🔄 [Recovery] Attempting recovery for ${issueType} using ${currentStrategy.name}`);

      try {
        const result = await currentStrategy.action();

        if (result === "recreate_iframe") {
          setIsRecovering(false);
          return result;
        }

        // Wait a bit to see if recovery worked
        setTimeout(() => {
          setRecoveryAttempts((prev) => prev + 1);
          setIsRecovering(false);
        }, 2000);
      } catch (error) {
        console.error("❌ [Recovery] Recovery attempt failed:", error);
        setRecoveryAttempts((prev) => prev + 1);
        setIsRecovering(false);
      }
    },
    [isRecovering, recoveryAttempts, recoveryStrategies],
  );

  // Reset recovery attempts when video changes
  useEffect(() => {
    setRecoveryAttempts(0);
  }, [videoId]);

  return {
    attemptRecovery,
    recoveryAttempts,
    isRecovering,
    maxAttempts: recoveryStrategies.length * 2,
  };
};
