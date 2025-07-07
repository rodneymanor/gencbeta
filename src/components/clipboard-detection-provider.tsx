"use client";

import React, { useState, useRef } from "react";

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
  const hasInitializedRef = useRef(false);

  const { user } = useAuth();
  const { busyState } = useAppState();
  const { collections, refreshCollections } = useCollectionsSidebar(sidebarItems);

  // Check clipboard once on page load when user is authenticated
  useClipboardDetection(
    {
      onDetected: (result) => {
        // Only show dialog for TikTok/Instagram URLs and if we haven't shown it for this URL already
        // Don't check busy state here - if we detect on page load, show immediately
        if (isTikTokOrInstagramUrl(result.url) && result.url !== hasShownForCurrentUrl) {
          console.log("📋 [CLIPBOARD] Showing detection dialog for URL:", result.url);
          setDetectedUrl(result);
          setShowDialog(true);
          setHasShownForCurrentUrl(result.url);
        } else if (!isTikTokOrInstagramUrl(result.url)) {
          console.log("📋 [CLIPBOARD] Ignoring non-TikTok/Instagram URL:", result.platform, result.url);
        } else if (result.url === hasShownForCurrentUrl) {
          console.log("📋 [CLIPBOARD] Already shown dialog for this URL:", result.url);
        }
      },
      onError: (error) => {
        console.log("📋 [CLIPBOARD] Detection error:", error);
      },
      onPermissionDenied: () => {
        console.log("📋 [CLIPBOARD] Permission denied - user needs to allow clipboard access");
      },
    },
    {
      enabled: !!user && !hasInitializedRef.current, // Only enable when user is logged in and not already initialized
      checkDelay: 1500, // Wait 1.5 seconds after page load for single check
      checkOnMount: true, // Only check once on component mount
    },
  );

  // Mark as initialized after first mount - use useEffect to ensure this happens after render
  React.useEffect(() => {
    if (!!user && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
    }
  }, [user]);

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
