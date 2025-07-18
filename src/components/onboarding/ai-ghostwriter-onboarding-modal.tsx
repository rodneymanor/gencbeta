"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { AIGhostwriterSetup } from "./ai-ghostwriter-setup";

interface AIGhostwriterOnboardingModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Custom image source for your branding */
  imageSrc?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Callback when onboarding is completed */
  onComplete: (data: { description: string; speaksAbout: string; instructions: string }) => Promise<void>;
  /** Callback to generate topics based on description */
  onGenerateTopics?: (description: string) => Promise<string>;
  /** Loading state for form submission */
  isSubmitting?: boolean;
  /** Loading state for topic generation */
  isGeneratingTopics?: boolean;
  /** Initial form values */
  initialValues?: {
    description?: string;
    speaksAbout?: string;
    instructions?: string;
  };
}

export function AIGhostwriterOnboardingModal({
  open,
  onOpenChange,
  imageSrc,
  imageAlt = "AI Onboarding",
  onComplete,
  onGenerateTopics,
  isSubmitting = false,
  isGeneratingTopics = false,
  initialValues,
}: AIGhostwriterOnboardingModalProps) {
  const handleSubmit = async (data: { description: string; speaksAbout: string; instructions: string }) => {
    try {
      await onComplete(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Handle error (you might want to show a toast or error message)
    }
  };

  const handleHelpClick = () => {
    // You can implement help functionality here
    // For example, open a help dialog or redirect to documentation
    console.log("Help clicked");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl overflow-visible p-0">
        <AIGhostwriterSetup
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          showHelpButton={true}
          onHelpClick={handleHelpClick}
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onGenerateTopics={onGenerateTopics}
          isSubmitting={isSubmitting}
          isGeneratingTopics={isGeneratingTopics}
        />
      </DialogContent>
    </Dialog>
  );
}

export default AIGhostwriterOnboardingModal;
