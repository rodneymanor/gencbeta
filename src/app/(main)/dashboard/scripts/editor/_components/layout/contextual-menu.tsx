"use client";

import { useState, useEffect } from "react";

import { Sparkles, Edit3, BarChart3, Copy, Trash2, RefreshCw, Zap, Target, Link, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type ScriptElementType = "hook" | "bridge" | "golden-nugget" | "cta";

interface ContextualMenuProps {
  elementType: ScriptElementType;
  elementText: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAction: (action: string, elementType: ScriptElementType, text: string) => void;
  isVisible: boolean;
}

const elementConfig = {
  hook: {
    icon: Zap,
    label: "Hook",
    color: "bg-yellow-500",
    actions: [
      { id: "enhance", label: "Enhance Hook", icon: Sparkles, description: "Make it more engaging" },
      { id: "analyze", label: "Analyze Impact", icon: BarChart3, description: "Check engagement potential" },
      { id: "alternatives", label: "Generate Alternatives", icon: RefreshCw, description: "Create variations" },
    ],
  },
  bridge: {
    icon: Link,
    label: "Bridge",
    color: "bg-blue-500",
    actions: [
      { id: "strengthen", label: "Strengthen Connection", icon: Sparkles, description: "Improve flow" },
      { id: "analyze", label: "Analyze Transition", icon: BarChart3, description: "Check coherence" },
      { id: "rephrase", label: "Rephrase", icon: Edit3, description: "Improve clarity" },
    ],
  },
  "golden-nugget": {
    icon: Target,
    label: "Golden Nugget",
    color: "bg-orange-500",
    actions: [
      { id: "amplify", label: "Amplify Value", icon: Sparkles, description: "Enhance impact" },
      { id: "analyze", label: "Analyze Value", icon: BarChart3, description: "Assess importance" },
      { id: "expand", label: "Expand Details", icon: Edit3, description: "Add more context" },
    ],
  },
  cta: {
    icon: Megaphone,
    label: "Call to Action",
    color: "bg-green-500",
    actions: [
      { id: "optimize", label: "Optimize CTA", icon: Sparkles, description: "Increase conversion" },
      { id: "analyze", label: "Analyze Effectiveness", icon: BarChart3, description: "Check persuasiveness" },
      { id: "test", label: "A/B Test Ideas", icon: RefreshCw, description: "Generate variants" },
    ],
  },
};

export function ContextualMenu({
  elementType,
  elementText,
  position,
  onClose,
  onAction,
  isVisible,
}: ContextualMenuProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const config = elementConfig[elementType];
  const IconComponent = config?.icon;

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-contextual-menu]")) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isAnimating && !isVisible) return null;

  const handleAction = (actionId: string) => {
    onAction(actionId, elementType, elementText);
    onClose();
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-200 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -100%)",
      }}
      data-contextual-menu
    >
      <Card className="w-64 shadow-lg" style={{ border: "1px solid var(--border)" }}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="border-b p-[var(--space-2)]">
            <div className="flex items-center gap-[var(--space-1)]">
              <div className={`rounded-md p-[var(--space-1)] ${config.color}`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                <p className="text-muted-foreground mt-[calc(var(--space-1)/2)] truncate text-xs">
                  {elementText.length > 40 ? `${elementText.substring(0, 40)}...` : elementText}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-[var(--space-1)] p-[var(--space-1)]">
            {config.actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className="hover:bg-accent h-auto w-full justify-start p-[var(--space-1)]"
                onClick={() => handleAction(action.id)}
              >
                <action.icon className="text-muted-foreground mr-[var(--space-1)] h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{action.label}</div>
                  <div className="text-muted-foreground text-xs">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>

          <Separator />

          {/* General Actions */}
          <div className="space-y-[var(--space-1)] p-[var(--space-1)]">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-start"
              onClick={() => handleAction("copy")}
            >
              <Copy className="text-muted-foreground mr-[var(--space-1)] h-4 w-4" />
              <span className="text-sm">Copy Text</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-start"
              onClick={() => handleAction("edit")}
            >
              <Edit3 className="text-muted-foreground mr-[var(--space-1)] h-4 w-4" />
              <span className="text-sm">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => handleAction("delete")}
            >
              <Trash2 className="mr-[var(--space-1)] h-4 w-4" />
              <span className="text-sm">Delete</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
