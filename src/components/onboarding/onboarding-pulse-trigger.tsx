"use client";

import React, { useState } from "react";

import { PulseCircle } from "@/components/ui/pulse-circle";

import { AIGhostwriterOnboardingModal } from "./ai-ghostwriter-onboarding-modal";

interface OnboardingPulseTriggerProps {
  /** Position on screen */
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left" | "center-right";
  /** Custom positioning */
  customPosition?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** Size of the pulse circle */
  size?: number;
  /** Custom image for the onboarding */
  onboardingImageSrc?: string;
  /** Whether to show the pulse (can be controlled externally) */
  showPulse?: boolean;
  /** Callback when onboarding is completed */
  onComplete?: (data: { description: string; speaksAbout: string; instructions: string }) => Promise<void>;
  /** Callback to generate topics */
  onGenerateTopics?: (description: string) => Promise<string>;
  /** Custom color for the pulse */
  color?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Custom Z-index */
  zIndex?: number;
}

const positionClasses = {
  "top-right": "top-6 right-6",
  "bottom-right": "bottom-6 right-6",
  "top-left": "top-6 left-6",
  "bottom-left": "bottom-6 left-6",
  "center-right": "top-1/2 right-6 -translate-y-1/2",
};

export function OnboardingPulseTrigger({
  position = "bottom-right",
  customPosition,
  size = 10,
  onboardingImageSrc,
  showPulse = true,
  onComplete,
  onGenerateTopics,
  color = "hsl(var(--primary))", // Theme primary color
  tooltip = "Get AI-powered content ideas",
  zIndex = 50,
}: OnboardingPulseTriggerProps) {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  const handleOpenOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  const handleComplete = async (data: { description: string; speaksAbout: string; instructions: string }) => {
    if (onComplete) {
      setIsSubmitting(true);
      try {
        await onComplete(data);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGenerateTopics = async (description: string): Promise<string> => {
    if (onGenerateTopics) {
      setIsGeneratingTopics(true);
      try {
        return await onGenerateTopics(description);
      } finally {
        setIsGeneratingTopics(false);
      }
    }
    return "";
  };

  const positionStyle = customPosition || {};
  const positionClass = !customPosition ? positionClasses[position] : "";

  if (!showPulse) {
    return null;
  }

  return (
    <>
      {/* Pulse Circle Trigger */}
      <div
        className={`fixed ${positionClass} group transition-all duration-300 hover:scale-110`}
        style={{
          zIndex,
          ...positionStyle,
        }}
        title={tooltip}
      >
        <PulseCircle
          size={size}
          color={color}
          onClick={handleOpenOnboarding}
          className="shadow-lg transition-shadow duration-300 group-hover:shadow-xl"
        >
          <div
            className="rounded-full bg-white"
            style={{
              width: size * 0.3,
              height: size * 0.3,
            }}
          />
        </PulseCircle>

        {/* Tooltip on hover */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="rounded-lg bg-gray-900 px-3 py-1 text-sm whitespace-nowrap text-white">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <AIGhostwriterOnboardingModal
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        imageSrc={onboardingImageSrc}
        onComplete={handleComplete}
        onGenerateTopics={handleGenerateTopics}
        isSubmitting={isSubmitting}
        isGeneratingTopics={isGeneratingTopics}
      />
    </>
  );
}

export default OnboardingPulseTrigger;
