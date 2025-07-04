"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type VoiceType = "Professional" | "Casual" | "Friendly" | "Authoritative" | "Conversational";

interface VoiceContextType {
  currentVoice: VoiceType;
  setCurrentVoice: (voice: VoiceType) => void;
  availableVoices: VoiceType[];
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [currentVoice, setCurrentVoice] = useState<VoiceType>("Professional");
  
  const availableVoices: VoiceType[] = [
    "Professional",
    "Casual", 
    "Friendly",
    "Authoritative",
    "Conversational"
  ];

  return (
    <VoiceContext.Provider 
      value={{ 
        currentVoice, 
        setCurrentVoice, 
        availableVoices 
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
} 