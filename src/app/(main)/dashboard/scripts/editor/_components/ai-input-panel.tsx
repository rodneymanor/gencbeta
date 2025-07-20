"use client";

import { useState, useRef, useEffect } from "react";

import { Send, Wand2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { type ScriptElement } from "@/lib/script-analysis";

interface ScriptBlock {
  type: "hook" | "bridge" | "golden-nugget" | "wta";
  label: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

interface AIInputPanelProps {
  element: ScriptElement | ScriptBlock;
  position: { x: number; y: number };
  onAction: (actionType: string, customPrompt?: string, option?: string) => void;
  onTextUpdate?: (newText: string) => void;
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
    description: "Modify the emotional tone",
    icon: "🎭",
    hasSubmenu: true,
    options: [
      { key: "professional", label: "Professional", description: "Formal business tone" },
      { key: "casual", label: "Casual", description: "Relaxed informal tone" },
      { key: "friendly", label: "Friendly", description: "Warm approachable tone" },
      { key: "confident", label: "Confident", description: "Assertive self-assured tone" },
      { key: "persuasive", label: "Persuasive", description: "Compelling convincing tone" },
    ],
  },
];

const COMPONENT_ACTIONS: Record<ScriptElement["type"] | ScriptBlock["type"], AIAction[]> = {
  hook: [
    {
      key: "change_hook_style",
      label: "Change Hook Style",
      description: "Rewrite with different opening style",
      icon: "🎣",
      hasSubmenu: true,
      options: [
        { key: "question", label: "Question-based", description: "Start with engaging question" },
        { key: "statistic", label: "Statistic-driven", description: "Open with compelling data" },
        { key: "story", label: "Story-driven", description: "Begin with narrative" },
        { key: "provocative", label: "Provocative", description: "Bold controversial statement" },
        { key: "direct", label: "Direct Statement", description: "Get straight to the point" },
        { key: "contrarian", label: "Contrarian", description: "Challenge common beliefs" },
      ],
    },
  ],
  bridge: [
    {
      key: "change_bridge_style",
      label: "Change Bridge Style",
      description: "Modify transition approach",
      icon: "🌉",
      hasSubmenu: true,
      options: [
        { key: "smooth", label: "Smooth Transition", description: "Gentle logical flow" },
        { key: "contrast", label: "Contrast-based", description: "Highlight differences" },
        { key: "problem_solution", label: "Problem-Solution", description: "Present issue then resolution" },
      ],
    },
  ],
  "golden-nugget": [
    {
      key: "enhance_value",
      label: "Enhance Value",
      description: "Strengthen core message impact",
      icon: "💎",
    },
    {
      key: "add_evidence",
      label: "Add Evidence",
      description: "Include supporting data or examples",
      icon: "📊",
    },
  ],
  wta: [
    {
      key: "change_cta_style",
      label: "Change CTA Style",
      description: "Modify call-to-action approach",
      icon: "📢",
      hasSubmenu: true,
      options: [
        { key: "urgent", label: "Urgent", description: "Create sense of urgency" },
        { key: "soft_ask", label: "Soft Ask", description: "Gentle invitation to act" },
        { key: "direct_command", label: "Direct Command", description: "Clear directive" },
        { key: "benefit_focused", label: "Benefit-focused", description: "Emphasize user benefits" },
      ],
    },
  ],
};

export function AIInputPanel({ element, position, onAction, onTextUpdate, onClose }: AIInputPanelProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Execute AI action with API call
  const executeAIAction = async (actionType: string, option?: string, customPrompt?: string) => {
    setIsLoading(true);
    try {
      let response;

      if (actionType === "humanize") {
        response = await fetch("/api/humanize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: element.text }),
        });
      } else if (actionType === "shorten") {
        response = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: element.text }),
        });
      } else {
        // Use the general AI action endpoint
        response = await fetch("/api/ai-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: element.text,
            actionType,
            option,
            customPrompt,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const newText = data.humanizedText || data.shortenedText || data.modifiedText;
        if (newText && onTextUpdate) {
          onTextUpdate(newText);
        }
        onClose();
      } else {
        throw new Error(data.error || "Action failed");
      }
    } catch (error) {
      console.error("AI action failed:", error);
      // You could add toast notification here
      alert(`Action failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Close panel when isOpen changes
  useEffect(() => {
    if (!isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Create virtual trigger element at the click position
  useEffect(() => {
    if (triggerRef.current) {
      triggerRef.current.style.position = "fixed";
      triggerRef.current.style.left = `${position.x}px`;
      triggerRef.current.style.top = `${position.y}px`;
      triggerRef.current.style.width = "1px";
      triggerRef.current.style.height = "1px";
      triggerRef.current.style.pointerEvents = "none";
      triggerRef.current.style.zIndex = "9999";
    }
  }, [position]);

  const handleCustomPromptSubmit = async () => {
    if (!customPrompt.trim()) return;
    await executeAIAction("custom_prompt", undefined, customPrompt);
    setCustomPrompt("");
  };

  const handleActionSelect = async (actionKey: string, option?: string) => {
    // Execute action with API call
    await executeAIAction(actionKey, option);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCustomPromptSubmit();
    }
  };

  const componentActions = COMPONENT_ACTIONS[element.type] || [];

  return (
    <>
      {/* Virtual trigger element positioned at click location */}
      <div ref={triggerRef} className="pointer-events-none fixed" />

      {/* Main AI Panel using Popover for smart positioning */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div ref={triggerRef} className="pointer-events-none fixed" />
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 shadow-lg"
          side="bottom"
          align="start"
          avoidCollisions={true}
          collisionPadding={20}
          sideOffset={5}
        >
          {/* AI Input Section */}
          <div className="border-border border-b p-3">
            <div className="relative">
              <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                <Wand2 className="h-4 w-4" />
              </div>
              <Input
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI to do something..."
                className="pr-10 pl-10"
                autoFocus
                disabled={isLoading}
              />
              {customPrompt.trim() && (
                <Button
                  onClick={handleCustomPromptSubmit}
                  size="sm"
                  className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0"
                  disabled={isLoading}
                >
                  <Send className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="border-border border-b p-3">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Processing...
              </div>
            </div>
          )}

          {/* AI Actions Section */}
          <div className="max-h-80 space-y-1 overflow-y-auto p-3">
            {/* Universal Actions */}
            <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Universal Actions</div>
            {UNIVERSAL_ACTIONS.map((action) => (
              <div key={action.key}>
                {action.hasSubmenu ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="hover:bg-accent/50 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <span className="text-sm">{action.icon}</span>
                        <div className="flex min-w-0 flex-1 items-center justify-between">
                          <span className="text-sm font-medium">{action.label}</span>
                          <ChevronRight className="text-muted-foreground h-3 w-3" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" avoidCollisions={true} collisionPadding={20}>
                      {action.options?.map((option) => (
                        <DropdownMenuItem
                          key={option.key}
                          onClick={() => handleActionSelect(action.key, option.key)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{option.label}</span>
                            <span className="text-muted-foreground text-xs">{option.description}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    onClick={() => handleActionSelect(action.key)}
                    className="hover:bg-accent/50 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  >
                    <span className="text-sm">{action.icon}</span>
                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                  </button>
                )}
              </div>
            ))}

            {/* Component-Specific Actions */}
            {componentActions.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                  {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Actions
                </div>
                {componentActions.map((action) => (
                  <div key={action.key}>
                    {action.hasSubmenu ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="hover:bg-accent/50 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                          >
                            <span className="text-sm">{action.icon}</span>
                            <div className="flex min-w-0 flex-1 items-center justify-between">
                              <span className="text-sm font-medium">{action.label}</span>
                              <ChevronRight className="text-muted-foreground h-3 w-3" />
                            </div>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" avoidCollisions={true} collisionPadding={20}>
                          {action.options?.map((option) => (
                            <DropdownMenuItem
                              key={option.key}
                              onClick={() => handleActionSelect(action.key, option.key)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{option.label}</span>
                                <span className="text-muted-foreground text-xs">{option.description}</span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        onClick={() => handleActionSelect(action.key)}
                        className="hover:bg-accent/50 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <span className="text-sm">{action.icon}</span>
                        <div className="flex min-w-0 flex-1 items-center justify-between">
                          <span className="text-sm font-medium">{action.label}</span>
                        </div>
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
