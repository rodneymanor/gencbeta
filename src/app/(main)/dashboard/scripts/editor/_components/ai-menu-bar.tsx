"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, ChevronDown, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { type ScriptElement } from "@/lib/script-analysis";

interface AIMenuBarProps {
  element: ScriptElement;
  position: { x: number; y: number };
  onAction: (actionType: string, customPrompt?: string, option?: string) => void;
  onClose: () => void;
}

interface AIAction {
  key: string;
  label: string;
  description: string;
  icon: string;
  hasSubmenu?: boolean;
  options?: {
    key: string;
    label: string;
    description: string;
  }[];
}

const UNIVERSAL_ACTIONS: AIAction[] = [
  {
    key: "humanize",
    label: "Humanize",
    description: "Make the text more natural and conversational",
    icon: "👤",
  },
  {
    key: "shorten",
    label: "Shorten",
    description: "Reduce length while maintaining core message",
    icon: "✂️",
  },
  {
    key: "change_tone",
    label: "Change Tone",
    description: "Modify the emotional tone of the text",
    icon: "🎭",
    hasSubmenu: true,
    options: [
      { key: "professional", label: "Professional", description: "Formal business tone" },
      { key: "casual", label: "Casual", description: "Relaxed informal tone" },
      { key: "friendly", label: "Friendly", description: "Warm approachable tone" },
      { key: "confident", label: "Confident", description: "Assertive self-assured tone" },
      { key: "persuasive", label: "Persuasive", description: "Compelling convincing tone" },
      { key: "formal", label: "Formal", description: "Structured professional tone" },
    ],
  },
];

const COMPONENT_SPECIFIC_ACTIONS: Record<ScriptElement["type"], AIAction[]> = {
  hook: [
    {
      key: "change_style",
      label: "Change Hook Style",
      description: "Rewrite with a different opening style",
      icon: "🎣",
      hasSubmenu: true,
      options: [
        { key: "question", label: "Question-based", description: "Start with an engaging question" },
        { key: "statistic", label: "Statistic-driven", description: "Open with compelling data" },
        { key: "story", label: "Story-driven", description: "Begin with a narrative" },
        { key: "provocative", label: "Provocative", description: "Use a bold controversial statement" },
        { key: "direct", label: "Direct Statement", description: "Start with clear declaration" },
      ],
    },
  ],
  bridge: [
    {
      key: "change_style",
      label: "Change Bridge Style",
      description: "Modify the transition approach",
      icon: "🌉",
      hasSubmenu: true,
      options: [
        { key: "smooth", label: "Smooth Transition", description: "Gentle logical flow" },
        { key: "contrast", label: "Contrast-based", description: "Highlight differences" },
        { key: "problem_solution", label: "Problem-Solution", description: "Present issue then resolution" },
        { key: "chronological", label: "Chronological", description: "Time-based sequence" },
        { key: "cause_effect", label: "Cause-Effect", description: "Show relationships" },
      ],
    },
  ],
  "golden-nugget": [
    {
      key: "enhance_value",
      label: "Enhance Value",
      description: "Strengthen the core message impact",
      icon: "💎",
    },
    {
      key: "add_evidence",
      label: "Add Evidence",
      description: "Include supporting data or examples",
      icon: "📊",
    },
    {
      key: "clarify_benefit",
      label: "Clarify Benefit",
      description: "Make the value proposition clearer",
      icon: "🎯",
    },
  ],
  wta: [
    {
      key: "change_style",
      label: "Change CTA Style",
      description: "Modify the call-to-action approach",
      icon: "📢",
      hasSubmenu: true,
      options: [
        { key: "urgent", label: "Urgent", description: "Create sense of urgency" },
        { key: "soft_ask", label: "Soft Ask", description: "Gentle invitation to act" },
        { key: "direct_command", label: "Direct Command", description: "Clear directive" },
        { key: "benefit_focused", label: "Benefit-focused", description: "Emphasize user benefits" },
        { key: "curiosity_driven", label: "Curiosity-driven", description: "Spark interest to learn more" },
      ],
    },
  ],
};

export function AIMenuBar({ element, position, onAction, onClose }: AIMenuBarProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 400),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  const getElementTypeLabel = (type: ScriptElement["type"]) => {
    switch (type) {
      case "hook":
        return "Hook";
      case "bridge":
        return "Bridge";
      case "golden-nugget":
        return "Golden Nugget";
      case "wta":
        return "Call-to-Action";
      default:
        return "Element";
    }
  };

  const getElementTypeColor = (type: ScriptElement["type"]) => {
    switch (type) {
      case "hook":
        return "bg-script-hook text-script-hook-foreground";
      case "bridge":
        return "bg-script-bridge text-script-bridge-foreground";
      case "golden-nugget":
        return "bg-script-golden-nugget text-script-golden-nugget-foreground";
      case "wta":
        return "bg-script-wta text-script-wta-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) return;
    onAction("custom_prompt", customPrompt);
    setCustomPrompt("");
    onClose();
  };

  const handleActionSelect = (actionKey: string, option?: string) => {
    onAction(actionKey, undefined, option);
    setIsDropdownOpen(false);
    onClose();
  };

  const componentActions = COMPONENT_SPECIFIC_ACTIONS[element.type] || [];
  const allActions = [...UNIVERSAL_ACTIONS, ...componentActions];

  return (
    <div className="pointer-events-none fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      <Card
        ref={menuRef}
        className="pointer-events-auto absolute w-96 shadow-lg"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          zIndex: 1000,
          border: "1px solid var(--border)",
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-purple-500" />
              <span className="font-medium">AI Menu</span>
              <Badge className={`${getElementTypeColor(element.type)} text-xs`}>
                {getElementTypeLabel(element.type)}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-muted-foreground max-w-full text-sm">
            <div className="bg-muted max-h-16 overflow-y-auto rounded p-2 text-xs break-words">"{element.text}"</div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Custom Prompt Input */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Custom AI Instruction</label>
            <div className="flex gap-2">
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom AI prompt..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleCustomPromptSubmit();
                  }
                }}
              />
              <Button onClick={handleCustomPromptSubmit} disabled={!customPrompt.trim()} className="shrink-0" size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">Press Cmd+Enter (Mac) or Ctrl+Enter (Windows) to submit</p>
          </div>

          <Separator />

          {/* AI Actions Dropdown */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">Quick Actions</label>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Select an AI action
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="start">
                {/* Universal Actions */}
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Universal Actions</div>
                {UNIVERSAL_ACTIONS.map((action) => (
                  <div key={action.key}>
                    {action.hasSubmenu ? (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <span className="mr-2">{action.icon}</span>
                          <div className="flex flex-col items-start">
                            <span className="text-sm">{action.label}</span>
                            <span className="text-muted-foreground text-xs">{action.description}</span>
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {action.options?.map((option) => (
                            <DropdownMenuItem
                              key={option.key}
                              onClick={() => handleActionSelect(action.key, option.key)}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm">{option.label}</span>
                                <span className="text-muted-foreground text-xs">{option.description}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <DropdownMenuItem onClick={() => handleActionSelect(action.key)}>
                        <span className="mr-2">{action.icon}</span>
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{action.label}</span>
                          <span className="text-muted-foreground text-xs">{action.description}</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>
                ))}

                {/* Component-Specific Actions */}
                {componentActions.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                      {getElementTypeLabel(element.type)} Actions
                    </div>
                    {componentActions.map((action) => (
                      <div key={action.key}>
                        {action.hasSubmenu ? (
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <span className="mr-2">{action.icon}</span>
                              <div className="flex flex-col items-start">
                                <span className="text-sm">{action.label}</span>
                                <span className="text-muted-foreground text-xs">{action.description}</span>
                              </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {action.options?.map((option) => (
                                <DropdownMenuItem
                                  key={option.key}
                                  onClick={() => handleActionSelect(action.key, option.key)}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm">{option.label}</span>
                                    <span className="text-muted-foreground text-xs">{option.description}</span>
                                  </div>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        ) : (
                          <DropdownMenuItem onClick={() => handleActionSelect(action.key)}>
                            <span className="mr-2">{action.icon}</span>
                            <div className="flex flex-col items-start">
                              <span className="text-sm">{action.label}</span>
                              <span className="text-muted-foreground text-xs">{action.description}</span>
                            </div>
                          </DropdownMenuItem>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
