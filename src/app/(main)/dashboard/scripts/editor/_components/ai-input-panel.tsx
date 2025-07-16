"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Wand2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ScriptElement } from "@/lib/script-analysis";
import { HumanizePopup } from "./humanize-popup";
import { ShortenPopup } from "./shorten-popup";
import { FloatingSubmenu } from "./floating-submenu";

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
  const [showHumanizePopup, setShowHumanizePopup] = useState(false);
  const [showShortenPopup, setShowShortenPopup] = useState(false);
  const [showFloatingSubmenu, setShowFloatingSubmenu] = useState(false);
  const [activeSubmenuAction, setActiveSubmenuAction] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const triggerRef = useRef<HTMLDivElement>(null);

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

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) return;
    onAction("custom_prompt", customPrompt);
    setCustomPrompt("");
    onClose();
  };

  const handleActionSelect = (
    actionKey: string,
    option?: string,
    hasSubmenu?: boolean,
    actionElement?: HTMLElement,
  ) => {
    if (hasSubmenu && !option) {
      setActiveSubmenuAction(actionKey);
      setShowFloatingSubmenu(true);
    } else if (actionKey === "humanize") {
      setShowHumanizePopup(true);
      setIsOpen(false); // Close the main panel
    } else if (actionKey === "shorten") {
      setShowShortenPopup(true);
      setIsOpen(false); // Close the main panel
    } else {
      // Execute action and close
      onAction(actionKey, undefined, option);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCustomPromptSubmit();
    }
  };

  const handleHumanizeAccept = (humanizedText: string) => {
    if (onTextUpdate) {
      onTextUpdate(humanizedText);
    }
    setShowHumanizePopup(false);
    onClose();
  };

  const handleHumanizeReject = () => {
    setShowHumanizePopup(false);
    setIsOpen(true); // Reopen the main panel
  };

  const handleShortenAccept = (shortenedText: string) => {
    if (onTextUpdate) {
      onTextUpdate(shortenedText);
    }
    setShowShortenPopup(false);
    onClose();
  };

  const handleShortenReject = () => {
    setShowShortenPopup(false);
    setIsOpen(true); // Reopen the main panel
  };

  const handleSubmenuOptionSelect = (optionKey: string) => {
    if (activeSubmenuAction) {
      onAction(activeSubmenuAction, undefined, optionKey);
      setShowFloatingSubmenu(false);
      setActiveSubmenuAction(null);
      setIsOpen(false);
    }
  };

  const handleSubmenuClose = () => {
    setShowFloatingSubmenu(false);
    setActiveSubmenuAction(null);
    setIsOpen(true); // Reopen the main panel
  };

  const componentActions = COMPONENT_ACTIONS[element.type] || [];
  const allActions = [...UNIVERSAL_ACTIONS, ...componentActions];

  // Get the current submenu action and its data
  const currentSubmenuAction = activeSubmenuAction
    ? allActions.find((action) => action.key === activeSubmenuAction)
    : null;

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
          className="w-80 p-0 shadow-lg"
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
              />
              {customPrompt.trim() && (
                <Button
                  onClick={handleCustomPromptSubmit}
                  size="sm"
                  className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* AI Actions Section */}
          <div className="max-h-80 space-y-1 overflow-y-auto p-3">
            {/* Universal Actions */}
            <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Universal Actions</div>
            {UNIVERSAL_ACTIONS.map((action) => (
              <button
                key={action.key}
                onClick={(e) => handleActionSelect(action.key, undefined, action.hasSubmenu, e.currentTarget)}
                className="hover:bg-accent/20 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150"
              >
                <span className="text-sm">{action.icon}</span>
                <div className="flex min-w-0 flex-1 items-center justify-between">
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.hasSubmenu && <ChevronRight className="text-muted-foreground h-3 w-3" />}
                </div>
              </button>
            ))}

            {/* Component-Specific Actions */}
            {componentActions.length > 0 && (
              <>
                <Separator className="my-2" />
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">
                  {element.type.charAt(0).toUpperCase() + element.type.slice(1)} Actions
                </div>
                {componentActions.map((action) => (
                  <button
                    key={action.key}
                    onClick={(e) => handleActionSelect(action.key, undefined, action.hasSubmenu, e.currentTarget)}
                    className="hover:bg-accent/20 hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150"
                  >
                    <span className="text-sm">{action.icon}</span>
                    <div className="flex min-w-0 flex-1 items-center justify-between">
                      <span className="text-sm font-medium">{action.label}</span>
                      {action.hasSubmenu && <ChevronRight className="text-muted-foreground h-3 w-3" />}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Humanize Popup with improved positioning */}
      {showHumanizePopup && (
        <Popover open={showHumanizePopup} onOpenChange={setShowHumanizePopup}>
          <PopoverTrigger asChild>
            <div ref={triggerRef} className="pointer-events-none fixed" />
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 shadow-lg"
            side="right"
            align="start"
            avoidCollisions={true}
            collisionPadding={20}
            sideOffset={10}
          >
            <HumanizePopup
              originalText={element.text}
              onAccept={handleHumanizeAccept}
              onReject={handleHumanizeReject}
              onRefresh={() => {}} // Handled internally
              embedded={true}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Shorten Popup with improved positioning */}
      {showShortenPopup && (
        <Popover open={showShortenPopup} onOpenChange={setShowShortenPopup}>
          <PopoverTrigger asChild>
            <div ref={triggerRef} className="pointer-events-none fixed" />
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 shadow-lg"
            side="right"
            align="start"
            avoidCollisions={true}
            collisionPadding={20}
            sideOffset={10}
          >
            <ShortenPopup
              originalText={element.text}
              onAccept={handleShortenAccept}
              onReject={handleShortenReject}
              onRefresh={() => {}} // Handled internally
              embedded={true}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* Floating Submenu */}
      {showFloatingSubmenu && currentSubmenuAction && currentSubmenuAction.options && (
        <FloatingSubmenu
          options={currentSubmenuAction.options}
          position={{ x: position.x + 300, y: position.y }}
          onOptionSelect={handleSubmenuOptionSelect}
          onClose={handleSubmenuClose}
          actionLabel={currentSubmenuAction.label}
          actionIcon={currentSubmenuAction.icon}
        />
      )}
    </>
  );
}
