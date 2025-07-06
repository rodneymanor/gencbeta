"use client";

import { useState, useEffect } from "react";

import { BarChart3, TrendingUp, Target, BookOpen, Eye, EyeOff, Lightbulb, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  analyzeReadability,
  type ReadabilityAnalysis,
  getReadabilityColor,
  getReadabilityBgColor,
} from "@/lib/readability-analysis";

interface ReadabilitySidebarProps {
  script: string;
}

export function ReadabilitySidebar({ script }: ReadabilitySidebarProps) {
  const [analysis, setAnalysis] = useState<ReadabilityAnalysis | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze readability when script changes
  useEffect(() => {
    if (!script.trim()) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    const timeoutId = setTimeout(() => {
      try {
        const result = analyzeReadability(script);
        setAnalysis(result);
      } catch (error) {
        console.error("Readability analysis failed:", error);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 500); // Debounce analysis

    return () => clearTimeout(timeoutId);
  }, [script]);

  if (!script.trim()) {
    return (
      <div className="border-border/50 bg-background/50 w-80 border-l backdrop-blur-sm">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Readability</h3>
          </div>
          <div className="text-muted-foreground flex items-center justify-center py-8 text-center text-sm">
            <BookOpen className="mr-2 h-5 w-5" />
            Start writing to see readability analysis
          </div>
        </div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="border-border/50 bg-background/50 w-80 border-l backdrop-blur-sm">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Readability</h3>
          </div>
          <div className="text-muted-foreground flex items-center justify-center py-8 text-center text-sm">
            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
            Analyzing readability...
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="border-border/50 bg-background/50 w-80 border-l backdrop-blur-sm">
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Readability</h3>
          </div>
          <div className="text-muted-foreground flex items-center justify-center py-8 text-center text-sm">
            <Target className="mr-2 h-5 w-5" />
            Unable to analyze text
          </div>
        </div>
      </div>
    );
  }

  const { scores, statistics, readabilityLevel, recommendations } = analysis;

  return (
    <div className="border-border/50 bg-background/50 w-80 border-l backdrop-blur-sm">
      <div className="space-y-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Readability</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)} className="h-8 w-8 p-0">
            {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Overall Score */}
        <Card
          className={`${getReadabilityBgColor(readabilityLevel.score)}`}
          style={{ border: "1px solid var(--border)" }}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Overall Readability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{Math.round(readabilityLevel.score)}</span>
                <Badge variant="secondary" className="text-xs">
                  {readabilityLevel.level}
                </Badge>
              </div>
              <div className="text-muted-foreground text-sm">
                <div>{readabilityLevel.grade}</div>
                <div className="text-xs">{readabilityLevel.description}</div>
              </div>
              <Progress value={Math.min(readabilityLevel.score, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{statistics.wordCount}</div>
                <div className="text-muted-foreground text-xs">Words</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{statistics.sentenceCount}</div>
                <div className="text-muted-foreground text-xs">Sentences</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{statistics.difficultWords}</div>
                <div className="text-muted-foreground text-xs">Complex Words</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">{Math.round(statistics.averageWordsPerSentence)}</div>
                <div className="text-muted-foreground text-xs">Avg Words/Sentence</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Scores */}
        {showAdvanced && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Detailed Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Flesch-Kincaid Grade</span>
                  <span className={`text-sm font-medium ${getReadabilityColor(100 - scores.fleschKincaidGrade * 8)}`}>
                    {Math.round(scores.fleschKincaidGrade * 10) / 10}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Gunning Fog Index</span>
                  <span className={`text-sm font-medium ${getReadabilityColor(100 - scores.gunningFog * 8)}`}>
                    {Math.round(scores.gunningFog * 10) / 10}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SMOG Index</span>
                  <span className={`text-sm font-medium ${getReadabilityColor(100 - scores.smogIndex * 8)}`}>
                    {Math.round(scores.smogIndex * 10) / 10}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Coleman-Liau Index</span>
                  <span className={`text-sm font-medium ${getReadabilityColor(100 - scores.colemanLiauIndex * 8)}`}>
                    {Math.round(scores.colemanLiauIndex * 10) / 10}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dale-Chall Score</span>
                  <span
                    className={`text-sm font-medium ${getReadabilityColor(100 - scores.daleChallReadabilityScore * 10)}`}
                  >
                    {Math.round(scores.daleChallReadabilityScore * 10) / 10}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-500" />
                  <span className="text-muted-foreground text-xs">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reading Level Guide */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Reading Level Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-muted-foreground space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>90-100: Very Easy (5th grade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>80-89: Easy (6th grade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-lime-500" />
                  <span>70-79: Fairly Easy (7th grade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>60-69: Standard (8th-9th grade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span>50-59: Fairly Difficult (10th-12th grade)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>30-49: Difficult (College level)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  <span>0-29: Very Difficult (Graduate level)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
