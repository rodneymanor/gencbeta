"use client";

import { useAuth } from "@/contexts/auth-context";

export function BackgroundSyncIndicator() {
  const { isBackgroundVerifying } = useAuth();

  if (!isBackgroundVerifying) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shadow-sm flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-blue-700 text-sm font-medium">Syncing...</span>
      </div>
    </div>
  );
}