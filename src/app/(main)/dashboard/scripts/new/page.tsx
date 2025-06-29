"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { ArrowUp, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { DailyIdeaCard } from "./_components/daily-idea-card";
import { IdeaInboxDialog } from "./_components/idea-inbox-dialog";
import { DailyIdea, ScriptMode, mockDailyIdeas, scriptModes } from "./_components/types";

export default function NewScriptPage() {
  const router = useRouter();
  const [scriptIdea, setScriptIdea] = useState("");
  const [selectedMode, setSelectedMode] = useState<ScriptMode["id"]>("yolo");
  const [scriptLength, setScriptLength] = useState("20");
  const [dailyIdeas, setDailyIdeas] = useState(mockDailyIdeas);

  const handleSubmit = () => {
    if (!scriptIdea.trim()) return;

    // Navigate to script editor with context
    const params = new URLSearchParams({
      idea: encodeURIComponent(scriptIdea),
      mode: selectedMode,
      length: scriptLength,
    });

    router.push(`/dashboard/scripts/editor?${params.toString()}`);
  };

  const handleMagicWand = (idea: DailyIdea) => {
    // Navigate to script editor with the selected idea
    const params = new URLSearchParams({
      idea: encodeURIComponent(idea.text),
      mode: selectedMode,
      length: scriptLength,
      source: idea.source,
    });

    router.push(`/dashboard/scripts/editor?${params.toString()}`);
  };

  const handleBookmark = (ideaId: string) => {
    setDailyIdeas((prev) =>
      prev.map((idea) => (idea.id === ideaId ? { ...idea, isBookmarked: !idea.isBookmarked } : idea)),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold">What will you Script today?</h1>
        <p className="text-muted-foreground text-lg">
          Start with an idea, fix an existing script, or create a structured story from scratch.
        </p>
      </div>

      {/* Main Input Section */}
      <div className="space-y-4">
        <div className="relative">
          <Textarea
            value={scriptIdea}
            onChange={(e) => setScriptIdea(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="My script ideas for the day is..."
            className="min-h-32 resize-none p-6 pr-16 text-lg"
          />
          <Button
            onClick={handleSubmit}
            disabled={!scriptIdea.trim()}
            size="sm"
            className="absolute right-4 bottom-4 h-10 w-10 p-0"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IdeaInboxDialog />

            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <Select value={scriptLength} onValueChange={setScriptLength}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                  <SelectItem value="90">90 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-muted-foreground text-sm">Press ⌘+Enter to submit</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Script Mode</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {scriptModes.map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <Card
                key={mode.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected ? "ring-primary bg-primary/5 ring-2" : "hover:shadow-md"
                } ${!mode.available ? "opacity-50" : ""}`}
                onClick={() => mode.available && setSelectedMode(mode.id)}
              >
                <CardContent className="space-y-3 p-4 text-center">
                  <div
                    className={`mx-auto flex h-12 w-12 items-center justify-center rounded-lg ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-medium">{mode.label}</h4>
                    <p className="text-muted-foreground mt-1 text-xs">{mode.description}</p>
                    {!mode.available && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Daily Ideas Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Daily Ideas for You</h3>
          <Button variant="ghost" size="sm">
            Refresh Ideas
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dailyIdeas.map((idea) => (
            <DailyIdeaCard key={idea.id} idea={idea} onMagicWand={handleMagicWand} onBookmark={handleBookmark} />
          ))}
        </div>
      </div>
    </div>
  );
}
