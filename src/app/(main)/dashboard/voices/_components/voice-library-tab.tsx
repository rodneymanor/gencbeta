"use client";

import { AIVoice } from "@/types/ai-voices";
import { VoiceCard } from "./voice-card";
import { Skeleton } from "@/components/ui/skeleton";

interface VoiceLibraryTabProps {
  voices: AIVoice[];
  isLoading: boolean;
  onUseVoice: (voice: AIVoice) => void;
  onShowExamples: (voice: AIVoice) => void;
}

export function VoiceLibraryTab({ voices, isLoading, onUseVoice, onShowExamples }: VoiceLibraryTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Voice Library</h2>
        <p className="text-muted-foreground">
          Choose from our collection of AI voices designed for personal brand building.
        </p>
      </div>

      {/* Voice Grid */}
      {voices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onUseVoice={() => onUseVoice(voice)}
              onShowExamples={() => onShowExamples(voice)}
              showDeleteButton={false}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">No voices available</h3>
            <p className="text-muted-foreground">Voice library is currently empty. Check back later for new voices.</p>
          </div>
        </div>
      )}
    </div>
  );
}
