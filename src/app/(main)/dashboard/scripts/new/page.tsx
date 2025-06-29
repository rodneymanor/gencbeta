"use client";

import { useState, useEffect } from "react";

import { useSearchParams } from "next/navigation";

import { ArrowRight, Bot, Send, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SPEED_WRITE_CONFIG } from "@/config/speed-write-prompt";

const templates = [
  {
    id: 1,
    title: "Viral Hook Formula",
    description: "Proven formula for creating attention-grabbing openings",
    difficulty: "Beginner",
    engagement: "Very High",
  },
  {
    id: 2,
    title: "Educational Tutorial",
    description: "Step-by-step guide format for teaching concepts",
    difficulty: "Intermediate",
    engagement: "High",
  },
  {
    id: 3,
    title: "Product Review Structure",
    description: "Comprehensive review template with pros and cons",
    difficulty: "Beginner",
    engagement: "Medium",
  },
];

// Helper function to render the template selection step
function TemplateSelectionStep({ onTemplateSelect }: { onTemplateSelect: () => void }) {
  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Choose Your Script Template</h1>
        <p className="text-muted-foreground">Select a proven template to get started</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer transition-all hover:shadow-lg" onClick={onTemplateSelect}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {template.title}
                <ArrowRight className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">{template.description}</p>
              <div className="flex justify-between text-xs">
                <Badge variant="outline">{template.difficulty}</Badge>
                <Badge variant="outline">{template.engagement}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Helper function to render the chat interface step
function ChatInterfaceStep({
  isSpeedWrite,
  initialIdea,
  message,
  setMessage,
  onSendMessage,
  onAssemble,
}: {
  isSpeedWrite: boolean;
  initialIdea: string;
  message: string;
  setMessage: (value: string) => void;
  onSendMessage: () => void;
  onAssemble: () => void;
}) {
  const getAIGreeting = () => {
    if (isSpeedWrite) {
      return SPEED_WRITE_CONFIG.ui.messages.greeting(!!initialIdea, initialIdea);
    }
    return "Hi! I'm here to help you create an amazing script. What topic would you like to focus on?";
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{isSpeedWrite ? "Speed Write Assistant" : "AI Assistant"}</h1>
          {isSpeedWrite && <p className="text-muted-foreground text-sm">{SPEED_WRITE_CONFIG.ui.subtitle}</p>}
        </div>
        <Button onClick={onAssemble}>
          <CheckCircle className="mr-2 h-4 w-4" />
          Assemble Script
        </Button>
      </div>

      {isSpeedWrite && (
        <div className="bg-primary/5 border-primary/20 rounded-lg border p-4">
          <div className="text-sm">
            <p className="mb-2 font-medium">Speed Write Formula:</p>
            <div className="text-muted-foreground grid grid-cols-1 gap-2 text-xs md:grid-cols-4">
              {SPEED_WRITE_CONFIG.ui.formula.steps.map((step, index) => (
                <div key={index}>
                  {index + 1}. <strong>{step.label}:</strong> {step.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <Bot className="mt-1 h-6 w-6" />
            <div className="bg-muted flex-1 rounded-lg p-3">
              <p>{getAIGreeting()}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={
                isSpeedWrite ? SPEED_WRITE_CONFIG.ui.placeholders.chatInput : "Describe your content idea..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <Button onClick={onSendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Helper function to render the assembly step
function AssemblyStep({ isSpeedWrite }: { isSpeedWrite: boolean }) {
  return (
    <>
      <h1 className="text-3xl font-bold">{isSpeedWrite ? "Speed Write Script Assembly" : "Script Assembly"}</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Components</h3>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isSpeedWrite ? "Hook (Start with &ldquo;If...&rdquo;)" : "Hook"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={
                  isSpeedWrite ? SPEED_WRITE_CONFIG.ui.placeholders.hook : "Your attention-grabbing opening..."
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{isSpeedWrite ? "Simple Advice" : "Bridge"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder={isSpeedWrite ? SPEED_WRITE_CONFIG.ui.placeholders.advice : "Your main content..."} />
            </CardContent>
          </Card>

          {isSpeedWrite && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Why It Works (Start with &ldquo;This is...&rdquo;)</CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder={SPEED_WRITE_CONFIG.ui.placeholders.reason} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isSpeedWrite ? "Benefit (Start with &ldquo;So you don&rsquo;t...&rdquo;)" : "Call to Action"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={isSpeedWrite ? SPEED_WRITE_CONFIG.ui.placeholders.benefit : "Your call to action..."}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Preview</h3>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Script preview will appear here...</p>
            </CardContent>
          </Card>

          <Button className="w-full">Create Script</Button>
        </div>
      </div>
    </>
  );
}

export default function NewScriptPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState("template");
  const [message, setMessage] = useState("");
  const [isSpeedWrite, setIsSpeedWrite] = useState(false);
  const [initialIdea, setInitialIdea] = useState("");

  useEffect(() => {
    // Check if we're coming from speed write workflow
    const speedWrite = searchParams.get("speedWrite");
    const idea = searchParams.get("idea");

    if (speedWrite === "true") {
      setIsSpeedWrite(true);
      setStep("chat");
      if (idea) {
        setInitialIdea(decodeURIComponent(idea));
        setMessage(decodeURIComponent(idea));
      }
    }
  }, [searchParams]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    console.log("Sending message to AI:", message);

    if (isSpeedWrite) {
      console.log("Using Speed Write System Prompt:", SPEED_WRITE_CONFIG.systemPrompt);
      // TODO: Send to AI service with SPEED_WRITE_CONFIG.systemPrompt
      // await aiService.generateScript({
      //   systemPrompt: SPEED_WRITE_CONFIG.systemPrompt,
      //   userMessage: message,
      //   type: 'speed-write'
      // });
    }

    // Handle regular script creation or other prompts here
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {step === "template" && !isSpeedWrite && <TemplateSelectionStep onTemplateSelect={() => setStep("chat")} />}

      {step === "chat" && (
        <ChatInterfaceStep
          isSpeedWrite={isSpeedWrite}
          initialIdea={initialIdea}
          message={message}
          setMessage={setMessage}
          onSendMessage={handleSendMessage}
          onAssemble={() => setStep("assembly")}
        />
      )}

      {step === "assembly" && <AssemblyStep isSpeedWrite={isSpeedWrite} />}
    </div>
  );
}
