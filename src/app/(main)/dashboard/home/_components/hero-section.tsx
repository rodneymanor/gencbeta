"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand, Bot, X, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Data Mocks ---
const tones = [
  {
    id: "hormozi",
    name: "Alex Hormozi",
    description: "Direct, value-driven, and authoritative.",
    style: "Uses strong claims, frameworks, and clear calls to action.",
    emoji: "💪",
  },
  {
    id: "garyvee",
    name: "Gary Vaynerchuk",
    description: "High-energy, motivational, and empathetic.",
    style: "Focuses on passion, hustle, and audience connection.",
    emoji: "🚀",
  },
  {
    id: "sinek",
    name: "Simon Sinek",
    description: "Inspirational, purpose-focused, and calm.",
    style: "Starts with 'Why', tells stories, and builds to a concept.",
    emoji: "🧠",
  },
];

interface Template {
  id: string;
  name: string;
  structure: string;
  template: string;
}

const templatesByTone: { [key: string]: Template[] } = {
  hormozi: [
    {
      id: "hormozi-1",
      name: "Grand Slam Offer",
      structure: "Problem → Solution → Scarcity → CTA",
      template:
        "Struggling with {problem}? My {framework_name} framework helps you achieve {desired_outcome} without {pain_point}. For a limited time, get it for just {cost}. Click the link to start.",
    },
    {
      id: "hormozi-2",
      name: "Value Equation",
      structure: "Dream Outcome → Likelihood → Time Delay → Effort",
      template:
        "Imagine achieving your {dream_outcome}. With my system, the likelihood is high, time delay is minimal, and the effort required is low. I'll show you how to get there.",
    },
  ],
  garyvee: [
    {
      id: "garyvee-1",
      name: "Jab, Jab, Jab, Right Hook",
      structure: "Value → Value → Value → Ask",
      template:
        "Here's a free tip on {topic}. Another thing you can do is {free_tip_2}. And one more thing: {free_tip_3}. If you want to go deeper, check out my new {product_name}.",
    },
  ],
  sinek: [
    {
      id: "sinek-1",
      name: "Start With Why",
      structure: "Why → How → What",
      template:
        "We believe that {core_belief}. The way we challenge the status quo is by {how_we_do_it}. We just happen to make great {product_or_service}. Want to learn more?",
    },
  ],
};

const inputModes = {
  original: "Start with a video idea, topic, or a question for your audience...",
  fixer: "Paste your script here and I'll help you fix the flow, clarity, and impact...",
  rewriter: "Paste your script here and I'll rewrite it in a different style or tone...",
};

type InputMode = keyof typeof inputModes;

export default function HeroSection() {
  const [videoIdea, setVideoIdea] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("original");
  const [isStoryPanelOpen, setIsStoryPanelOpen] = useState(false);

  // Story Panel State
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templateInputs, setTemplateInputs] = useState<{ [key: string]: string }>({});

  // Custom Script State
  const [customScript, setCustomScript] = useState<string | null>(null);

  const templateVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const regex = /{(\w+)}/g;
    // eslint-disable-next-line security/detect-object-injection
    const matches = selectedTemplate.template.match(regex);
    return matches ? matches.map((v: string) => v.slice(1, -1)) : [];
  }, [selectedTemplate]);

  const areAllTemplateInputsFilled = useMemo(() => {
    if (templateVariables.length === 0) return false;
    // eslint-disable-next-line security/detect-object-injection
    return templateVariables.every((variable: string) => templateInputs[variable]?.trim() !== "");
  }, [templateVariables, templateInputs]);

  const handleGenerateStory = () => {
    if (!selectedTemplate) return;
    let finalScript = selectedTemplate.template;
    for (const key in templateInputs) {
      finalScript = finalScript.replace(`{${key}}`, templateInputs[key]);
    }
    setCustomScript(finalScript);
    setIsStoryPanelOpen(false);
    setSelectedTone(null);
    setSelectedTemplate(null);
    setTemplateInputs({});
  };

  const handleTemplateInputChange = (variable: string, value: string) => {
    // eslint-disable-next-line security/detect-object-injection
    setTemplateInputs((prev) => ({ ...prev, [variable]: value }));
  };

  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <Sparkles className="mx-auto h-8 w-8 text-indigo-500" />
        <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          What will You Script Today?
        </h1>
        <p className="text-muted-foreground mt-8 text-lg leading-8">
          Start with an idea, fix an existing script, or create a structured story from scratch.
        </p>
      </div>

      <motion.div
        layout
        className={cn(
          "mx-auto mt-12 grid gap-8 px-6 lg:px-8",
          isStoryPanelOpen ? "max-w-7xl grid-cols-1 lg:grid-cols-2" : "max-w-4xl grid-cols-1",
        )}
      >
        <motion.div layout className="flex flex-col gap-4">
          {customScript && (
            <Badge variant="secondary" className="flex w-full items-center justify-between p-2">
              <span className="font-semibold">Custom Script Template Active</span>
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1" onClick={() => setCustomScript(null)}>
                Clear
              </Button>
            </Badge>
          )}
          <Textarea
            value={videoIdea}
            onChange={(e) => setVideoIdea(e.target.value)}
            placeholder={inputModes[inputMode]}
            className="min-h-52 text-base"
          />
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <Select value={inputMode} onValueChange={(v: InputMode) => setInputMode(v)}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Input Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="fixer">Fixer</SelectItem>
                <SelectItem value="rewriter">Rewriter</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-4">
              <Button size="lg" disabled={!videoIdea.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700">
                <Wand className="mr-2 h-4 w-4" />
                Fast Write
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={!videoIdea.trim()}
                onClick={() => setIsStoryPanelOpen(true)}
                className="w-full"
              >
                <Bot className="mr-2 h-4 w-4" />
                Create Story
              </Button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isStoryPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Create Story</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => setIsStoryPanelOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
                  {/* Step 1: Tone */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">1. Choose a Tone of Voice</h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {tones.map((tone) => (
                        <Card
                          key={tone.id}
                          // eslint-disable-next-line security/detect-object-injection
                          onClick={() => setSelectedTone(tone.id)}
                          className={cn(
                            "cursor-pointer transition-all",
                            selectedTone === tone.id && "border-indigo-500 ring-2 ring-indigo-500",
                          )}
                        >
                          <CardContent className="p-6 text-center">
                            <span className="text-2xl">{tone.emoji}</span>
                            <p className="font-bold">{tone.name}</p>
                            <p className="text-muted-foreground text-xs">{tone.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Template */}
                  <AnimatePresence>
                    {selectedTone && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4"
                      >
                        <h3 className="font-semibold">2. Select a Template</h3>
                        <div className="space-y-2">
                          {/* eslint-disable-next-line security/detect-object-injection */}
                          {(templatesByTone[selectedTone] || []).map((template: Template) => (
                            <Card
                              key={template.id}
                              onClick={() => setSelectedTemplate(template)}
                              className={cn(
                                "cursor-pointer transition-all",
                                selectedTemplate?.id === template.id && "bg-secondary border-indigo-500",
                              )}
                            >
                              <CardContent className="p-6">
                                <p className="font-bold">{template.name}</p>
                                <p className="text-muted-foreground text-xs">{template.structure}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3: Fill Blanks */}
                  <AnimatePresence>
                    {selectedTemplate && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4"
                      >
                        <h3 className="font-semibold">3. Fill in the Blanks</h3>
                        <div className="space-y-8">
                          {templateVariables.map((variable: string) => (
                            <Input
                              key={variable}
                              placeholder={variable.replace(/_/g, " ")}
                              // eslint-disable-next-line security/detect-object-injection
                              value={templateInputs[variable] ?? ""}
                              onChange={(e) => handleTemplateInputChange(variable, e.target.value)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 4: Generate */}
                  {selectedTemplate && (
                    <Button
                      size="lg"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!areAllTemplateInputsFilled}
                      onClick={handleGenerateStory}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Generate Story
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
