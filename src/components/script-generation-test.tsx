"use client";

import React, { useState } from "react";

import { AlertCircle, Clock, Copy, Loader2, Zap } from "lucide-react";
import { IconSettings } from "@tabler/icons-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";

interface ScriptResult {
  id: string;
  title: string;
  content: string;
  estimatedDuration: string;
  approach: string;
  elements?: {
    hook: string;
    bridge: string;
    goldenNugget: string;
    wta: string;
  };
  metadata?: {
    targetWords: number;
    actualWords: number;
    responseTime?: number;
    generationMethod?: string;
    enhancedComponents?: {
      hook: string;
      bridge: string;
      goldenNugget: string;
      wta: string;
    };
    featureFlags?: Record<string, boolean>;
  };
}

interface TestResult {
  version: "v1" | "v2";
  success: boolean;
  optionA?: ScriptResult | null;
  optionB?: ScriptResult | null;
  error?: string;
  processingTime?: number;
  debugInfo?: {
    validation?: any;
    enrichedInput?: any;
    rules?: any;
  };
}

export function ScriptGenerationTest() {
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [duration, setDuration] = useState<string>("30");
  const [featureFlags, setFeatureFlags] = useState({
    enhanced_debug: true,
  });
  const [type, setType] = useState<string>("auto");
  const [tone, setTone] = useState<string>("casual");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ v1?: TestResult; v2?: TestResult }>({});
  const [activeTab, setActiveTab] = useState("input");
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const testEndpoint = async (version: "v1" | "v2") => {
    if (!user) {
      throw new Error("User not authenticated");
    }

    const endpoint = version === "v1" ? "/api/script/speed-write" : "/api/script/speed-write/v2";

    const body = {
      idea,
      length: duration,
      ...(type !== "auto" && { type }),
      ...(version === "v2" && { tone }),
      ...(version === "v2" && showDebugInfo && { includeDebugInfo: true }),
      ...(version === "v2" && {
        testFeatureFlags: {},
      }),
    };

    try {
      // Get the user's ID token for authentication
      const idToken = await user.getIdToken();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return {
        version,
        ...data,
      };
    } catch (error) {
      return {
        version,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const runTest = async () => {
    if (!idea.trim()) {
      alert("Please enter a script idea");
      return;
    }

    setLoading(true);
    setResults({});
    setActiveTab("results");

    try {
      // Test both endpoints in parallel
      const [v1Result, v2Result] = await Promise.all([testEndpoint("v1"), testEndpoint("v2")]);

      setResults({
        v1: v1Result,
        v2: v2Result,
      });
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderScriptResult = (result: ScriptResult | null | undefined, version: string) => {
    if (!result) return <div className="text-muted-foreground">No result generated</div>;

    // Calculate actual word count from elements
    const calculateWordCount = () => {
      if (result.elements) {
        const fullText = `${result.elements.hook || ""} ${result.elements.bridge || ""} ${result.elements.goldenNugget || ""} ${result.elements.wta || ""}`;
        return fullText
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
      } else if (result.content) {
        return result.content
          .trim()
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
      }
      return 0;
    };

    const actualWordCount = calculateWordCount();
    const targetWords = result.metadata?.targetWords || getTargetWords(duration);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{result.title}</CardTitle>
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(result.content)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {result.approach} • {result.estimatedDuration}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.elements ? (
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-xs">Hook</Label>
                <p className="text-sm">{result.elements.hook}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Bridge</Label>
                <p className="text-sm">{result.elements.bridge}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Golden Nugget</Label>
                <p className="text-sm">{result.elements.goldenNugget}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">WTA (What To Act)</Label>
                <p className="text-sm">
                  {result.elements.wta ? (
                    result.elements.wta
                  ) : (
                    <span className="font-medium text-red-500">
                      ⚠️ Missing WTA - This is a bug in {version === "v1" ? "V1" : "V2"}!
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{result.content}</pre>
          )}

          <div className="space-y-2 border-t pt-2">
            <div className="text-muted-foreground flex gap-4 text-xs">
              <span
                className={
                  actualWordCount > targetWords * 1.2 || actualWordCount < targetWords * 0.8 ? "text-orange-500" : ""
                }
              >
                Words: {actualWordCount}/{targetWords}
              </span>
              {result.metadata?.responseTime && <span>Response: {result.metadata.responseTime}ms</span>}
              {result.metadata?.generationMethod && featureFlags.enhanced_debug && (
                <Badge variant="outline" className="text-xs">
                  {result.metadata.generationMethod}
                </Badge>
              )}
            </div>

            {/* Enhanced Feature Indicators */}
            {featureFlags.enhanced_debug && result.metadata?.enhancedComponents && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(result.metadata.enhancedComponents).map(([component, strategy]) => (
                  <Badge
                    key={component}
                    variant={
                      strategy.includes("enhanced") || strategy.includes("template") || strategy.includes("smart")
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {component}: {strategy}
                  </Badge>
                ))}
              </div>
            )}

            {/* Feature Flags Used */}
            {featureFlags.enhanced_debug && result.metadata?.featureFlags && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(result.metadata.featureFlags)
                  .filter(([_, enabled]) => enabled)
                  .map(([flag, _]) => (
                    <Badge key={flag} variant="outline" className="bg-blue-50 text-xs text-blue-700">
                      {flag.replace("_", " ")}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTargetWords = (duration: string): number => {
    const wordCounts: Record<string, number> = {
      "15": 33,
      "20": 44,
      "30": 66,
      "45": 99,
      "60": 132,
      "90": 198,
    };
    return wordCounts[duration] || 66;
  };

  if (!user) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to test the script generation endpoints</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Script Generation Architecture Test</CardTitle>
          <CardDescription>Test the new V2 architecture alongside the existing V1 implementation</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="input">Configuration</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
              <TabsTrigger value="debug" disabled={!results.v2 && !results.v1}>
                Debug Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idea">Script Idea</Label>
                <Textarea
                  id="idea"
                  placeholder="Enter your script idea here..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="20">20 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="45">45 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="90">90 seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Script Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (A/B Test)</SelectItem>
                      <SelectItem value="speed">Speed Write</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="viral">Viral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone (V2 only)</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This test will call both V1 and V2 endpoints to compare results and performance. V2 includes caching
                    and the new unified architecture.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="debug-info"
                    checked={showDebugInfo}
                    onChange={(e) => setShowDebugInfo(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="debug-info" className="text-sm font-normal">
                    Include debug information (V2 only)
                  </Label>
                </div>
              </div>

              <Button onClick={runTest} disabled={loading || !idea.trim()} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Run Comparison Test
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <IconSettings className="mr-2 h-5 w-5 text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold">Phase 2 Features</h3>
                  <Badge variant="outline">Beta</Badge>
                </div>

                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      🎯 Enhanced AI Prompts
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      AI generation with enhanced prompts and example templates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-blue-600">✅ Enhanced hooks with diverse examples</div>
                    <div className="text-sm text-blue-600">✅ Context-aware bridge generation</div>
                    <div className="text-sm text-blue-600">✅ Improved CTA examples</div>

                    <div className="mt-4 border-t border-blue-200 pt-3">
                      <div className="mb-2 text-xs font-medium text-blue-800">Key Files:</div>
                      <div className="space-y-1 text-xs text-blue-700">
                        <div>
                          📝 <code>src/lib/prompts/script-generation/speed-write.ts</code>
                        </div>
                        <div>
                          🎯 <code>src/lib/prompts/script-generation/hook-examples.ts</code>
                        </div>
                        <div>
                          🔄 <code>src/lib/script-generation/adapter.ts</code>
                        </div>
                        <div>
                          📦 <code>src/lib/script-generation/generators/script-wrapper.ts</code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      🔍 Enhanced Debug Info
                      <Badge variant="secondary" className="text-xs">
                        Testing
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Show detailed generation metadata and strategy information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enhanced-debug"
                        checked={featureFlags.enhanced_debug}
                        onCheckedChange={(checked) =>
                          setFeatureFlags((prev) => ({
                            ...prev,
                            enhanced_debug: checked,
                          }))
                        }
                      />
                      <Label htmlFor="enhanced-debug" className="text-sm">
                        Show Enhanced Debug Info
                      </Label>
                    </div>

                    <div className="mt-4 border-t border-purple-200 pt-3">
                      <div className="mb-2 text-xs font-medium text-purple-800">Debug Files:</div>
                      <div className="space-y-1 text-xs text-purple-700">
                        <div>
                          🔍 <code>src/lib/script-generation/script-parser.ts</code>
                        </div>
                        <div>
                          📊 <code>src/lib/script-generation/performance-monitor.ts</code>
                        </div>
                        <div>
                          🧪 <code>src/components/script-generation-test.tsx</code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-200 bg-gray-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      🏗️ Architecture Overview
                      <Badge variant="outline" className="text-xs">
                        Reference
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">Key system components and their relationships</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="mb-1 font-medium text-gray-800">API Layer:</div>
                        <div className="text-gray-700">
                          📡 <code>src/app/api/script/speed-write/route.ts</code> (V1)
                        </div>
                        <div className="text-gray-700">
                          📡 <code>src/app/api/script/speed-write/v2/route.ts</code> (V2)
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 font-medium text-gray-800">Core Services:</div>
                        <div className="text-gray-700">
                          ⚙️ <code>src/lib/services/script-generation-service.ts</code>
                        </div>
                        <div className="text-gray-700">
                          🧠 <code>src/lib/enhanced-ghost-writer-service.ts</code>
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 font-medium text-gray-800">Data Processing:</div>
                        <div className="text-gray-700">
                          🔄 <code>src/lib/script-generation/preprocessors/</code>
                        </div>
                        <div className="text-gray-700">
                          📏 <code>src/lib/script-generation/duration-config.ts</code>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    V2 uses enhanced AI prompts with example templates for improved script generation quality and
                    consistency.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  {results.v1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">V1 Results (Current)</h3>
                        {results.v1.processingTime && (
                          <div className="text-muted-foreground flex items-center text-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            {results.v1.processingTime}ms
                          </div>
                        )}
                      </div>

                      {results.v1.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{results.v1.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {renderScriptResult(results.v1.optionA, "v1")}
                          {renderScriptResult(results.v1.optionB, "v1")}
                        </div>
                      )}
                    </div>
                  )}

                  {results.v2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">V2 Results (New Architecture)</h3>
                        {results.v2.processingTime && (
                          <div className="text-muted-foreground flex items-center text-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            {results.v2.processingTime}ms
                          </div>
                        )}
                      </div>

                      {results.v2.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{results.v2.error}</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          {renderScriptResult(results.v2.optionA, "v2")}
                          {renderScriptResult(results.v2.optionB, "v2")}
                        </div>
                      )}
                    </div>
                  )}

                  {results.v1 && results.v2 && !results.v1.error && !results.v2.error && (
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">Performance Comparison</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>V1 Processing Time:</span>
                            <span className="font-mono">{results.v1.processingTime || 0}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>V2 Processing Time:</span>
                            <span className="font-mono">{results.v2.processingTime || 0}ms</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Performance Improvement:</span>
                            <span className="text-green-600">
                              {results.v1.processingTime && results.v2.processingTime
                                ? `${Math.round(((results.v1.processingTime - results.v2.processingTime) / results.v1.processingTime) * 100)}%`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="debug" className="space-y-4">
              {/* Enhanced Debug Information */}
              {featureFlags.enhanced_debug && (results.v1 || results.v2) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Enhanced Debug Information</h3>
                    <Badge variant="outline">Phase 2 Feature</Badge>
                  </div>

                  {/* V1 vs V2 Comparison */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {results.v1?.optionA && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            V1 Generation Method
                            <Badge variant="secondary">Legacy</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Method:</strong>{" "}
                              {results.v1.optionA.metadata?.generationMethod || "Legacy Service"}
                            </div>
                            <div>
                              <strong>Response Time:</strong> {results.v1.optionA.metadata?.responseTime || "N/A"}ms
                            </div>
                            <div>
                              <strong>Word Count:</strong> {results.v1.optionA.metadata?.actualWords || "N/A"} /{" "}
                              {results.v1.optionA.metadata?.targetWords || "N/A"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {results.v2?.optionA && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            V2 Generation Method
                            <Badge variant="default">Enhanced</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Method:</strong>{" "}
                              {results.v2.optionA.metadata?.generationMethod || "V2 Architecture"}
                            </div>
                            <div>
                              <strong>Response Time:</strong> {results.v2.optionA.metadata?.responseTime || "N/A"}ms
                            </div>
                            <div>
                              <strong>Word Count:</strong> {results.v2.optionA.metadata?.actualWords || "N/A"} /{" "}
                              {results.v2.optionA.metadata?.targetWords || "N/A"}
                            </div>

                            {/* Enhanced Components */}
                            {results.v2.optionA.metadata?.enhancedComponents && (
                              <div>
                                <strong>Component Strategies:</strong>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Object.entries(results.v2.optionA.metadata.enhancedComponents).map(
                                    ([component, strategy]) => (
                                      <Badge
                                        key={component}
                                        variant={
                                          strategy.includes("enhanced") ||
                                          strategy.includes("template") ||
                                          strategy.includes("smart")
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {component}: {strategy}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Feature Flags */}
                            {results.v2.optionA.metadata?.featureFlags && (
                              <div>
                                <strong>Active Feature Flags:</strong>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Object.entries(results.v2.optionA.metadata.featureFlags)
                                    .filter(([_, enabled]) => enabled)
                                    .map(([flag, _]) => (
                                      <Badge key={flag} variant="outline" className="bg-blue-50 text-xs text-blue-700">
                                        {flag.replace("_", " ")}
                                      </Badge>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Traditional Debug Info */}
              {results.v2?.debugInfo ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">V2 Preprocessing Steps</h3>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">1. Input Validation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted overflow-auto rounded p-4 text-xs">
                        {JSON.stringify(results.v2.debugInfo.validation, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">2. Enriched Input</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted max-h-96 overflow-auto rounded p-4 text-xs">
                        {JSON.stringify(results.v2.debugInfo.enrichedInput, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">3. Generation Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted overflow-auto rounded p-4 text-xs">
                        {JSON.stringify(results.v2.debugInfo.rules, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              ) : !featureFlags.enhanced_debug ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enable "Enhanced Debug Info" in the Features tab to see detailed generation metadata.
                  </AlertDescription>
                </Alert>
              ) : !results.v1 && !results.v2 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Run a test to see debug information.</AlertDescription>
                </Alert>
              ) : null}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ScriptGenerationTest;
