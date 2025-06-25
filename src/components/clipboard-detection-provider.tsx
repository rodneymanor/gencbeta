"use client";

import { useState } from "react";

import { ClipboardDetectionDialog } from "@/components/clipboard-detection-dialog";
import { useAppState } from "@/contexts/app-state-context";
import { useAuth } from "@/contexts/auth-context";
import { useCollectionsSidebar } from "@/hooks/use-collections-sidebar";
import { useClipboardDetection, isTikTokOrInstagramUrl, type ClipboardDetectionResult } from "@/lib/clipboard-detector";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

interface ClipboardDetectionProviderProps {
  children: React.ReactNode;
}

export function ClipboardDetectionProvider({ children }: ClipboardDetectionProviderProps) {
  const [detectedUrl, setDetectedUrl] = useState<ClipboardDetectionResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [hasShownForCurrentUrl, setHasShownForCurrentUrl] = useState<string>("");

  const { user } = useAuth();
  const { busyState } = useAppState();
  const { collections, refreshCollections } = useCollectionsSidebar(sidebarItems);

  // Only enable clipboard detection when user is authenticated
  useClipboardDetection(
    {
      onDetected: (result) => {
        // Only show dialog for TikTok/Instagram URLs, if we haven't shown it for this URL already,
        // and if the app is not currently busy with other operations
        if (isTikTokOrInstagramUrl(result.url) && result.url !== hasShownForCurrentUrl && !busyState.isAnyBusy) {
          console.log("📋 [CLIPBOARD] Showing detection dialog for URL:", result.url);
          setDetectedUrl(result);
          setShowDialog(true);
          setHasShownForCurrentUrl(result.url);
        } else if (busyState.isAnyBusy) {
          console.log("📋 [CLIPBOARD] Skipping detection - app is busy:", {
            isVideoProcessing: busyState.isVideoProcessing,
            isScriptCreating: busyState.isScriptCreating,
            isTranscribing: busyState.isTranscribing,
          });
        }
      },
      onError: (error) => {
        console.log("Clipboard detection error:", error);
      },
      onPermissionDenied: () => {
        console.log("Clipboard permission denied");
      },
    },
    {
      enabled: !!user, // Only enable when user is logged in
      checkDelay: 1500, // Wait 1.5 seconds after page load
      checkOnMount: true,
    },
  );

  const handleCloseDialog = () => {
    setShowDialog(false);
    setDetectedUrl(null);
  };

  const handleRefreshCollections = () => {
    refreshCollections();
  };

  return (
    <>
      {children}
      <ClipboardDetectionDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        detectedUrl={detectedUrl}
        collections={collections}
        onRefreshCollections={handleRefreshCollections}
      />
    </>
  );
}
