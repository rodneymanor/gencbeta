"use client";

import { AIVoice, CustomVoiceLimit } from "@/types/ai-voices";
import { VoiceCard } from "./voice-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Mic, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CustomVoicesTabProps {
  voices: AIVoice[];
  voiceLimit?: CustomVoiceLimit;
  isLoading: boolean;
  onCreateVoice: () => void;
  onUseVoice: (voice: AIVoice) => void;
  onShowExamples: (voice: AIVoice) => void;
  onDeleteVoice: (voiceId: string) => void;
}

export function CustomVoicesTab({
  voices,
  voiceLimit,
  isLoading,
  onCreateVoice,
  onUseVoice,
  onShowExamples,
  onDeleteVoice,
}: CustomVoicesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const canCreateVoice = voiceLimit ? voiceLimit.remaining > 0 : false;

  return (
    <div className="space-y-6">
      {/* Voice Limit Alert */}
      {voiceLimit && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have <strong>{voiceLimit.remaining}</strong> voices remaining until your plan renews on July 5, 2025.
            Custom voices allow you to create tailored content that matches your unique style.
            {voiceLimit.remaining === 0 && (
              <Button variant="link" className="text-primary ml-2 h-auto p-0">
                Upgrade for more →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Your Custom Voices</h2>
          <p className="text-muted-foreground">Manage and customize your AI writing voices</p>
        </div>

        {/* Voice Limit Indicator */}
        <div className="flex items-center gap-4">
          {voiceLimit && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Mic className="h-4 w-4" />
                <span className="font-medium">Voice Limit</span>
              </div>
              <div className="text-muted-foreground">
                {voiceLimit.used} / {voiceLimit.total} used
              </div>
              <div className="text-muted-foreground text-xs">Resets Jul 5</div>
            </div>
          )}

          <Button onClick={onCreateVoice} disabled={!canCreateVoice} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create AI Voice
          </Button>
        </div>
      </div>

      {/* Custom Voices Grid */}
      {voices.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {voices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onUseVoice={() => onUseVoice(voice)}
              onShowExamples={() => onShowExamples(voice)}
              onDeleteVoice={() => onDeleteVoice(voice.id)}
              showDeleteButton={true}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="space-y-4">
              <div className="bg-muted mx-auto flex h-12 w-12 items-center justify-center rounded-lg">
                <Mic className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No custom voices yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Create your first custom voice by analyzing a creator&apos;s profile. Generate content that matches
                  their unique style and tone.
                </p>
              </div>
              <Button onClick={onCreateVoice} disabled={!canCreateVoice} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Voice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
