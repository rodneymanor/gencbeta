"use client";

import { VoiceActivationResponse } from "@/types/ai-voices";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface VoiceActivatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activationResponse: VoiceActivationResponse | null;
}

export function VoiceActivatedModal({ open, onOpenChange, activationResponse }: VoiceActivatedModalProps) {
  if (!activationResponse) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Voice Activated
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">{activationResponse.voiceName}</h3>
            <p className="text-muted-foreground">{activationResponse.message}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              Your selected voice is now active and will be used for all new script generation. You can change your
              active voice at any time from the Voices page.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
