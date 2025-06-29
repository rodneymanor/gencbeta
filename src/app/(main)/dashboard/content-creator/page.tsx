"use client";

import { useState } from "react";

import { PenTool, FileText, Inbox, Zap, Bot, Lightbulb, Film, Clock, Wand } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SPEED_WRITE_CONFIG } from "@/config/speed-write-prompt";
import { useAuth } from "@/contexts/auth-context";

// Mock data for demonstration
const aiScriptIdeas = [
  "A tech startup founder discovers their AI assistant has been making autonomous business decisions that are surprisingly successful.",
  "A small-town librarian uses social media to transform their community into a thriving cultural hub.",
  "A food delivery driver starts documenting unusual customer requests and builds a viral cooking show around them.",
];

const recentActivities = [
  {
    id: 1,
    icon: FileText,
    title: "Tech Startup Script",
    date: "2 hours ago",
    status: "Draft",
    iconColor: "text-primary",
  },
  {
    id: 2,
    icon: Lightbulb,
    title: "Creative brainstorm session",
    date: "5 hours ago",
    status: "Completed",
    iconColor: "text-yellow-500",
  },
  {
    id: 3,
    icon: Film,
    title: "Video script outline",
    date: "1 day ago",
    status: "New",
    iconColor: "text-blue-500",
  },
  {
    id: 4,
    icon: FileText,
    title: "Marketing campaign copy",
    date: "2 days ago",
    status: "Completed",
    iconColor: "text-primary",
  },
];

const quickActions = [
  {
    id: 1,
    icon: PenTool,
    title: "New Script from Idea",
    description: "Describe your idea and let AI help you build a script.",
    actionText: "Start Writing",
    onClick: () => console.log("Starting new script from idea"),
  },
  {
    id: 2,
    icon: FileText,
    title: "Browse Script Templates",
    description: "Choose a pre-built structure from popular styles.",
    actionText: "Choose Template",
    onClick: () => console.log("Browsing script templates"),
  },
  {
    id: 3,
    icon: Inbox,
    title: "Add to Idea Inbox",
    description: "Save a quick thought, link, or voice note for later.",
    actionText: "Save Idea",
    onClick: () => console.log("Adding to idea inbox"),
  },
];

export default function ContentCreatorPage() {
  const { userProfile } = useAuth();
  const [videoIdea, setVideoIdea] = useState("");

  // Get user name from auth context or fallback
  const userName = userProfile?.displayName ?? "User";

  const handleNewScriptClick = () => {
    console.log("Starting new script from idea");
  };

  const handleAIIdeaCreate = async (idea: string) => {
    console.log("Creating script from AI idea:", idea);
    // Navigate to script creation with pre-filled idea
  };

  const handleQuickWrite = async () => {
    if (!videoIdea.trim()) return;

    console.log("Quick writing with idea:", videoIdea);
    console.log("Using Speed Write System Prompt:", SPEED_WRITE_CONFIG.systemPrompt);

    // TODO: Integrate with AI service using the SPEED_WRITE_CONFIG.systemPrompt
    // The system prompt should be sent to the AI service along with the user's video idea
    // Example API call structure:
    // await aiService.createScript({
    //   systemPrompt: SPEED_WRITE_CONFIG.systemPrompt,
    //   userInput: videoIdea,
    //   type: 'speed-write'
    // });

    // Navigate to script creation with the entered idea
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Draft":
        return "secondary";
      case "Completed":
        return "default";
      case "New":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="@container/main">
      <div className="mx-auto max-w-6xl space-y-8 p-4 md:space-y-10 md:p-6">
        {/* Top Header Section with Input Field */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-foreground text-3xl font-bold">Welcome back, {userName}</h1>
            <p className="text-muted-foreground">Let&apos;s create some compelling content today.</p>
          </div>

          {/* Quick Input Section */}
          <div className="flex-shrink-0 space-y-4 lg:w-96">
            <div className="space-y-3">
              <Textarea
                value={videoIdea}
                onChange={(e) => setVideoIdea(e.target.value)}
                placeholder={SPEED_WRITE_CONFIG.ui.placeholders.ideaInput}
                className="min-h-24 resize-none text-base"
              />
              <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
                <p>
                  <strong>Speed Write Formula:</strong> {SPEED_WRITE_CONFIG.ui.formula.summary}
                </p>
              </div>
              <Button
                onClick={handleQuickWrite}
                disabled={!videoIdea.trim()}
                className="bg-primary hover:bg-primary/90 w-full"
                size="lg"
              >
                <Wand className="mr-2 h-4 w-4" />
                Quick Write
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid Section */}
        <section className="space-y-4">
          <h2 className="text-foreground text-xl font-semibold">Start Creating</h2>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card
                  key={action.id}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-md"
                  onClick={action.id === 1 ? handleNewScriptClick : action.onClick}
                >
                  <CardHeader>
                    <div className="bg-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-lg">
                      <IconComponent className="text-primary h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      {action.actionText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* AI Script Ideas Section */}
        <section className="space-y-4">
          <h2 className="text-foreground text-xl font-semibold">Fresh Ideas For You</h2>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {aiScriptIdeas.map((idea, index) => (
              <Card key={index} className="transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex justify-center">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Bot className="text-primary h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex h-full flex-col">
                  <p className="text-muted-foreground mb-6 flex-grow text-sm leading-relaxed">{idea}</p>
                  <Button onClick={() => handleAIIdeaCreate(idea)} className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Create Script
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-4">
          <h2 className="text-foreground text-xl font-semibold">Recent Activity</h2>
          <Card>
            <CardContent className="p-0">
              {recentActivities.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={activity.id}
                    className={`hover:bg-muted/50 flex items-center justify-between p-4 transition-colors ${
                      index !== recentActivities.length - 1 ? "border-border border-b" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                        <IconComponent className={`h-4 w-4 ${activity.iconColor}`} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-medium">{activity.title}</p>
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {activity.date}
                        </div>
                      </div>
                    </div>
                    <Badge variant={getStatusBadgeVariant(activity.status)}>{activity.status}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
