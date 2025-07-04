"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp
} from "lucide-react";

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
    preview: "Need help crafting killer video content? Problem/solution, storytelling approaches that convert viewers into engaged followers...",
    type: "speed-write",
    duration: "60s",
    approach: "Speed Write Formula"
  },
  {
    id: "2", 
    title: "Authority Builder Script",
    preview: "When I started my business, I made every mistake in the book. Here's what I learned that could save you years of struggle...",
    type: "ai-voice",
    duration: "90s",
    approach: "Alex Hormozi Voice",
    voice: "Alex Hormozi Formula"
  },
  {
    id: "3",
    title: "Educational Deep Dive",
    preview: "Let me break down the exact framework I use to generate $10K months. Step one is understanding your audience psychology...",
    type: "educational", 
    duration: "120s",
    approach: "Educational Approach"
  }
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
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                ScriptCraft
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSecondary(!showSecondary)}
                className="text-gray-600 dark:text-gray-400"
              >
                <Settings className="w-4 h-4 mr-2" />
                Tools
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showSecondary ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            {/* Input Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Generate Your Script
                  </h2>
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
                  className="min-h-[100px] resize-none border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={isGenerating}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      60s target
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      3 variations
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={!idea.trim() || isGenerating}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate ⌘⏎
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b border-gray-200 dark:border-gray-800 px-6">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
                    <TabsTrigger
                      value="generated"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none border-b-2 border-transparent py-4"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Generated
                    </TabsTrigger>
                    <TabsTrigger
                      value="saved"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none border-b-2 border-transparent py-4"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      Saved
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none border-b-2 border-transparent py-4"
                    >
                      <History className="w-4 h-4 mr-2" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="generated" className="p-6 mt-0">
                  {isGenerating ? (
                    <div className="space-y-4" aria-live="polite">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
                          <div className="flex items-center justify-between mb-3">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : scripts.length > 0 ? (
                    <div className="space-y-4">
                      {scripts.map((script) => (
                        <div
                          key={script.id}
                          className="group border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {script.title}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {script.duration}
                                </Badge>
                                {script.voice && (
                                  <Badge variant="outline" className="text-xs text-indigo-600 dark:text-indigo-400">
                                    {script.voice}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                {script.preview}
                              </p>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {script.approach}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 px-2"
                              >
                                <Bookmark className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-8 px-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              className="bg-indigo-500 hover:bg-indigo-600 text-white h-8 px-4"
                            >
                              Use Script
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Ready to Generate
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter your video idea above to get started with AI-generated scripts
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="saved" className="p-6 mt-0">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bookmark className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Saved Scripts
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Scripts you bookmark will appear here for quick access
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="p-6 mt-0">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <History className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No Generation History
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your previous script generations will be listed here
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar - Secondary Tools */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-300 ${showSecondary ? "opacity-100" : "opacity-50 lg:opacity-100"}`}>
            {/* Credits */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Credits</h3>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <CreditCard className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Used today</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">16 / 5,000</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "0.32%" }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Resets in 7h 23m
                </p>
              </div>
            </div>

            {/* Ghost Writer */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">AI Suggestions</h3>
                <Badge variant="secondary" className="text-xs">
                  12 new
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    "5 mistakes killing your content engagement"
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Trending</Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Use
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    "Why your audience isn't converting (and how to fix it)"
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Authority</Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      Use
                    </Button>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4 mr-2" />
                View All Suggestions
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scripts this week</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">23</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avg. generation time</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">2.3s</span>
                </div>
                <div className="flex justify-between items-center">
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
