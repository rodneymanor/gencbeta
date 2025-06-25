"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";

interface AppBusyState {
  isVideoProcessing: boolean;
  isScriptCreating: boolean;
  isTranscribing: boolean;
  isAnyBusy: boolean;
}

interface AppStateContextType {
  busyState: AppBusyState;
  setVideoProcessing: (processing: boolean) => void;
  setScriptCreating: (creating: boolean) => void;
  setTranscribing: (transcribing: boolean) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [isScriptCreating, setIsScriptCreating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const busyState: AppBusyState = {
    isVideoProcessing,
    isScriptCreating,
    isTranscribing,
    isAnyBusy: isVideoProcessing || isScriptCreating || isTranscribing,
  };

  const setVideoProcessing = (processing: boolean) => {
    console.log("🔄 [APP_STATE] Video processing state:", processing);
    setIsVideoProcessing(processing);
  };

  const setScriptCreating = (creating: boolean) => {
    console.log("✍️ [APP_STATE] Script creating state:", creating);
    setIsScriptCreating(creating);
  };

  const setTranscribing = (transcribing: boolean) => {
    console.log("🎬 [APP_STATE] Transcribing state:", transcribing);
    setIsTranscribing(transcribing);
  };

  const contextValue = useMemo(
    () => ({
      busyState,
      setVideoProcessing,
      setScriptCreating,
      setTranscribing,
    }),
    [busyState],
  );

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
