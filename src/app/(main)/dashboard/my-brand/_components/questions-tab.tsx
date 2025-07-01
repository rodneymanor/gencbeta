"use client";

import { useState, useEffect } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandProfile, BrandQuestionnaire } from "@/types/brand-profile";

import { QuestionCard } from "./question-card";

interface QuestionsTabProps {
  profile: BrandProfile | null | undefined;
  onProfileGenerated: () => void;
}

const QUESTIONS = [
  {
    id: "profession" as keyof BrandQuestionnaire,
    title: "Business/Profession",
    description: "What is your business or profession?",
    placeholder: "e.g., Digital marketing consultant for small businesses...",
  },
  {
    id: "brandPersonality" as keyof BrandQuestionnaire,
    title: "Brand Personality",
    description: "How would you describe your brand's personality and voice?",
    placeholder: "e.g., Professional yet approachable, data-driven but human-centered...",
  },
  {
    id: "universalProblem" as keyof BrandQuestionnaire,
    title: "Universal Problem",
    description: "What's a common challenge that affects a broad audience in your space?",
    placeholder: "e.g., Small businesses struggle to create consistent content that converts...",
  },
  {
    id: "initialHurdle" as keyof BrandQuestionnaire,
    title: "Initial Hurdle",
    description: "What's the biggest obstacle people face when getting started with your solution?",
    placeholder: "e.g., They don't know where to start with content strategy...",
  },
  {
    id: "persistentStruggle" as keyof BrandQuestionnaire,
    title: "Persistent Struggle",
    description: "What ongoing problem do your existing clients still face?",
    placeholder: "e.g., Maintaining content consistency while running their business...",
  },
  {
    id: "visibleTriumph" as keyof BrandQuestionnaire,
    title: "Visible Triumph",
    description: "What public-facing result do your clients want to achieve?",
    placeholder: "e.g., Being recognized as a thought leader in their industry...",
  },
  {
    id: "ultimateTransformation" as keyof BrandQuestionnaire,
    title: "Ultimate Transformation",
    description: "What life-altering impact do your clients want?",
    placeholder: "e.g., Freedom to scale their business without being tied to daily operations...",
  },
];

function ActionButtons({
  profile,
  hasUnsavedChanges,
  isSaving,
  isFormValid,
  isGenerating,
  onSave,
  onGenerate,
}: {
  profile: BrandProfile | null | undefined;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isFormValid: boolean;
  isGenerating: boolean;
  onSave: () => void;
  onGenerate: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {profile && hasUnsavedChanges && (
        <Button onClick={onSave} disabled={isSaving} variant="outline" size="sm">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      )}
      <Button onClick={onGenerate} disabled={!isFormValid || isGenerating} className="flex items-center gap-2">
        {profile ? (
          <>
            <RotateCcw className="h-4 w-4" />
            {isGenerating ? "Regenerating..." : "Regenerate"}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Profile"}
          </>
        )}
      </Button>
    </div>
  );
}

export function QuestionsTab({ profile, onProfileGenerated }: QuestionsTabProps) {
  const [answers, setAnswers] = useState<BrandQuestionnaire>({
    profession: "",
    brandPersonality: "",
    universalProblem: "",
    initialHurdle: "",
    persistentStruggle: "",
    visibleTriumph: "",
    ultimateTransformation: "",
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();

  // Load existing answers
  useEffect(() => {
    if (profile?.questionnaire) {
      setAnswers(profile.questionnaire);
      setHasUnsavedChanges(false);
    }
  }, [profile]);

  // Generate profile mutation
  const generateProfileMutation = useMutation({
    mutationFn: (questionnaire: BrandQuestionnaire) => BrandProfileService.generateBrandProfile(questionnaire),
    onSuccess: () => {
      toast.success("Brand profile generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      setHasUnsavedChanges(false);
      onProfileGenerated();
    },
    onError: (error) => {
      toast.error("Failed to generate brand profile", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { questionnaire: BrandQuestionnaire }) =>
      BrandProfileService.updateBrandProfile(profile!.id, data),
    onSuccess: () => {
      toast.success("Questions saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      setHasUnsavedChanges(false);
    },
    onError: () => {
      toast.error("Failed to save questions");
    },
  });

  const handleAnswerChange = (questionId: keyof BrandQuestionnaire, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleVoiceTranscription = (questionId: keyof BrandQuestionnaire, transcription: string) => {
    const currentAnswer = answers[questionId];
    const newValue = currentAnswer ? `${currentAnswer} ${transcription}` : transcription;
    handleAnswerChange(questionId, newValue);
  };

  const handleSave = () => {
    if (profile) {
      updateProfileMutation.mutate({ questionnaire: answers });
    }
  };

  const handleGenerate = () => {
    // Validate all fields are filled
    const missingFields = QUESTIONS.filter((q) => !answers[q.id]?.trim());
    if (missingFields.length > 0) {
      toast.error("Please complete all questions", {
        description: `Missing: ${missingFields.map((f) => f.title).join(", ")}`,
      });
      return;
    }

    generateProfileMutation.mutate(answers);
  };

  const isFormValid = QUESTIONS.every((q) => answers[q.id]?.trim());
  const isGenerating = generateProfileMutation.isPending;
  const isSaving = updateProfileMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brand Questionnaire</CardTitle>
              <CardDescription>
                Answer these questions to define your brand identity and generate personalized strategies
              </CardDescription>
            </div>
            <ActionButtons
              profile={profile}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              isFormValid={isFormValid}
              isGenerating={isGenerating}
              onSave={handleSave}
              onGenerate={handleGenerate}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="grid gap-6">
        {QUESTIONS.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            value={answers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            onVoiceTranscription={(transcription) => handleVoiceTranscription(question.id, transcription)}
          />
        ))}
      </div>

      {/* Bottom Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              {isFormValid
                ? "All questions completed. Ready to generate your brand profile!"
                : `Complete ${QUESTIONS.length - QUESTIONS.filter((q) => answers[q.id]?.trim()).length} more questions`}
            </div>
            <ActionButtons
              profile={profile}
              hasUnsavedChanges={hasUnsavedChanges}
              isSaving={isSaving}
              isFormValid={isFormValid}
              isGenerating={isGenerating}
              onSave={handleSave}
              onGenerate={handleGenerate}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
