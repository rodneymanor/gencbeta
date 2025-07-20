"use client";

import { useState } from "react";

import { Copy, Check, Lightbulb, Target, Edit } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type GeneratedHook, type HookGenerationResponse } from "@/lib/prompts/hook-generation";

interface HookResultsProps {
  hooks: HookGenerationResponse;
  onSelectHook: (hook: GeneratedHook) => void;
  onUseHook: (hook: GeneratedHook) => void;
  className?: string;
}

export function HookResults({ hooks, onSelectHook, onUseHook, className }: HookResultsProps) {
  const [copiedHooks, setCopiedHooks] = useState<Set<string>>(new Set());

  const copyToClipboard = async (text: string, hookId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHooks((prev) => new Set(prev).add(hookId));
      toast.success("Hook copied to clipboard");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedHooks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(hookId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      toast.error("Failed to copy hook");
    }
  };

  const getTemplateColor = (template: string) => {
    const colors = {
      "IF-AND-THEN": "bg-blue-100 text-blue-800",
      "YOU KNOW WHEN YOU": "bg-green-100 text-green-800",
      "ME-YOU": "bg-purple-100 text-purple-800",
      DO: "bg-orange-100 text-orange-800",
      STOP: "bg-red-100 text-red-800",
      SECRET: "bg-yellow-100 text-yellow-800",
      THIS: "bg-indigo-100 text-indigo-800",
      "WHY/REASON": "bg-pink-100 text-pink-800",
      "SIGNS/TRAITS": "bg-teal-100 text-teal-800",
      "TOP 3": "bg-cyan-100 text-cyan-800",
    };

    // Find matching template or use default
    const matchedTemplate = Object.keys(colors).find((key) => template.toUpperCase().includes(key));

    return matchedTemplate ? colors[matchedTemplate as keyof typeof colors] : "bg-gray-100 text-gray-800";
  };

  const getStrengthIcon = (strength: string) => {
    const lower = strength.toLowerCase();
    if (lower.includes("curiosity")) return <Lightbulb className="h-3 w-3" />;
    if (lower.includes("fear") || lower.includes("urgency")) return <Target className="h-3 w-3" />;
    return <Edit className="h-3 w-3" />;
  };

  if (!hooks.hooks || hooks.hooks.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-muted-foreground text-center">
            No hooks generated. Please try again with a different input.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Generated Hooks</h2>
        <Badge variant="secondary">
          {hooks.hooks.length} hook{hooks.hooks.length !== 1 ? "s" : ""} generated
        </Badge>
      </div>

      <div className="grid gap-4">
        {hooks.hooks.map((hook, index) => {
          const hookId = `hook-${index}`;
          const isCopied = copiedHooks.has(hookId);

          return (
            <Card key={index} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${getTemplateColor(hook.template)}`}>
                        {hook.template}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        {getStrengthIcon(hook.strength)}
                        {hook.strength}
                      </Badge>
                    </div>
                    <p className="text-base leading-relaxed font-medium">"{hook.hook}"</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {hook.platform_optimization && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                        <div>
                          <p className="mb-1 text-sm font-medium">Platform Optimization</p>
                          <p className="text-muted-foreground text-sm">{hook.platform_optimization}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(hook.hook, hookId)}
                        className="h-8"
                      >
                        {isCopied ? (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Copy
                          </>
                        )}
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => onSelectHook(hook)} className="h-8">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </div>

                    <Button size="sm" onClick={() => onUseHook(hook)} className="h-8">
                      Use This Hook
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
