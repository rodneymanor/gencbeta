"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { VoiceInput } from "@/components/ui/voice-input";
import type { BrandQuestionnaire } from "@/types/brand-profile";

interface QuestionCardProps {
  question: {
    id: keyof BrandQuestionnaire;
    title: string;
    description: string;
    placeholder: string;
  };
  index: number;
  value: string;
  onChange: (value: string) => void;
  onVoiceTranscription: (transcription: string) => void;
}

export function QuestionCard({ question, index, value, onChange, onVoiceTranscription }: QuestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index + 1}. {question.title}
        </CardTitle>
        <CardDescription>{question.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Label htmlFor={question.id}>{question.title}</Label>
          <div className="relative">
            <Textarea
              id={question.id}
              placeholder={question.placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[100px] resize-none pr-12"
            />
            <div className="absolute right-3 bottom-3">
              <VoiceInput onTranscription={onVoiceTranscription} placeholder={`Voice input for ${question.title}`} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
