"use client";

import { useEffect, useRef } from "react";

import { X, Lightbulb, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { generateContextualActions, type ScriptElement, type ContextualAction } from "@/lib/script-analysis";

interface ContextualActionMenuProps {
  element: ScriptElement;
  position: { x: number; y: number };
  onAction: (action: ContextualAction, element: ScriptElement) => void;
  onClose: () => void;
}

export function ContextualActionMenu({ element, position, onAction, onClose }: ContextualActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = generateContextualActions(element);

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
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 400),
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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50" style={{ pointerEvents: "none" }}>
      <Card
        ref={menuRef}
        className="pointer-events-auto absolute w-80 shadow-lg"
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
              <Badge className={`${getElementTypeColor(element.type)} text-xs`}>
                {getElementTypeLabel(element.type)}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getConfidenceColor(element.confidence)}`}>
                {(element.confidence * 100).toFixed(0)}% confidence
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="text-muted-foreground max-w-full text-sm">
            <div className="mb-1 font-medium">Selected Text:</div>
            <div className="bg-muted max-h-20 overflow-y-auto rounded p-2 text-xs break-words">
              &ldquo;{element.text}&rdquo;
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Suggestions */}
          {element.suggestions && element.suggestions.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-1">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Suggestions</span>
              </div>
              <div className="space-y-1">
                {element.suggestions.map((suggestion, index) => (
                  <div key={index} className="text-muted-foreground bg-muted/50 rounded p-2 text-xs">
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Actions */}
          <div className="space-y-2">
            <div className="mb-2 flex items-center gap-1">
              <Zap className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Quick Actions</span>
            </div>

            {actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => onAction(action, element)}
                className="h-auto w-full justify-start p-2 text-left"
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">{action.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-muted-foreground text-xs">{action.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
