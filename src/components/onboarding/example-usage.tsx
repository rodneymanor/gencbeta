"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIGhostwriterOnboardingModal } from "./ai-ghostwriter-onboarding-modal";

// Example usage component
export function OnboardingExample() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);

  const handleComplete = async (data: { description: string; speaksAbout: string; instructions: string }) => {
    setIsSubmitting(true);

    try {
      // Simulate API call to save onboarding data
      console.log("Saving onboarding data:", data);

      // Example API call:
      // const response = await fetch("/api/user/onboarding", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });

      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Handle success (maybe redirect or show success message)
      console.log("Onboarding completed successfully!");
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTopics = async (description: string): Promise<string> => {
    setIsGeneratingTopics(true);

    try {
      // Simulate AI topic generation
      console.log("Generating topics for:", description);

      // Example API call:
      // const response = await fetch("/api/ai/generate-topics", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ description }),
      // });
      // const result = await response.json();

      // Simulate delay and return mock topics
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockTopics = [
        "Content creation strategies",
        "Social media optimization",
        "Personal branding tips",
        "Digital marketing insights",
        "Audience engagement techniques",
      ].join(", ");

      return mockTopics;
    } catch (error) {
      console.error("Failed to generate topics:", error);
      throw error;
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  return (
    <div className="p-8">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">AI Ghostwriter Onboarding Demo</h1>
        <p className="mb-8 text-gray-600">Click the button below to open the onboarding modal</p>

        <Button onClick={() => setIsOnboardingOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-700">
          Start Onboarding
        </Button>
      </div>

      <AIGhostwriterOnboardingModal
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        imageSrc="/img/your-custom-image.png" // Replace with your image
        imageAlt="Your Custom AI Illustration"
        onComplete={handleComplete}
        onGenerateTopics={handleGenerateTopics}
        isSubmitting={isSubmitting}
        isGeneratingTopics={isGeneratingTopics}
        initialValues={{
          description: "",
          speaksAbout: "",
          instructions: "",
        }}
      />
    </div>
  );
}

export default OnboardingExample;
