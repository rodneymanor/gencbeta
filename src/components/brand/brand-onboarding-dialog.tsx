"use client";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInput } from "@/components/ui/voice-input";
import { BrandProfileService } from "@/lib/brand-profile";
import type { BrandQuestionnaire, BrandProfile } from "@/types/brand-profile";

interface BrandOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (profile: BrandProfile) => void;
}

const QUESTIONS = [
  {
    id: "profession" as keyof BrandQuestionnaire,
    title: "What's your profession or business?",
    description: "Tell us about what you do professionally or the business you're in.",
    placeholder: "e.g., Digital marketing consultant, Fitness trainer, SaaS founder...",
  },
  {
    id: "brandPersonality" as keyof BrandQuestionnaire,
    title: "Describe your brand personality",
    description: "How would you describe your brand's voice and personality?",
    placeholder: "e.g., Professional yet approachable, Bold and innovative, Warm and trustworthy...",
  },
  {
    id: "universalProblem" as keyof BrandQuestionnaire,
    title: "What's a universal problem your audience faces?",
    description: "What challenge does almost everyone in your target market struggle with?",
    placeholder: "e.g., Struggling to get consistent leads, Feeling overwhelmed by technology...",
  },
  {
    id: "initialHurdle" as keyof BrandQuestionnaire,
    title: "What's the biggest obstacle to getting started?",
    description: "What prevents people from taking the first step toward solving their problem?",
    placeholder: "e.g., Not knowing where to begin, Fear of making mistakes, Lack of budget...",
  },
  {
    id: "persistentStruggle" as keyof BrandQuestionnaire,
    title: "What ongoing problem do existing clients face?",
    description: "Even after people start, what do they continue to struggle with?",
    placeholder: "e.g., Staying consistent, Measuring results, Scaling their efforts...",
  },
  {
    id: "visibleTriumph" as keyof BrandQuestionnaire,
    title: "What public result do clients want?",
    description: "What visible, measurable outcome do your clients desire most?",
    placeholder: "e.g., 6-figure business, 50-pound weight loss, Featured in major publications...",
  },
  {
    id: "ultimateTransformation" as keyof BrandQuestionnaire,
    title: "What's the ultimate life transformation?",
    description: "What deeper, life-changing impact do your clients ultimately want?",
    placeholder: "e.g., Financial freedom, Confidence and energy, Being recognized as an expert...",
  },
];

export function BrandOnboardingDialog({ open, onOpenChange, onComplete }: BrandOnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<BrandQuestionnaire>>({});
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const queryClient = useQueryClient();

  const generateProfileMutation = useMutation({
    mutationFn: (questionnaire: BrandQuestionnaire) => BrandProfileService.generateBrandProfile(questionnaire),
    onSuccess: (profile) => {
      BrandProfileService.markOnboardingComplete();
      queryClient.invalidateQueries({ queryKey: ["brand-profiles"] });
      onComplete(profile);
      toast.success("Brand profile generated successfully!", {
        description: "Your personalized content strategy is ready.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to generate brand profile", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const currentQuestion = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleAnswerChange = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleVoiceTranscription = (transcription: string) => {
    const currentAnswer = answers[currentQuestion.id] ?? "";
    const newAnswer = currentAnswer ? `${currentAnswer} ${transcription}` : transcription;
    handleAnswerChange(newAnswer);
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    const questionnaire = answers as BrandQuestionnaire;

    // Validate all fields are filled
    const missingFields = QUESTIONS.filter((q) => !questionnaire[q.id]?.trim());
    if (missingFields.length > 0) {
      toast.error("Please complete all questions", {
        description: `Missing: ${missingFields.map((f) => f.title).join(", ")}`,
      });
      return;
    }

    generateProfileMutation.mutate(questionnaire);
  };

  const handleClose = () => {
    if (neverShowAgain) {
      BrandProfileService.setNeverShowAgain();
    }
    onOpenChange(false);
  };

  const canProceed = answers[currentQuestion.id]?.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary h-5 w-5" />
            Brand Profile Setup
          </DialogTitle>
          <DialogDescription>
            Let&apos;s create your personalized brand strategy. This will generate custom content pillars and keywords
            for your business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span>
                Step {currentStep + 1} of {QUESTIONS.length}
              </span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.title}</CardTitle>
              <CardDescription>{currentQuestion.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="answer">Your answer</Label>
                <div className="relative">
                  <Textarea
                    id="answer"
                    placeholder={currentQuestion.placeholder}
                    value={answers[currentQuestion.id] ?? ""}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="min-h-[120px] pr-16"
                  />
                  <div className="absolute top-2 right-2">
                    <VoiceInput
                      onTranscription={handleVoiceTranscription}
                      onError={(error) => toast.error("Voice input failed", { description: error })}
                      className="h-8 w-8"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {/* Never show again checkbox on last step */}
              {isLastStep && (
                <div className="mr-4 flex items-center gap-2">
                  <Checkbox
                    id="never-show"
                    checked={neverShowAgain}
                    onCheckedChange={(checked) => setNeverShowAgain(checked === true)}
                  />
                  <Label htmlFor="never-show" className="text-muted-foreground text-sm">
                    Don&apos;t show this again
                  </Label>
                </div>
              )}

              {isLastStep ? (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed || generateProfileMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {generateProfileMutation.isPending ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Generate Profile
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Error Display */}
          {generateProfileMutation.isError && (
            <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {generateProfileMutation.error instanceof Error
                  ? generateProfileMutation.error.message
                  : "Failed to generate profile"}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
