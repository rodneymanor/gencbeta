"use client";

import React, { useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookText, BrainCircuit, X, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const tones = [
  {
    name: "Alex Hormozi",
    description: "Direct, value-driven, and authoritative.",
    style: "Bold claims, evidence-based, clear calls to action.",
    emoji: "🚀",
  },
  {
    name: "Gary Vaynerchuk",
    description: "High-energy, motivational, and brutally honest.",
    style: "Passionate delivery, raw language, focuses on hustle.",
    emoji: "🔥",
  },
  {
    name: "Simon Sinek",
    description: "Inspirational, purpose-driven, and optimistic.",
    style: "Starts with 'Why', uses storytelling, focuses on vision.",
    emoji: "💡",
  },
];

const templates = {
  "Alex Hormozi": [
    {
      name: "The Grand Slam Offer",
      structure: "{Hook} → {Problem} → {Solution} → {Offer Stack} → {Urgency}",
      variables: ["Hook", "Problem", "Solution", "Offer Stack", "Urgency"],
    },
    {
      name: "Value Proof Framework",
      structure: "{Claim} → {Evidence Point 1} → {Evidence Point 2} → {Call to Action}",
      variables: ["Claim", "Evidence Point 1", "Evidence Point 2", "Call to Action"],
    },
  ],
  "Gary Vaynerchuk": [
    {
      name: "The Content Model",
      structure: "{Document, Don't Create} → {Jab, Jab, Jab} → {Right Hook}",
      variables: ["Document, Don't Create", "Jab, Jab, Jab", "Right Hook"],
    },
  ],
  "Simon Sinek": [
    {
      name: "The Golden Circle",
      structure: "{Why} → {How} → {What}",
      variables: ["Why", "How", "What"],
    },
  ],
};

const scriptBuilderTemplates = {
  Hooks: [
    "You won't believe this one weird trick...",
    "Everything you know about X is wrong.",
    "This is the secret to unlocking...",
  ],
  Bridges: ["But that's not all, because...", "Now, you might be thinking...", "Here's where it gets interesting."],
  "Golden Nuggets": [
    "The key takeaway here is to always...",
    "Remember this: ...",
    "If you do one thing today, make it this: ...",
  ],
  WTAs: [
    "So what are you waiting for? Click the link below.",
    "Follow for more content like this.",
    "Share this with someone who needs to hear it.",
  ],
};

export function HeroSection() {
  const [inputValue, setInputValue] = useState("");
  const [inputMode, setInputMode] = useState("Original");
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [selectedTone, setSelectedTone] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<{
    name: string;
    structure: string;
    variables: string[];
  } | null>(null);
  const [templateInputs, setTemplateInputs] = useState<{ [key: string]: string }>({});
  const [scriptBuilderContent, setScriptBuilderContent] = useState("");

  const handleTemplateInputChange = (variable: string, value: string) => {
    setTemplateInputs((prev) => ({ ...prev, [variable]: value }));
  };

  const areAllTemplateInputsFilled =
    selectedTemplate?.variables.every((variable: string) => templateInputs[variable]?.trim() !== "") ?? false;

  const placeholderText = {
    Original: "e.g., A video about the benefits of intermittent fasting...",
    Fixer: "Paste your script here to fix grammar, pacing, and clarity...",
    Rewriter: "Paste your script here to get a new version in a different style...",
  }[inputMode];

  const renderCreateStoryPanel = () => (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className="bg-card w-full rounded-lg border p-6 lg:w-1/2"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create Story</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowCreateStory(false);
            setSelectedTone(null);
            setSelectedTemplate(null);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-muted-foreground mb-2 text-sm">Step 1: Choose Tone of Voice</p>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        {tones.map((tone) => (
          <div
            key={tone.name}
            className={cn(
              "cursor-pointer rounded-md border p-3 transition-all",
              selectedTone === tone.name ? "border-primary bg-primary/10" : "hover:bg-muted/50",
            )}
            onClick={() => {
              setSelectedTone(tone.name);
              setSelectedTemplate(null);
            }}
          >
            <span className="text-2xl">{tone.emoji}</span>
            <p className="mt-1 font-semibold">{tone.name}</p>
            <p className="text-muted-foreground text-xs">{tone.description}</p>
          </div>
        ))}
      </div>

      {selectedTone && (
        <>
          <p className="text-muted-foreground mb-2 text-sm">Step 2: Select a Template</p>
          <div className="mb-4 grid grid-cols-1 gap-2">
            {templates[selectedTone as keyof typeof templates]?.map((template) => (
              <div
                key={template.name}
                className={cn(
                  "cursor-pointer rounded-md border p-3 transition-all",
                  selectedTemplate?.name === template.name ? "border-primary bg-primary/10" : "hover:bg-muted/50",
                )}
                onClick={() => setSelectedTemplate(template)}
              >
                <p className="font-semibold">{template.name}</p>
                <p className="text-muted-foreground text-xs">{template.structure}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedTemplate && (
        <>
          <p className="text-muted-foreground mb-2 text-sm">Step 3: Fill in the Blanks</p>
          <div className="mb-4 space-y-2">
            {selectedTemplate.variables.map((variable: string) => (
              <Input
                key={variable}
                placeholder={variable}
                onChange={(e) => handleTemplateInputChange(variable, e.target.value)}
              />
            ))}
          </div>
        </>
      )}

      <Button className="w-full bg-purple-600 text-white hover:bg-purple-700" disabled={!areAllTemplateInputsFilled}>
        <BrainCircuit className="mr-2 h-4 w-4" />
        Generate Story
      </Button>
    </motion.div>
  );

  return (
    <div className="py-16 md:py-24">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold md:text-5xl">What will You Script Today?</h1>
        <p className="text-muted-foreground mt-2">Start with an idea, a draft, or a proven template.</p>
      </div>

      <div
        className={cn(
          "mx-auto flex max-w-5xl flex-col gap-4 transition-all duration-300 lg:flex-row",
          showCreateStory ? "lg:max-w-7xl" : "lg:max-w-5xl",
        )}
      >
        <div className={cn("w-full transition-all duration-300", showCreateStory ? "lg:w-1/2" : "lg:w-full")}>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholderText}
            className="h-40 text-base"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Select onValueChange={setInputMode} defaultValue={inputMode}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Input Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Original">Original</SelectItem>
                  <SelectItem value="Fixer">Fixer</SelectItem>
                  <SelectItem value="Rewriter">Rewriter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button disabled={!inputValue} className="bg-indigo-600 text-white hover:bg-indigo-700">
                <Zap className="mr-2 h-4 w-4" />
                Speed Write
              </Button>
              <Button variant="outline" disabled={!inputValue} onClick={() => setShowCreateStory(true)}>
                Create Story
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <AnimatePresence>{showCreateStory && renderCreateStoryPanel()}</AnimatePresence>
      </div>

      <div className="mt-8 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="text-muted-foreground">
              <BookText className="mr-2 h-4 w-4" />
              Script Builder
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[80vh] max-w-6xl">
            <DialogHeader>
              <DialogTitle>Script Builder</DialogTitle>
            </DialogHeader>
            <div className="grid h-full grid-cols-3 gap-6">
              <div className="col-span-2 grid grid-cols-2 gap-4 overflow-y-auto pr-4">
                {Object.entries(scriptBuilderTemplates).map(([category, items]) => (
                  <div key={category}>
                    <h4 className="mb-2 font-semibold">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item}
                          onClick={() => setScriptBuilderContent((prev) => `${prev} ${item}`)}
                          className="hover:bg-muted/50 cursor-pointer rounded-md border p-3 text-sm"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="col-span-1 flex flex-col">
                <Textarea
                  value={scriptBuilderContent}
                  onChange={(e) => setScriptBuilderContent(e.target.value)}
                  className="h-full flex-grow"
                  placeholder="Assemble your script here..."
                />
                <Button className="mt-4">Submit Script</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
