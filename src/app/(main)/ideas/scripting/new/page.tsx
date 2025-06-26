"use client";

import { useState } from "react";

import { ArrowRight, Bot, Send, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

export default function NewScriptPage() {
  const [step, setStep] = useState("template");
  const [message, setMessage] = useState("");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {step === "template" && (
        <>
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Choose Your Script Template</h1>
            <p className="text-muted-foreground">Select a proven template to get started</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setStep("chat")}
              >
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
      )}

      {step === "chat" && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">AI Assistant</h1>
            <Button onClick={() => setStep("assembly")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Assemble Script
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <Bot className="mt-1 h-6 w-6" />
                <div className="bg-muted flex-1 rounded-lg p-3">
                  <p>Hi! I&apos;m here to help you create an amazing script. What topic would you like to focus on?</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Describe your content idea..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === "assembly" && (
        <>
          <h1 className="text-3xl font-bold">Script Assembly</h1>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Components</h3>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hook</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input placeholder="Your attention-grabbing opening..." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bridge</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input placeholder="Your main content..." />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Call to Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input placeholder="Your call to action..." />
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
      )}
    </div>
  );
}
