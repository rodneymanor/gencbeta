"use client";

import React, { useState } from "react";
import { ArrowRight, Lightbulb, Info, HelpCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

interface AIGhostwriterSetupProps {
  /** Image source for the left side illustration */
  imageSrc?: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Whether to show the help button */
  showHelpButton?: boolean;
  /** Callback when help button is clicked */
  onHelpClick?: () => void;
  /** Initial form values */
  initialValues?: {
    description?: string;
    speaksAbout?: string;
    instructions?: string;
  };
  /** Callback when form is submitted */
  onSubmit: (data: FormData) => Promise<void>;
  /** Callback to generate topics based on description */
  onGenerateTopics?: (description: string) => Promise<string>;
  /** Loading state for form submission */
  isSubmitting?: boolean;
  /** Loading state for topic generation */
  isGeneratingTopics?: boolean;
}

interface FormData {
  description: string;
  speaksAbout: string;
  instructions: string;
}

interface StylePreset {
  id: string;
  label: string;
  instructions: string;
}

const stylePresets: StylePreset[] = [
  {
    id: "profound",
    label: "Profound",
    instructions: "be profound, deep, philosophical - think of yourself as a modern-day philosopher",
  },
  {
    id: "professional",
    label: "Professional",
    instructions:
      "be professional, formal, authoritative - think of yourself as a CEO giving profound insights about your industry in a succinct, hard hitting way.",
  },
  {
    id: "personal",
    label: "Personal",
    instructions:
      "here's my story:\n[note: insert your story here]\n\nwrite in first person, share personal stories, be vulnerable, yet retain authority. show teachings from your own life whilst coming from the perspective of a teacher.\n\nuse aspects of my story intermittently throughout the content.",
  },
  {
    id: "controversial",
    label: "Controversial",
    instructions:
      "be controversial, outspoken, even rude - we are using tough love to whip people into shape. do not use expletives.\n\nteach with the tone of a pissed off dad shouting at his son.",
  },
];

export function AIGhostwriterSetup({
  imageSrc = "/img/ai_hand.png",
  imageAlt = "AI Hand Illustration",
  showHelpButton = true,
  onHelpClick,
  initialValues = {},
  onSubmit,
  onGenerateTopics,
  isSubmitting = false,
  isGeneratingTopics = false,
}: AIGhostwriterSetupProps) {
  const [formData, setFormData] = useState<FormData>({
    description: initialValues.description || "",
    speaksAbout: initialValues.speaksAbout || "",
    instructions: initialValues.instructions || "",
  });

  const [shimmerEffect, setShimmerEffect] = useState(false);

  // Shimmer effect for submit button
  React.useEffect(() => {
    const interval = setInterval(() => {
      setShimmerEffect(true);
      setTimeout(() => setShimmerEffect(false), 1000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStyleSelect = (styleId: string) => {
    const preset = stylePresets.find((p) => p.id === styleId);
    if (preset) {
      handleInputChange("instructions", preset.instructions);
    }
  };

  const handleGenerateTopics = async () => {
    if (!onGenerateTopics || !formData.description.trim()) return;

    try {
      const generatedTopics = await onGenerateTopics(formData.description);
      handleInputChange("speaksAbout", generatedTopics);
    } catch (error) {
      console.error("Failed to generate topics:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="overflow-visible">
      <form onSubmit={handleSubmit}>
        <div className="flex">
          {/* Left side - Image */}
          <div className="hidden w-1/3 md:block">
            <img src={imageSrc} alt={imageAlt} className="h-full w-full rounded-l-lg object-cover" />
          </div>

          {/* Right side - Form */}
          <div className="w-full p-8 md:w-2/3">
            {/* Help Button */}
            {showHelpButton && (
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={onHelpClick}
                  className="rounded-full bg-indigo-100 p-2 text-indigo-700 transition-colors duration-200 hover:bg-indigo-200"
                  title="Watch help video"
                >
                  <HelpCircle className="h-8 w-8" />
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Customize Your AI Ghostwriter ✨</h2>
              <p className="mt-2 text-gray-600">Help us understand your style to create content</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Description Field */}
              <div className="border-b border-gray-200 pb-4">
                <label htmlFor="my-description" className="mb-1 block text-sm font-medium text-gray-700">
                  Your Overview
                </label>
                <input
                  id="my-description"
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Building the world's smartest AI writer for Threads"
                />
                <p className="mt-1 text-xs text-gray-500">
                  A brief description of you - think of it as your elevator pitch
                </p>
              </div>

              {/* Topics Field */}
              <div className="border-b border-gray-200 pb-4">
                <div className="mb-2 flex items-end justify-between">
                  <label htmlFor="i-speak-about" className="block text-sm font-medium text-gray-700">
                    Topics You Speak About
                  </label>
                  {onGenerateTopics && (
                    <button
                      type="button"
                      onClick={handleGenerateTopics}
                      disabled={isGeneratingTopics || !formData.description.trim()}
                      className="flex items-center space-x-1.5 rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-700 transition-colors duration-200 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Use our AI to suggest topics based on your description"
                    >
                      {isGeneratingTopics ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Lightbulb className="h-4 w-4" />
                      )}
                      <span>{isGeneratingTopics ? "Generating..." : "Suggest Topics"}</span>
                    </button>
                  )}
                </div>
                <textarea
                  id="i-speak-about"
                  rows={3}
                  value={formData.speaksAbout}
                  onChange={(e) => handleInputChange("speaksAbout", e.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Improving your personal brand on Threads, optimizing your Threads profile, the power of owning your brand"
                />
                <p className="mt-1 text-xs text-gray-500">
                  List the main topics you write about -{" "}
                  <span className="rounded-lg border bg-yellow-50 px-1">separated by commas</span>
                </p>
              </div>

              {/* Guidelines Field */}
              <div>
                <div className="mb-2 inline-flex items-center">
                  <label className="block text-sm font-medium text-gray-700">Guidelines</label>
                  <span className="ml-1.5 inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 ring-1 ring-purple-700/10 ring-inset">
                    <Info className="mr-1.5 h-4 w-4" />
                    Optional
                  </span>
                </div>

                <p className="mb-3 text-sm text-gray-500">
                  Choose a preset style or add your own guidelines. This helps tailor the AI-generated content to your
                  preferences.
                </p>

                {/* Style Preset Buttons */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {stylePresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleStyleSelect(preset.id)}
                      className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={formData.instructions}
                    onChange={(e) => handleInputChange("instructions", e.target.value)}
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Add guidelines for your content (e.g., 'Use a mix of data and storytelling' or 'Focus on blockchain technology trends')"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Include both how your content should be written (style) and what it should be about (subject). Be
                    specific about tone, topics, and approach.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-bold text-white shadow-md transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  shimmerEffect ? "shimmer-effect" : ""
                }`}
              >
                <span className="flex items-center justify-center">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Activate Your AI Ghostwriter
                      <ArrowRight className="ml-2 inline-block h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <style jsx>{`
        .shimmer-effect::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 1s ease-in-out;
        }

        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default AIGhostwriterSetup;
