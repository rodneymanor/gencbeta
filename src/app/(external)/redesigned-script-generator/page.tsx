"use client";

import { useState, useRef, useEffect } from "react";

import {
  Sparkles,
  Clock,
  Users,
  Zap,
  ChevronDown,
  Settings,
  CreditCard,
  History,
  Bookmark,
  ArrowRight,
  Wand2,
  Target,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface ScriptCard {
  id: string;
  title: string;
  preview: string;
  type: "speed-write" | "educational" | "ai-voice";
  duration: string;
  approach: string;
  voice?: string;
}

const sampleScripts: ScriptCard[] = [
  {
    id: "1",
    title: "Killer Problem/Solution Hook",
    preview:
      "Need help crafting killer video content? Problem/solution, storytelling approaches that convert viewers into engaged followers...",
    type: "speed-write",
    duration: "60s",
    approach: "Speed Write Formula",
  },
  {
    id: "2",
    title: "Authority Builder Script",
    preview:
      "When I started my business, I made every mistake in the book. Here's what I learned that could save you years of struggle...",
    type: "ai-voice",
    duration: "90s",
    approach: "Alex Hormozi Voice",
    voice: "Alex Hormozi Formula",
  },
  {
    id: "3",
    title: "Educational Deep Dive",
    preview:
      "Let me break down the exact framework I use to generate $10K months. Step one is understanding your audience psychology...",
    type: "educational",
    duration: "120s",
    approach: "Educational Approach",
  },
];

export default function RedesignedScriptGenerator() {
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("generated");
  const [scripts, setScripts] = useState<ScriptCard[]>([]);
  const [showSecondary, setShowSecondary] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [idea]);

  const handleGenerate = async () => {
    if (!idea.trim()) return;

    setIsGenerating(true);
    setActiveTab("generated");

    // Simulate API call
    setTimeout(() => {
      setScripts(sampleScripts);
      setIsGenerating(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">ScriptCraft</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecondary(!showSecondary)}
                className="text-gray-600 dark:text-gray-400"
              >
                <Settings className="mr-2 h-4 w-4" />
                Tools
                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showSecondary ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Input Section */}
            <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  <Sparkles className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Generate Your Script</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Describe your video idea and we'll create multiple script options
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your video idea... (e.g., 'How to build confidence when starting a business')"
                  className="min-h-[100px] resize-none border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700"
                  disabled={isGenerating}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      60s target
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />3 variations
                    </span>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!idea.trim() || isGenerating}
                    className="bg-indigo-500 px-6 text-white hover:bg-indigo-600"
                  >
                    {isGenerating ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate ⌘⏎
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 px-6 dark:border-gray-800">
                  <TabsList className="grid h-auto w-full grid-cols-3 bg-transparent p-0">
                    <TabsTrigger
                      value="generated"
                      className="rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Generated
                    </TabsTrigger>
                    <TabsTrigger
                      value="saved"
                      className="rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="rounded-none border-b-2 border-transparent py-4 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                    >
                      <History className="mr-2 h-4 w-4" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="generated" className="mt-0 p-6">
                  {isGenerating ? (
                    <div className="space-y-4" aria-live="polite">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="animate-pulse rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
                            <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
                            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : scripts.length > 0 ? (
                    <div className="space-y-4">
                      {scripts.map((script) => (
                        <div
                          key={script.id}
                          className="group rounded-lg border border-gray-200 p-4 transition-all duration-200 hover:border-indigo-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-indigo-600"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="mb-2 flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">{script.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {script.duration}
                                </Badge>
                                {script.voice && (
                                  <Badge variant="outline" className="text-xs text-indigo-600 dark:text-indigo-400">
                                    {script.voice}
                                  </Badge>
                                )}
                              </div>
                              <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                                {script.preview}
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-500">{script.approach}</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <Bookmark className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>

                            <Button size="sm" className="h-8 bg-indigo-500 px-4 text-white hover:bg-indigo-600">
                              Use Script
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Target className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Ready to Generate</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter your video idea above to get started with AI-generated scripts
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="mt-0 p-6">
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <Bookmark className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No Saved Scripts</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Scripts you bookmark will appear here for quick access
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0 p-6">
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <History className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No Generation History</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your previous script generations will be listed here
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar - Secondary Tools */}
          <div
            className={`space-y-6 transition-all duration-300 lg:col-span-4 ${showSecondary ? "opacity-100" : "opacity-50 lg:opacity-100"}`}
          >
            {/* Credits */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Credits</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <CreditCard className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used today</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">16 / 5,000</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: "0.32%" }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Resets in 7h 23m</p>
              </div>
            </div>

            {/* Ghost Writer */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">AI Suggestions</h3>
                <Badge variant="secondary" className="text-xs">
                  12 new
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    "5 mistakes killing your content engagement"
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Trending
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Use
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                    "Why your audience isn't converting (and how to fix it)"
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Authority
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Use
                    </Button>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-4 w-full text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="mr-2 h-4 w-4" />
                View All Suggestions
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 font-medium text-gray-900 dark:text-gray-100">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scripts this week</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. generation time</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">2.3s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Most used approach</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">Speed Write</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
