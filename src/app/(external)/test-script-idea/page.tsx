"use client";

import { useState } from "react";

import { ArrowRight, Sparkles, FileText, Zap, Eye, Code2, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ScriptIdeaTestPage() {
  const [idea, setIdea] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    // Mock generation delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="from-background via-background to-muted/20 min-h-screen bg-gradient-to-br">
      {/* Header */}
      <header className="bg-background/80 border-b backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">ScriptCraft</h1>
                <p className="text-muted-foreground text-xs">AI-Powered Script Generation</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Beta
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
              <Zap className="h-4 w-4" />
              Hemingway-Style Script Editor
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight">
              Transform Your Ideas Into
              <span className="text-primary"> Compelling Scripts</span>
            </h1>
            <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
              Enter your script idea and watch as AI generates a structured, engaging script with real-time analysis and
              highlighting.
            </p>
          </div>

          {/* Input Section */}
          <Card className="mb-8 border-2 shadow-lg">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="mb-4 flex items-center gap-2">
                  <Code2 className="text-primary h-5 w-5" />
                  <h2 className="text-lg font-semibold">Script Idea Input</h2>
                </div>

                <div className="relative">
                  <Input
                    placeholder="Enter your script idea... (e.g., 'A video about the benefits of morning meditation for productivity')"
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    className="h-12 pr-32 text-base"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={!idea.trim() || isGenerating}
                    className="absolute top-2 right-2 h-8 px-4"
                    size="sm"
                  >
                    {isGenerating ? (
                      <>
                        <div className="border-background mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-muted-foreground flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    Real-time Analysis
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <Palette className="h-4 w-4" />
                    Element Highlighting
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    AI-Powered Suggestions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2d93ad]/10">
                  <FileText className="h-6 w-6 text-[#2d93ad]" />
                </div>
                <h3 className="mb-2 font-semibold">Hook Detection</h3>
                <p className="text-muted-foreground text-sm">
                  Automatically identifies and highlights attention-grabbing opening lines
                </p>
                <div className="mt-3">
                  <span className="inline-block rounded bg-[#2d93ad]/20 px-2 py-1 text-xs text-[#2d93ad]">
                    Hook Identified
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#412722]/10">
                  <ArrowRight className="h-6 w-6 text-[#412722]" />
                </div>
                <h3 className="mb-2 font-semibold">Bridge Analysis</h3>
                <p className="text-muted-foreground text-sm">Finds transition sentences that connect ideas smoothly</p>
                <div className="mt-3">
                  <span className="inline-block rounded bg-[#412722]/20 px-2 py-1 text-xs text-[#412722]">
                    Bridge Found
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#d9dcd6]/10">
                  <Sparkles className="h-6 w-6 text-[#412722]" />
                </div>
                <h3 className="mb-2 font-semibold">Golden Nuggets</h3>
                <p className="text-muted-foreground text-sm">Highlights key insights and valuable information points</p>
                <div className="mt-3">
                  <span className="inline-block rounded bg-[#d9dcd6]/20 px-2 py-1 text-xs text-[#412722]">
                    Value Detected
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mock Editor Preview */}
          <Card className="border-2 shadow-lg">
            <CardContent className="p-0">
              <div className="bg-muted/20 border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="text-primary h-5 w-5" />
                    <h3 className="font-semibold">Hemingway Script Editor</h3>
                    <Badge variant="outline" className="text-xs">
                      Real-time Analysis
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>247 words</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>4 elements</span>
                  </div>
                </div>
              </div>

              <div className="bg-background min-h-[400px] p-6">
                <div className="space-y-4 font-mono text-sm leading-relaxed">
                  <div className="relative">
                    <div className="absolute top-0 -left-2 h-full w-1 rounded-full bg-[#2d93ad] opacity-60"></div>
                    <p className="rounded-r-lg border-l-4 border-[#2d93ad] bg-[#2d93ad]/10 p-3 pl-4">
                      <span className="font-medium text-[#2d93ad]">Hook:</span> Did you know that just 10 minutes of
                      morning meditation can increase your productivity by 23%?
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute top-0 -left-2 h-full w-1 rounded-full bg-[#412722] opacity-60"></div>
                    <p className="rounded-r-lg border-l-4 border-[#412722] bg-[#412722]/10 p-3 pl-4">
                      <span className="font-medium text-[#412722]">Bridge:</span> Here&apos;s the thing - most people
                      think meditation is about sitting still and doing nothing. But that&apos;s not the whole story.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute top-0 -left-2 h-full w-1 rounded-full bg-[#d9dcd6] opacity-60"></div>
                    <p className="rounded-r-lg border-l-4 border-[#d9dcd6] bg-[#d9dcd6]/10 p-3 pl-4">
                      <span className="font-medium text-[#412722]">Golden Nugget:</span> Studies from Harvard Medical
                      School show that meditation literally rewires your brain, strengthening the prefrontal cortex
                      responsible for focus and decision-making.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute top-0 -left-2 h-full w-1 rounded-full bg-[#2d93ad] opacity-60"></div>
                    <p className="rounded-r-lg border-l-4 border-[#2d93ad] bg-[#2d93ad]/10 p-3 pl-4">
                      <span className="font-medium text-[#2d93ad]">Call to Action:</span> Start with just 5 minutes
                      tomorrow morning. Download a meditation app, find a quiet corner, and watch your productivity
                      soar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#2d93ad]"></div>
                      <span className="text-sm">1 Hook</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#412722]"></div>
                      <span className="text-sm">1 Bridge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#d9dcd6]"></div>
                      <span className="text-sm">1 Nugget</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-[#2d93ad]"></div>
                      <span className="text-sm">1 CTA</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Code2 className="mr-2 h-4 w-4" />
                    Export Script
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
